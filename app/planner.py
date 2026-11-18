"""Gemini-powered plan generation service.

Gemini composes explanations and plans from eligible action records.
Code owns constraint enforcement, validation, and arithmetic.
"""

from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime, timezone

from app.config import settings
from app.rules import (
    classify_pollution_level,
    filter_eligible_actions,
    load_actions,
    load_sources,
    validate_evidence_ids,
    validate_plan_actions,
)
from app.schemas import (
    EnvironmentalContext,
    HouseholdProfile,
    PlanAction,
    PlanGenerationMode,
    PlanResponse,
)

logger = logging.getLogger(__name__)

# Maximum input/output sizes for Gemini
MAX_PROMPT_CHARS = 8000
MAX_OUTPUT_TOKENS = 4096


def _build_input_fingerprint(profile: HouseholdProfile, context: EnvironmentalContext) -> str:
    """Create a fingerprint to detect stale responses after city/profile changes."""
    data = f"{profile.city}:{profile.budget_band}:{context.retrieved_at.isoformat()}"
    return hashlib.sha256(data.encode()).hexdigest()[:16]


def _build_prompt(
    profile: HouseholdProfile,
    context: EnvironmentalContext,
    eligible_actions: list,
    constraint_changes: list[str] | None = None,
) -> str:
    """Build the Gemini prompt with structured context.

    User text and source excerpts are DATA, not instructions.
    """
    pollution_level = classify_pollution_level(context)

    # Summarize environmental context
    env_summary = f"City: {context.location_label}\n"
    env_summary += f"Data source: {context.provider} ({context.source_kind.value})\n"
    if context.index_system and context.index_value is not None:
        env_summary += f"Air quality: {context.index_system} = {context.index_value}"
        if context.category:
            env_summary += f" ({context.category})"
        env_summary += "\n"
    for p in context.pollutants[:6]:
        env_summary += f"  {p.name}: {p.value} {p.unit}\n"
    env_summary += f"Pollution level classification: {pollution_level}\n"
    if context.is_stale:
        env_summary += "⚠ Data is stale (older than freshness threshold)\n"
    if context.observed_at:
        env_summary += f"Data time: {context.observed_at.isoformat()}\n"

    # Summarize household
    household_summary = f"Budget: {profile.budget_band.value}\n"
    household_summary += f"Transport: {', '.join(t.value for t in profile.available_transport)}\n"
    household_summary += f"Purifier: {'yes' if profile.has_purifier else 'no'}\n"
    household_summary += f"Exhaust fan: {'yes' if profile.has_exhaust_fan else 'no'}\n"
    household_summary += f"Cross ventilation: {'yes' if profile.has_cross_ventilation else 'no'}\n"
    household_summary += f"Cooking fuel: {profile.indoor_cooking_fuel}\n"
    if profile.has_children:
        household_summary += "Has children: yes\n"
    if profile.has_elderly:
        household_summary += "Has elderly members: yes\n"
    if profile.has_respiratory_concern:
        household_summary += "Has respiratory concerns: yes (provide cautious advice)\n"
    household_summary += f"Flexibility: {profile.flexibility_minutes} minutes\n"

    # Fixed commitments
    if profile.routine_blocks:
        household_summary += "\nFixed commitments (DO NOT move or remove):\n"
        for block in profile.routine_blocks:
            fixed_label = " [FIXED]" if block.is_fixed else ""
            household_summary += f"  - {block.label}: {block.start_time}–{block.end_time} ({block.location}){fixed_label}\n"

    # Format eligible actions
    actions_text = ""
    for a in eligible_actions[:12]:  # Limit to keep prompt bounded
        actions_text += f"\n[{a.id}] {a.title}\n"
        actions_text += f"  Purpose: {a.purpose.value}\n"
        actions_text += f"  Explanation: {a.approved_explanation}\n"
        actions_text += f"  Evidence: {', '.join(a.evidence_ids)}\n"
        actions_text += f"  Limitations: {a.limitations}\n"

    constraint_text = ""
    if constraint_changes:
        constraint_text = "\n\nCONSTRAINT CHANGES (the user has changed these):\n"
        for c in constraint_changes:
            constraint_text += f"  - {c}\n"
        constraint_text += "Adapt the plan to these changes. Explain what changed and why.\n"

    prompt = f"""You are Saans, a household air-quality planning assistant.

Create a practical daily plan for this household based on their specific situation.

ENVIRONMENTAL CONTEXT:
{env_summary}

HOUSEHOLD PROFILE:
{household_summary}

ELIGIBLE ACTIONS (choose from these ONLY — use their exact IDs):
{actions_text}
{constraint_text}

INSTRUCTIONS:
1. Select exactly 3 actions from the eligible list that best fit this household.
2. For each action, explain WHY it fits THIS specific household (not generic advice).
3. Create a simple morning/afternoon/evening timeline incorporating the actions around fixed commitments.
4. If the data is stale or uncertain, mention this in your summary.
5. NEVER recommend actions not in the eligible list.
6. NEVER invent measurements, citations, or health guarantees.
7. NEVER move or remove fixed commitments.
8. If someone has respiratory concerns, prioritize caution.
9. Distinguish between reducing exposure (personal protection) and reducing emissions (environmental contribution).

Respond in this exact JSON format:
{{
  "context_summary": "One sentence about today's conditions for this household",
  "actions": [
    {{
      "action_id": "ACTxxx",
      "title": "Action title from catalogue",
      "time_window": "morning/afternoon/evening or specific time",
      "affected_routine": "which routine block is affected, if any",
      "reason": "Why this specific action helps THIS household",
      "evidence_ids": ["Sxx"],
      "resources_needed": [],
      "tradeoff": "What the household gives up or should consider",
      "assumptions": "What we're assuming or don't know"
    }}
  ],
  "timeline": [
    {{"period": "Morning (6:00–12:00)", "actions": ["Brief action descriptions"], "notes": ""}},
    {{"period": "Afternoon (12:00–17:00)", "actions": ["Brief action descriptions"], "notes": ""}},
    {{"period": "Evening (17:00–22:00)", "actions": ["Brief action descriptions"], "notes": ""}}
  ],
  "warnings": ["Any important caveats"]
}}

Respond ONLY with valid JSON. No markdown, no explanation outside the JSON."""

    # Truncate if too long
    if len(prompt) > MAX_PROMPT_CHARS:
        prompt = prompt[:MAX_PROMPT_CHARS]
        logger.warning("Prompt truncated to %d chars", MAX_PROMPT_CHARS)

    return prompt


