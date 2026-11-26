"""Normalize live CAMS and synthetic fixture data into the same schema."""

from __future__ import annotations

import abc
import logging
import math
from datetime import datetime, timedelta, timezone

import httpx

from app.schemas import DataSourceKind, EnvironmentalContext, Pollutant

logger = logging.getLogger(__name__)


POLLUTANT_NAMES = {
    "pm2_5": "PM2.5",
    "pm10": "PM10",
    "nitrogen_dioxide": "NO₂",
    "ozone": "O₃",
    "sulphur_dioxide": "SO₂",
    "carbon_monoxide": "CO",
}
POLLUTANT_UNIT = "µg/m³"
MAX_DATA_AGE = timedelta(hours=3)
MAX_FUTURE_DRIFT = timedelta(hours=1)


def _finite_number(value: object) -> float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    try:
        number = float(value)
    except OverflowError:
        return None
    return number if math.isfinite(number) else None


def _nonnegative_number(value: object) -> float | None:
    number = _finite_number(value)
    return number if number is not None and number >= 0 else None


def _coordinate(value: object, fallback: float, *, limit: int) -> float:
    number = _finite_number(value)
    return number if number is not None and abs(number) <= limit else fallback


def _parse_observed_at(value: object, utc_offset: object) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        observed_at = datetime.fromisoformat(value)
        if observed_at.tzinfo is None:
            # CAMS returns local wall time. It is usable only with the matching offset.
            seconds = _finite_number(utc_offset)
            if seconds is None:
                return None
            observed_at = observed_at.replace(tzinfo=timezone(timedelta(seconds=seconds)))
        return observed_at.astimezone(timezone.utc)
    except (ValueError, OverflowError):
        logger.warning("Could not parse Open-Meteo observation time")
        return None


def _is_stale(observed_at: datetime | None, retrieved_at: datetime) -> bool:
    if observed_at is None:
        return True
    age = retrieved_at - observed_at
    return not -MAX_FUTURE_DRIFT <= age <= MAX_DATA_AGE


def _parse_pollutants(
    current: dict[str, object], units: dict[str, object]
) -> tuple[list[Pollutant], list[str]]:
    pollutants = []
    flags = []
    for field, name in POLLUTANT_NAMES.items():
        value = current.get(field)
        if value is None:
            continue
        number = _nonnegative_number(value)
        if number is None:
            flags.append(f"invalid_{field}")
            continue
        unit = units.get(field)
        if not isinstance(unit, str) or unit.replace("μ", "µ") != POLLUTANT_UNIT:
            flags.append(f"unknown_unit_{field}")
            continue
        pollutants.append(
            Pollutant(
                name=name,
                value=number,
                unit=POLLUTANT_UNIT,
                averaging_period="model current timestep",
            )
        )
    return pollutants, flags


def _parse_index(current: dict[str, object], flags: list[str]) -> float | None:
    value = current.get("european_aqi")
    index = _nonnegative_number(value)
    if value is not None and index is None:
        flags.append("invalid_index")
    return index


class ProviderError(Exception):
    """Raised when a data provider fails."""


class BaseProvider(abc.ABC):
    """Abstract base for environmental data providers."""

    @abc.abstractmethod
    async def fetch(self, latitude: float, longitude: float, label: str) -> EnvironmentalContext:
        """Fetch environmental context for a location."""
        ...


