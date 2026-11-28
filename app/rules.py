"""Select reviewed actions that fit the household and air conditions."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Literal

from app.providers import EUROPEAN_AQI_FAIR_MAX, EUROPEAN_AQI_GOOD_MAX
from app.schemas import (
    ActionPurpose,
    ActionRecord,
    BudgetBand,
    EnvironmentalContext,
    HouseholdProfile,
    SourceRecord,
    TransportMode,
)

KNOWLEDGE_DIR = Path(__file__).parent.parent / "knowledge"

BUDGET_ORDER = {
    BudgetBand.ZERO: 0,
    BudgetBand.LOW: 1,
    BudgetBand.MODERATE: 2,
    BudgetBand.FLEXIBLE: 3,
}
FAMILY_ACTIVITY_ID = "ACT015"
MIN_FLEXIBILITY_MINUTES = 15
TRANSPORT_RESOURCES = {TransportMode.PUBLIC_TRANSIT, TransportMode.CAR, TransportMode.CYCLE}

PollutionLevel = Literal["low", "moderate", "high", "unknown"]
POLLUTION_CONDITIONS = {
    "low": "low_pollution",
    "moderate": "moderate_pollution",
    "high": "high_pollution",
}


def load_actions() -> list[ActionRecord]:
    """Load curated action records from the knowledge catalogue."""
    path = KNOWLEDGE_DIR / "actions.json"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return [ActionRecord(**item) for item in data]


def load_sources() -> dict[str, SourceRecord]:
    """Load curated source records, keyed by ID."""
    path = KNOWLEDGE_DIR / "sources.json"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {item["id"]: SourceRecord(**item) for item in data}


def classify_pollution_level(context: EnvironmentalContext) -> PollutionLevel:
    """Group a fresh European AQI value for the action catalogue's conditions."""
    if context.is_stale or "provider_unavailable" in context.quality_flags:
        return "unknown"
    value = context.index_value
    if value is None or "European" not in (context.index_system or ""):
        return "unknown"
    if value <= EUROPEAN_AQI_GOOD_MAX:
        return "low"
    if value <= EUROPEAN_AQI_FAIR_MAX:
        return "moderate"
    return "high"


def _available_resources(profile: HouseholdProfile) -> set[str]:
    """Translate household inputs into the resource keys used by the catalogue."""
    home_resources = {
        "purifier": profile.has_purifier,
        "exhaust_fan": profile.has_exhaust_fan,
        "cross_ventilation": profile.has_cross_ventilation,
    }
    available = {name for name, present in home_resources.items() if present}
    available.update(
        mode.value for mode in profile.available_transport if mode in TRANSPORT_RESOURCES
    )
    return available


def _contraindications(
    profile: HouseholdProfile, pollution_level: PollutionLevel, resources: set[str]
) -> set[str]:
    """Derive the catalogue exclusions that apply to this household and air context."""
    flags = {
        "mobility_limitation": profile.has_mobility_limitation,
        "no_flexible_time": profile.flexibility_minutes < MIN_FLEXIBILITY_MINUTES,
        "no_public_transit": "public_transit" not in resources,
        "high_pollution": pollution_level == "high",
        "indoor_combustion_active": profile.indoor_cooking_fuel in {"lpg", "biomass"},
        "no_ventilation_alternative": resources.isdisjoint({"exhaust_fan", "cross_ventilation"}),
    }
    return {name for name, active in flags.items() if active}


def _matches_pollution(action: ActionRecord, level: PollutionLevel) -> bool:
    """Allow unconditional actions or match the action's required pollution band."""
    conditions = action.eligible_conditions
    if not conditions or "any_pollution" in conditions:
        return True
    expected = POLLUTION_CONDITIONS.get(level)
    return expected is not None and expected in conditions


def _eligible_for_household(
    action: ActionRecord,
    profile: HouseholdProfile,
    resources: set[str],
    contraindications: set[str],
) -> bool:
    """Require an enabled action whose audience, cost, resources and exclusions all fit."""
    return (
        action.enabled
        and (action.id != FAMILY_ACTIVITY_ID or profile.has_children)
        and BUDGET_ORDER[action.budget_band] <= BUDGET_ORDER[profile.budget_band]
        and resources.issuperset(action.required_resources)
        and contraindications.isdisjoint(action.contraindications)
    )


def _priority(action: ActionRecord) -> tuple[int, bool]:
    """Prefer affordable actions and then exposure reduction within each budget."""
    return BUDGET_ORDER[action.budget_band], action.purpose != ActionPurpose.EXPOSURE


def filter_eligible_actions(
    profile: HouseholdProfile, context: EnvironmentalContext
) -> list[ActionRecord]:
    """Return feasible actions sorted by budget and purpose in catalogue order."""
    level = classify_pollution_level(context)
    resources = _available_resources(profile)
    contraindications = _contraindications(profile, level, resources)
    eligible = (
        action
        for action in load_actions()
        if _eligible_for_household(action, profile, resources, contraindications)
        and _matches_pollution(action, level)
    )
    return sorted(eligible, key=_priority)
