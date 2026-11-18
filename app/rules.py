"""Deterministic rules engine for action filtering and constraint enforcement.

Code owns constraints, feasibility, and resource checks.
Gemini composes; rules enforce.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

from app.schemas import (
    ActionRecord,
    BudgetBand,
    EnvironmentalContext,
    HouseholdProfile,
    SourceRecord,
    TransportMode,
)

logger = logging.getLogger(__name__)

KNOWLEDGE_DIR = Path(__file__).parent.parent / "knowledge"

# Budget ordering for comparison
BUDGET_ORDER = {
    BudgetBand.ZERO: 0,
    BudgetBand.LOW: 1,
    BudgetBand.MODERATE: 2,
    BudgetBand.FLEXIBLE: 3,
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


def classify_pollution_level(context: EnvironmentalContext) -> str:
    """Classify pollution level from environmental context.

    Uses PM2.5 concentration if available, then falls back to index value.
    Returns: 'low', 'moderate', 'high', or 'unknown'.
    """
    if context.is_stale or "provider_unavailable" in context.quality_flags:
        return "unknown"

    # Fallback to European AQI if available
    if context.index_value is not None and context.index_system and "European" in context.index_system:
        if context.index_value <= 20:
            return "low"
        elif context.index_value <= 40:
            return "moderate"
        else:
            return "high"

    return "unknown"


def filter_eligible_actions(
    profile: HouseholdProfile,
    context: EnvironmentalContext,
) -> list[ActionRecord]:
    """Filter action catalogue to those feasible for this household and conditions.

    Rules:
    - Budget must be within household's band
    - Required resources must be available
    - Contraindications must not match profile
    - Eligible conditions must match current pollution level
    """
    all_actions = load_actions()
    pollution_level = classify_pollution_level(context)

    # Build resource availability set
    available_resources = set()
    if profile.has_purifier:
        available_resources.add("purifier")
    if profile.has_exhaust_fan:
        available_resources.add("exhaust_fan")
    if profile.has_cross_ventilation:
        available_resources.add("cross_ventilation")
    if TransportMode.PUBLIC_TRANSIT in profile.available_transport:
        available_resources.add("public_transit")
    if TransportMode.CAR in profile.available_transport:
        available_resources.add("car")
    if TransportMode.CYCLE in profile.available_transport:
        available_resources.add("cycle")

    # Build contraindication set from profile
    active_contraindications = set()
    if not profile.has_purifier:
        pass  # Not a contraindication — just means purifier actions are filtered by resources
    if profile.has_mobility_limitation:
        active_contraindications.add("mobility_limitation")
    if profile.flexibility_minutes < 15:
        active_contraindications.add("no_flexible_time")
    if TransportMode.PUBLIC_TRANSIT not in profile.available_transport:
        active_contraindications.add("no_public_transit")
    if pollution_level == "high":
        active_contraindications.add("high_pollution")
    if profile.indoor_cooking_fuel in ("lpg", "biomass"):
        active_contraindications.add("indoor_combustion_active")
    if not profile.has_exhaust_fan and not profile.has_cross_ventilation:
        active_contraindications.add("no_ventilation_alternative")

    eligible = []
    for action in all_actions:
        if not action.enabled:
            continue
        if action.id == "ACT015" and not profile.has_children:
            continue
        # Check budget
        if BUDGET_ORDER.get(BudgetBand(action.budget_band), 0) > BUDGET_ORDER.get(profile.budget_band, 0):
            continue

        # Check required resources
        if action.required_resources:
            if not all(r in available_resources for r in action.required_resources):
                continue

        # Check contraindications
        if action.contraindications:
            if any(c in active_contraindications for c in action.contraindications):
                continue

        # Check eligible conditions
        if action.eligible_conditions:
            condition_match = False
            for cond in action.eligible_conditions:
                if cond == "any_pollution":
                    condition_match = True
                    break
                elif cond == "high_pollution" and pollution_level == "high":
                    condition_match = True
                    break
                elif cond == "moderate_pollution" and pollution_level == "moderate":
                    condition_match = True
                    break
                elif cond == "low_pollution" and pollution_level == "low":
                    condition_match = True
                    break
            if not condition_match:
                continue

        eligible.append(action)

    # Sort: zero-cost first, then by purpose (exposure before emissions)
    eligible.sort(key=lambda a: (
        BUDGET_ORDER.get(BudgetBand(a.budget_band), 0),
        0 if a.purpose == "exposure" else 1,
    ))

    return eligible


def validate_plan_actions(
    action_ids: list[str],
    profile: HouseholdProfile,
    context: EnvironmentalContext,
) -> tuple[list[str], list[str]]:
    """Validate that AI-proposed action IDs are legitimate and feasible.

    Returns (valid_ids, rejection_reasons).
    """
    eligible = filter_eligible_actions(profile, context)
    eligible_ids = {a.id for a in eligible}
    all_known_ids = {a.id for a in load_actions()}

    valid = []
    rejections = []

    for aid in action_ids:
        if aid not in all_known_ids:
            rejections.append(f"Unknown action ID: {aid}")
        elif aid not in eligible_ids:
            rejections.append(f"Action {aid} not eligible for this profile/conditions")
        else:
            valid.append(aid)

    return valid, rejections


def validate_evidence_ids(evidence_ids: list[str]) -> tuple[list[str], list[str]]:
    """Validate that cited evidence IDs exist in the source catalogue."""
    sources = load_sources()
    valid = []
    invalid = []
    for eid in evidence_ids:
        if eid in sources:
            valid.append(eid)
        else:
            invalid.append(eid)
    return valid, invalid


def check_fixed_constraints_preserved(
    profile: HouseholdProfile,
    plan_actions: list[dict],
) -> list[str]:
    """Check that fixed routine blocks are not moved or removed by the plan.

    Returns list of violation descriptions.
    """
    violations = []
    fixed_blocks = [b for b in profile.routine_blocks if b.is_fixed]

    for block in fixed_blocks:
        # Check if any action tries to move or override a fixed block
        for action in plan_actions:
            affected = action.get("affected_routine", "")
            time_window = action.get("time_window", "")
            if block.label.lower() in affected.lower():
                # An action references a fixed routine — check it doesn't suggest moving it
                if "move" in action.get("reason", "").lower() or "reschedule" in action.get("reason", "").lower():
                    violations.append(
                        f"Action '{action.get('title', '')}' attempts to move fixed block '{block.label}' "
                        f"({block.start_time}–{block.end_time})"
                    )

    return violations
