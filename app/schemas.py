"""Pydantic schemas for Saans API contracts.

All data structures for requests, responses, environmental data,
household profiles, action plans, and evidence records.
"""

from __future__ import annotations

import enum
from datetime import datetime
from typing import Literal, Self

from pydantic import BaseModel, Field, GetJsonSchemaHandler, model_validator
from pydantic.json_schema import JsonSchemaValue
from pydantic_core import CoreSchema


class _InternalSchemaDocs:
    """Keep new developer docstrings out of existing public schema definitions."""

    @classmethod
    def __get_pydantic_json_schema__(
        cls, core_schema: CoreSchema, handler: GetJsonSchemaHandler
    ) -> JsonSchemaValue:
        """Generate the original schema shape without a description."""
        schema = handler(core_schema)
        handler.resolve_ref_schema(schema).pop("description", None)
        return schema


# --- Enums ---


class DataSourceKind(_InternalSchemaDocs, str, enum.Enum):
    """Classify the provenance of an environmental record."""

    OBSERVATION = "observation"
    MODEL = "model"
    FIXTURE = "fixture"
    UNAVAILABLE = "unavailable"


class BudgetBand(_InternalSchemaDocs, str, enum.Enum):
    """Represent household spending bands in ascending cost order."""

    ZERO = "zero"
    LOW = "low"  # under ₹500/month
    MODERATE = "moderate"  # ₹500–2000/month
    FLEXIBLE = "flexible"  # above ₹2000/month


class TransportMode(_InternalSchemaDocs, str, enum.Enum):
    """Enumerate the transport options a household can report."""

    WALK = "walk"
    CYCLE = "cycle"
    PUBLIC_TRANSIT = "public_transit"
    AUTO_RICKSHAW = "auto_rickshaw"
    CAR = "car"
    MOTORCYCLE = "motorcycle"
    WORK_FROM_HOME = "work_from_home"


class ActionPurpose(_InternalSchemaDocs, str, enum.Enum):
    """Identify whether an action targets exposure, emissions or both."""

    EXPOSURE = "exposure"
    EMISSIONS = "emissions"
    BOTH = "both"


class PlanGenerationMode(_InternalSchemaDocs, str, enum.Enum):
    """Identify how the planner selected its actions."""

    AI = "ai"
    FALLBACK = "fallback"
    FIXTURE = "fixture"


# --- Environmental Data ---


class Pollutant(_InternalSchemaDocs, BaseModel):
    """Represent a pollutant value with its unit and averaging period."""

    name: str
    value: float
    unit: str
    averaging_period: str = ""


class EnvironmentalContext(BaseModel):
    """Normalized environmental record from any provider."""

    provider: str
    source_url: str
    source_kind: DataSourceKind
    location_label: str
    latitude: float
    longitude: float
    spatial_resolution_km: float | None = None
    observed_at: datetime | None = None
    retrieved_at: datetime
    valid_until: datetime | None = None
    timezone: str = "Asia/Kolkata"
    index_system: str | None = None
    index_value: float | None = None
    category: str | None = None
    pollutants: list[Pollutant] = []
    quality_flags: list[str] = []
    is_stale: bool = False
    attribution: str = ""
    provider_version: str | None = None


# --- Household Profile ---