class OpenMeteoProvider(BaseProvider):
    """Open-Meteo Air Quality API provider (CAMS global forecast data).

    This provides MODEL data from CAMS Global at ~45km resolution,
    not station observations. Attribution required per terms.
    """

    BASE_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
    ATTRIBUTION = "Air quality data by Open-Meteo.com (CAMS, Copernicus)"
    SOURCE_URL = "https://open-meteo.com/en/docs/air-quality-api"

    # Pollutant variables to request
    HOURLY_VARS = [
        "pm10",
        "pm2_5",
        "carbon_monoxide",
        "nitrogen_dioxide",
        "sulphur_dioxide",
        "ozone",
        "european_aqi",
        "european_aqi_pm2_5",
        "european_aqi_pm10",
        "european_aqi_nitrogen_dioxide",
        "european_aqi_ozone",
        "european_aqi_sulphur_dioxide",
    ]

    def __init__(self, timeout: int = 10) -> None:
        self.timeout = timeout

    async def fetch(self, latitude: float, longitude: float, label: str) -> EnvironmentalContext:
        """Fetch current air quality from Open-Meteo."""
        params: dict[str, str | float] = {
            "latitude": latitude,
            "longitude": longitude,
            "current": ",".join(self.HOURLY_VARS),
            "timezone": "Asia/Kolkata",
            "domains": "cams_global",
        }

        retrieved_at = datetime.now(timezone.utc)

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(self.BASE_URL, params=params)
                response.raise_for_status()
                data = response.json()
        except httpx.TimeoutException as error:
            raise ProviderError(f"Open-Meteo request timed out after {self.timeout}s") from error
        except httpx.HTTPStatusError as error:
            status = error.response.status_code
            if status == 429:
                raise ProviderError(
                    "Open-Meteo rate limit exceeded. Please try again later."
                ) from error
            raise ProviderError(f"Open-Meteo returned HTTP {status}") from error
        except httpx.RequestError as error:
            raise ProviderError("Open-Meteo request failed") from error
        except ValueError as error:
            raise ProviderError("Open-Meteo returned malformed JSON") from error

        return self._parse_response(data, latitude, longitude, label, retrieved_at)

    def _parse_response(
        self,
        data: object,
        latitude: float,
        longitude: float,
        label: str,
        retrieved_at: datetime,
    ) -> EnvironmentalContext:
        """Normalize a provider payload and preserve its data quality flags."""
        if not isinstance(data, dict):
            raise ProviderError("Invalid provider response")
        current = data.get("current")
        if not isinstance(current, dict) or not current:
            raise ProviderError("Open-Meteo returned empty current data")

        units = data.get("current_units")
        pollutants, flags = _parse_pollutants(current, units if isinstance(units, dict) else {})
        index = _parse_index(current, flags)
        observed_at = _parse_observed_at(current.get("time"), data.get("utc_offset_seconds"))
        is_stale = _is_stale(observed_at, retrieved_at)
        if observed_at is None:
            flags.append("unknown_data_time")
        if is_stale:
            flags.append("stale_data")
        if not pollutants:
            flags.append("no_pollutant_data")

        return EnvironmentalContext(
            provider="Open-Meteo (CAMS)",
            source_url=self.SOURCE_URL,
            source_kind=DataSourceKind.MODEL,
            location_label=label,
            latitude=_coordinate(data.get("latitude"), latitude, limit=90),
            longitude=_coordinate(data.get("longitude"), longitude, limit=180),
            spatial_resolution_km=45.0,
            observed_at=observed_at,
            retrieved_at=retrieved_at,
            timezone="Asia/Kolkata",
            index_system="European AQI" if index is not None else None,
            index_value=index,
            category=self._european_aqi_category(index) if index is not None else None,
            pollutants=pollutants,
            quality_flags=flags,
            is_stale=is_stale,
            attribution=self.ATTRIBUTION,
        )

    @staticmethod
    def _european_aqi_category(value: float) -> str:
        """European AQI category labels. NOT Indian AQI."""
        if value <= 20:
            return "Good"
        if value <= 40:
            return "Fair"
        if value <= 60:
            return "Moderate"
        if value <= 80:
            return "Poor"
        if value <= 100:
            return "Very Poor"
        return "Extremely Poor"


class FixtureProvider(BaseProvider):
    """Returns synthetic fixture data for testing. Clearly labelled."""

    async def fetch(self, latitude: float, longitude: float, label: str) -> EnvironmentalContext:
        now = datetime.now(timezone.utc)
        return EnvironmentalContext(
            provider="Fixture (synthetic test data)",
            source_url="",
            source_kind=DataSourceKind.FIXTURE,
            location_label=label,
            latitude=latitude,
            longitude=longitude,
            spatial_resolution_km=None,
            observed_at=now,
            retrieved_at=now,
            timezone="Asia/Kolkata",
            index_system="European AQI (fixture)",
            index_value=75.0,
            category="Poor (fixture)",
            pollutants=[
                Pollutant(name="PM2.5", value=120.0, unit="µg/m³", averaging_period="fixture"),
                Pollutant(name="PM10", value=200.0, unit="µg/m³", averaging_period="fixture"),
                Pollutant(name="NO₂", value=45.0, unit="µg/m³", averaging_period="fixture"),
                Pollutant(name="O₃", value=30.0, unit="µg/m³", averaging_period="fixture"),
            ],
            quality_flags=["fixture_data"],
            is_stale=False,
            attribution="Synthetic fixture data for testing — not real measurements",
        )


def get_provider(mode: str = "live", timeout: int = 10) -> BaseProvider:
    """Factory for data providers."""
    if mode == "fixture":
        return FixtureProvider()
    return OpenMeteoProvider(timeout=timeout)