def _build_fallback_plan(
    profile: HouseholdProfile,
    context: EnvironmentalContext,
    eligible_actions: list,
) -> PlanResponse:
    """Build a deterministic fallback plan when AI is unavailable."""
    # Take top 3 eligible actions
    selected = eligible_actions[:3]
    plan_actions = []
    for i, action in enumerate(selected):
        periods = ["Morning", "Afternoon", "Evening"]
        plan_actions.append(PlanAction(
            action_id=action.id,
            title=action.title,
            time_window=periods[i] if i < 3 else "Any time",
            affected_routine="",
            reason=action.approved_explanation,
            evidence_ids=action.evidence_ids,
            resources_needed=action.required_resources,
            tradeoff=action.limitations,
            assumptions="This is reviewed general guidance, not a personalized AI plan.",
        ))

    pollution_level = classify_pollution_level(context)
    return PlanResponse(
        actions=plan_actions,
        timeline=[
            {"period": "Morning (6:00–12:00)", "actions": [a.title for a in selected[:1]], "notes": ""},
            {"period": "Afternoon (12:00–17:00)", "actions": [a.title for a in selected[1:2]], "notes": ""},
            {"period": "Evening (17:00–22:00)", "actions": [a.title for a in selected[2:3]], "notes": ""},
        ],
        context_summary=f"Air quality in {context.location_label} is {pollution_level}. AI planning is currently unavailable — showing reviewed general guidance.",
        warnings=["AI planning unavailable. These are reviewed general recommendations, not personalized to your specific schedule."],
        generation_mode=PlanGenerationMode.FALLBACK,
        environmental_context=context,
        input_fingerprint=_build_input_fingerprint(profile, context),
    )