class RoutineBlock(BaseModel):
    """A fixed time commitment in the household's day."""

    label: str = Field(..., max_length=100, description="e.g. 'School drop-off'")
    start_time: str = Field(..., pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$", description="HH:MM format")
    end_time: str = Field(..., pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    is_fixed: bool = True
    location: str = "outdoor"  # indoor/outdoor/commute

    @model_validator(mode="after")
    def validate_order(self) -> Self:
        """Validate the same-day time range and return this routine block.

        Raises:
            ValueError: The end time is at or before the start time.
        """
        if self.end_time <= self.start_time:
            raise ValueError("End time must follow start time on the same day")
        return self


class HouseholdProfile(BaseModel):
    """Household inputs for plan generation."""

    city: str = Field(..., min_length=1, max_length=100)
    routine_blocks: list[RoutineBlock] = Field(default_factory=list, max_length=12)
    available_transport: list[TransportMode] = [TransportMode.WALK, TransportMode.PUBLIC_TRANSIT]
    budget_band: BudgetBand = BudgetBand.LOW
    has_purifier: bool = False
    has_exhaust_fan: bool = True
    has_cross_ventilation: bool = True
    indoor_cooking_fuel: str = "lpg"  # lpg / electric / biomass / none
    has_children: bool = False
    has_elderly: bool = False
    has_respiratory_concern: bool = False
    has_mobility_limitation: bool = False
    flexibility_minutes: int = Field(default=30, ge=0, le=240)
    additional_notes: str = Field(default="", max_length=500)


# --- Action Catalogue ---


class ActionRecord(BaseModel):
    """A reviewed action from the curated knowledge catalogue."""

    id: str
    title: str
    purpose: ActionPurpose
    eligible_conditions: list[str] = []
    contraindications: list[str] = []
    required_resources: list[str] = []
    budget_band: BudgetBand = BudgetBand.ZERO
    time_required_minutes: int = 0
    approved_explanation: str = ""
    evidence_ids: list[str] = []
    limitations: str = ""
    reviewed_at: str = ""
    version: int = 1
    enabled: bool = False


# --- Plan Response ---


class PlanAction(BaseModel):
    """A single action in the generated plan."""

    action_id: str
    title: str
    time_window: str = ""
    affected_routine: str = ""
    reason: str = ""
    evidence_ids: list[str] = []
    resources_needed: list[str] = []
    tradeoff: str = ""
    assumptions: str = ""


class PlanResponse(BaseModel):
    """Complete plan response from the API."""

    actions: list[PlanAction] = []
    timeline: list[dict] = []  # [{period, actions, notes}]
    context_summary: str = ""
    warnings: list[str] = []
    generation_mode: PlanGenerationMode = PlanGenerationMode.AI
    model_id: str | None = None
    context_version: str | None = None
    source_time: datetime | None = None
    environmental_context: EnvironmentalContext | None = None
    input_fingerprint: str = ""
    plan_id: str = ""


# --- API Request/Response Models ---


class AirQualityRequest(_InternalSchemaDocs, BaseModel):
    """Describe a city and optional coordinates for an air-quality request."""

    city: str = Field(..., min_length=1, max_length=100)
    latitude: float | None = None
    longitude: float | None = None


class PlanRequest(_InternalSchemaDocs, BaseModel):
    """Carry a household profile and legacy comparison fields."""

    profile: HouseholdProfile
    constraint_changes: list[str] = []
    previous_plan_fingerprint: str = ""


ConstraintChange = Literal[
    "purifier_on",
    "purifier_off",
    "budget_zero",
    "budget_low",
    "transit_on",
    "transit_off",
    "more_flexibility",
    "keep_schedule",
]


class CompareRequest(_InternalSchemaDocs, BaseModel):
    """Identify the baseline and constrained changes to compare."""

    profile: HouseholdProfile
    baseline_plan_id: str = Field(min_length=1, max_length=64)
    changed_constraints: list[ConstraintChange] = Field(min_length=1, max_length=8)


class CompareResponse(_InternalSchemaDocs, BaseModel):
    """Return both plans, the revised profile and qualitative differences."""

    original_plan: PlanResponse
    revised_plan: PlanResponse
    changes_summary: list[str] = []
    preserved_constraints: list[str] = []
    impact_notes: list[str] = []
    revised_profile: HouseholdProfile


class SourceRecord(BaseModel):
    """Curated source metadata."""

    id: str
    title: str
    url: str
    organization: str
    checked_date: str
    supported_claim: str
    confidence: str
    limitations: str = ""


class HealthStatus(_InternalSchemaDocs, BaseModel):
    """Report basic server and provider configuration status."""

    status: str = "ok"
    data_mode: str = "live"
    gemini_available: bool = False
    version: str = "0.1.0"
