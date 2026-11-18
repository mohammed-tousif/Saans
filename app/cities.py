"""City definitions with coordinates for supported Indian cities."""

from __future__ import annotations

SUPPORTED_CITIES: dict[str, dict] = {
    "delhi": {
        "label": "Delhi NCR",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "timezone": "Asia/Kolkata",
    },
    "mumbai": {
        "label": "Mumbai",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "timezone": "Asia/Kolkata",
    },
    "chennai": {
        "label": "Chennai",
        "latitude": 13.0827,
        "longitude": 80.2707,
        "timezone": "Asia/Kolkata",
    },
    "kolkata": {
        "label": "Kolkata",
        "latitude": 22.5726,
        "longitude": 88.3639,
        "timezone": "Asia/Kolkata",
    },
    "bengaluru": {
        "label": "Bengaluru",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "timezone": "Asia/Kolkata",
    },
    "hyderabad": {
        "label": "Hyderabad",
        "latitude": 17.3850,
        "longitude": 78.4867,
        "timezone": "Asia/Kolkata",
    },
    "lucknow": {
        "label": "Lucknow",
        "latitude": 26.8467,
        "longitude": 80.9462,
        "timezone": "Asia/Kolkata",
    },
    "patna": {
        "label": "Patna",
        "latitude": 25.5941,
        "longitude": 85.1376,
        "timezone": "Asia/Kolkata",
    },
}


def get_city(city_key: str) -> dict | None:
    """Get city info by key (case-insensitive)."""
    return SUPPORTED_CITIES.get(city_key.lower().strip())


def list_cities() -> list[dict]:
    """Return list of supported cities with their keys."""
    return [{"key": k, **v} for k, v in SUPPORTED_CITIES.items()]