async def generate_plan(
    profile: HouseholdProfile,
    context: EnvironmentalContext,
    constraint_changes: list[str] | None = None,
) -> PlanResponse:
    """Generate a daily plan using Gemini with validation, or fall back to rules."""
    eligible = filter_eligible_actions(profile, context)

    if not eligible:
        return PlanResponse(
            actions=[],
            context_summary=f"No eligible actions found for your current profile in {context.location_label}.",
            warnings=["No actions matched your constraints and current conditions. Consider adjusting your profile."],
            generation_mode=PlanGenerationMode.FALLBACK,
            environmental_context=context,
            input_fingerprint=_build_input_fingerprint(profile, context),
        )

    if not settings.gemini_available:
        logger.warning("Gemini API key not configured — using fallback plan")
        plan = _build_fallback_plan(profile, context, eligible)
        plan.warnings.insert(0, "GEMINI_API_KEY not configured. Set it in .env to enable AI-powered planning.")
        return plan

    # Try Gemini generation
    try:
        plan = await _call_gemini(profile, context, eligible, constraint_changes)
        return plan
    except Exception as e:
        logger.error("Gemini plan generation failed: %s", e)
        plan = _build_fallback_plan(profile, context, eligible)
        plan.warnings.insert(0, f"AI planning failed: {e}. Showing reviewed fallback guidance.")
        return plan


async def _call_gemini(
    profile: HouseholdProfile,
    context: EnvironmentalContext,
    eligible: list,
    constraint_changes: list[str] | None,
) -> PlanResponse:
    """Call Gemini API and validate the response."""
    from google import genai

    client = genai.Client(api_key=settings.gemini_api_key)

    prompt = _build_prompt(profile, context, eligible, constraint_changes)

    # Request structured JSON output
    response = await client.aio.models.generate_content(
        model=settings.gemini_model,
        contents=prompt,
        config=genai.types.GenerateContentConfig(
            temperature=0.7,
            max_output_tokens=MAX_OUTPUT_TOKENS,
            response_mime_type="application/json",
        ),
    )

    # Parse and validate the response
    raw_text = response.text
    if not raw_text:
        raise ValueError("Gemini returned empty response")

    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError:
        # One bounded repair attempt
        logger.warning("Gemini returned invalid JSON, attempting repair")
        repair_response = await client.aio.models.generate_content(
            model=settings.gemini_model,
            contents=f"The following text should be valid JSON but has errors. Fix it and return ONLY valid JSON:\n\n{raw_text[:2000]}",
            config=genai.types.GenerateContentConfig(
                temperature=0.0,
                max_output_tokens=MAX_OUTPUT_TOKENS,
                response_mime_type="application/json",
            ),
        )
        try:
            parsed = json.loads(repair_response.text)
        except (json.JSONDecodeError, AttributeError):
            raise ValueError("Gemini produced invalid JSON even after repair attempt")

    # Validate action IDs
    action_ids = [a.get("action_id", "") for a in parsed.get("actions", [])]
    valid_ids, rejections = validate_plan_actions(action_ids, profile, context)

    if rejections:
        logger.warning("Plan validation rejections: %s", rejections)

    # Validate evidence IDs
    all_evidence = []
    for a in parsed.get("actions", []):
        all_evidence.extend(a.get("evidence_ids", []))
    valid_evidence, invalid_evidence = validate_evidence_ids(all_evidence)
    if invalid_evidence:
        logger.warning("Invalid evidence IDs from Gemini: %s", invalid_evidence)

    # Build validated plan actions
    plan_actions = []
    for action_data in parsed.get("actions", []):
        aid = action_data.get("action_id", "")
        if aid not in valid_ids:
            continue  # Skip invalid actions

        # Filter evidence to only valid IDs
        action_evidence = [e for e in action_data.get("evidence_ids", []) if e in {v for v in valid_evidence}]

        plan_actions.append(PlanAction(
            action_id=aid,
            title=action_data.get("title", ""),
            time_window=action_data.get("time_window", ""),
            affected_routine=action_data.get("affected_routine", ""),
            reason=action_data.get("reason", ""),
            evidence_ids=action_evidence,
            resources_needed=action_data.get("resources_needed", []),
            tradeoff=action_data.get("tradeoff", ""),
            assumptions=action_data.get("assumptions", ""),
        ))

    warnings = parsed.get("warnings", [])
    if rejections:
        warnings.append(f"Some AI-suggested actions were filtered: {'; '.join(rejections)}")

    return PlanResponse(
        actions=plan_actions,
        timeline=parsed.get("timeline", []),
        context_summary=parsed.get("context_summary", ""),
        warnings=warnings,
        generation_mode=PlanGenerationMode.AI,
        model_id=settings.gemini_model,
        source_time=context.observed_at,
        environmental_context=context,
        input_fingerprint=_build_input_fingerprint(profile, context),
    )
