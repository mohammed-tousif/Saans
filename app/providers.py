"""Provider adapters for environmental data.

Base class and Open-Meteo CAMS implementation.
"""

from __future__ import annotations

import abc
import logging
import math
from datetime import datetime, timedelta, timezone

import httpx

from app.schemas import DataSourceKind, EnvironmentalContext, Pollutant

logger = logging.getLogger(__name__)


class ProviderError(Exception):
    """Raised when a data provider fails."""

    pass


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

    def __init__(self, timeout: int = 10):
        self.timeout = timeout

    async def fetch(self, latitude: float, longitude: float, label: str) -> EnvironmentalContext:
        """Fetch current air quality from Open-Meteo."""
        params = {
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
        except httpx.TimeoutException:
            raise ProviderError(f"Open-Meteo request timed out after {self.timeout}s")
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                raise ProviderError("Open-Meteo rate limit exceeded. Please try again later.")
            raise ProviderError(f"Open-Meteo returned HTTP {e.response.status_code}")
        except httpx.RequestError as e:
            raise ProviderError("Open-Meteo request failed") from e
        except ValueError as e:
            raise ProviderError("Open-Meteo returned malformed JSON") from e

        return self._parse_response(data, latitude, longitude, label, retrieved_at)

    def _parse_response(
        self,
        data: dict,
        latitude: float,
        longitude: float,
        label: str,
        retrieved_at: datetime,
    ) -> EnvironmentalContext:
        """Parse Open-Meteo response into normalized environmental context."""
        if not isinstance(data, dict):
            raise ProviderError("Invalid provider response")
        current = data.get("current", {})

        if not isinstance(current, dict) or not current:
            raise ProviderError("Open-Meteo returned empty current data")

        # Parse observation time from the response
        time_str = current.get("time", "")
        observed_at = None
        if time_str:
            try:
                # Open-Meteo returns ISO format without timezone (local time per request)
                observed_at = datetime.fromisoformat(time_str)
                if observed_at.tzinfo is None:
                    offset = data.get("utc_offset_seconds")
                    if isinstance(offset, bool) or not isinstance(offset, (int, float)):
                        raise ValueError("Missing UTC offset")
                    observed_at = observed_at.replace(tzinfo=timezone(timedelta(seconds=offset)))
                observed_at = observed_at.astimezone(timezone.utc)
            except (ValueError, TypeError, OverflowError):
                observed_at = None
                logger.warning(f"Could not parse Open-Meteo time: {time_str}")

        # Build pollutant list from available data
        pollutants = []
        quality_flags = []
        units = data.get("current_units", {})
        if not isinstance(units, dict):
            units = {}
        pollutant_map = {
            "pm2_5": ("PM2.5", "µg/m³"),
            "pm10": ("PM10", "µg/m³"),
            "nitrogen_dioxide": ("NO₂", "µg/m³"),
            "ozone": ("O₃", "µg/m³"),
            "sulphur_dioxide": ("SO₂", "µg/m³"),
            "carbon_monoxide": ("CO", "µg/m³"),
        }

        for field, (name, unit) in pollutant_map.items():
            value = current.get(field)
            if value is not None:
                if (
                    isinstance(value, bool)
                    or not isinstance(value, (int, float))
                    or not math.isfinite(value)
                    or value < 0
                ):
                    quality_flags.append(f"invalid_{field}")
                    continue
                if units.get(field, "").replace("μ", "µ") != unit:
                    quality_flags.append(f"unknown_unit_{field}")
                    continue
                pollutants.append(
                    Pollutant(
                        name=name,
                        value=float(value),
                        unit=unit,
                        averaging_period="model current timestep",
                    )
                )

        # European AQI from Open-Meteo (do NOT relabel as Indian AQI)
        european_aqi = current.get("european_aqi")
        if european_aqi is not None and (
            isinstance(european_aqi, bool)
            or not isinstance(european_aqi, (int, float))
            or not math.isfinite(european_aqi)
            or european_aqi < 0
        ):
            quality_flags.append("invalid_index")
            european_aqi = None
        category = None
        if european_aqi is not None:
            category = self._european_aqi_category(european_aqi)

        # Check staleness — model data valid for a few hours
        is_stale = observed_at is None
        if observed_at:
            age_hours = (retrieved_at - observed_at).total_seconds() / 3600
            is_stale = age_hours > 3 or age_hours < -1

        if observed_at is None:
            quality_flags.append("unknown_data_time")
        if is_stale:
            quality_flags.append("stale_data")
        if not pollutants:
            quality_flags.append("no_pollutant_data")

        return EnvironmentalContext(
            provider="Open-Meteo (CAMS)",
            source_url=self.SOURCE_URL,
            source_kind=DataSourceKind.MODEL,
            location_label=label,
            latitude=data.get("latitude", latitude),
            longitude=data.get("longitude", longitude),
            spatial_resolution_km=45.0,  # Explicit global domain
            observed_at=observed_at,
            retrieved_at=retrieved_at,
            timezone="Asia/Kolkata",
            index_system="European AQI" if european_aqi is not None else None,
            index_value=float(european_aqi) if european_aqi is not None else None,
            category=category,
            pollutants=pollutants,
            quality_flags=quality_flags,
            is_stale=is_stale,
            attribution=self.ATTRIBUTION,
        )

    @staticmethod
    def _european_aqi_category(value: int) -> str:
        """European AQI category labels. NOT Indian AQI."""
        if value <= 20:
            return "Good"
        elif value <= 40:
            return "Fair"
        elif value <= 60:
            return "Moderate"
        elif value <= 80:
            return "Poor"
        elif value <= 100:
            return "Very Poor"
        else:
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
