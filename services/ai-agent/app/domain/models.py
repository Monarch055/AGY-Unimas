"""
Layer 1 (Domain): Pure Domain Entities, Enums, Value Validators, and DTO Models.
Aligned 1:1 with `contracts/api/openapi.yaml` (v1.1.0) and `packages/shared-types`.
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Literal, Optional
from uuid import uuid4

from pydantic import BaseModel, Field, field_validator


class RegionCode(str, Enum):
    ID = "ID"
    MY = "MY"


class UserRole(str, Enum):
    STUDENT = "STUDENT"
    TEACHER = "TEACHER"


class AgeAdaptiveLevelEnum(str, Enum):
    SD_ELEMENTARY = "SD_ELEMENTARY"
    SMP_LOWER_SEC = "SMP_LOWER_SEC"
    SMA_UPPER_SEC = "SMA_UPPER_SEC"
    HIGHER_ED_UNI = "HIGHER_ED_UNI"


class CurriculumCodeEnum(str, Enum):
    ID_KURIKULUM_MERDEKA = "ID_KURIKULUM_MERDEKA"
    ID_DIKTI_HIGHER_ED = "ID_DIKTI_HIGHER_ED"
    MY_KSSR = "MY_KSSR"
    MY_KSSM = "MY_KSSM"
    MY_MATRIKULASI_UNI = "MY_MATRIKULASI_UNI"


class MaterialCategoryEnum(str, Enum):
    RECYCLED = "RECYCLED"
    KITCHEN_CHEMICAL = "KITCHEN_CHEMICAL"
    HOUSEHOLD_TOOL = "HOUSEHOLD_TOOL"
    ELECTRONICS = "ELECTRONICS"
    LAB_APPARATUS = "LAB_APPARATUS"


class SafetySeverityEnum(str, Enum):
    SAFE = "SAFE"
    ADULT_SUPERVISION = "ADULT_SUPERVISION"
    CRITICAL_CO_LOCATION_WARNING = "CRITICAL_CO_LOCATION_WARNING"
    CRITICAL_HAZARD_BLOCKED = "CRITICAL_HAZARD_BLOCKED"


class MatchTierEnum(str, Enum):
    STRICT_100 = "STRICT_100"
    DIY_SUBSTITUTE = "DIY_SUBSTITUTE"
    LOCAL_MICRO_SHOP = "LOCAL_MICRO_SHOP"


class CurrencyCodeEnum(str, Enum):
    IDR = "IDR"
    MYR_SEN = "MYR_SEN"


class ExpectedGraphTrendEnum(str, Enum):
    LINEAR_PROPORTIONAL = "LINEAR_PROPORTIONAL"
    INVERSE = "INVERSE"
    EXPONENTIAL = "EXPONENTIAL"
    POLYNOMIAL = "POLYNOMIAL"


class AROverlayTypeEnum(str, Enum):
    NONE = "NONE"
    ELECTRON_FLOW = "ELECTRON_FLOW"
    FORCE_VECTOR = "FORCE_VECTOR"
    FLUID_PRESSURE = "FLUID_PRESSURE"
    MAGNETIC_FIELD = "MAGNETIC_FIELD"
    MOLECULAR_REACTION = "MOLECULAR_REACTION"


class ARAnimationStyleEnum(str, Enum):
    FLOWING_PARTICLES = "FLOWING_PARTICLES"
    PULSING_ARROW = "PULSING_ARROW"
    PRESSURE_WAVE = "PRESSURE_WAVE"


SupportedImageMimeType = Literal["image/webp", "image/jpeg", "image/png"]


def validate_normalized_coordinate(val: float) -> float:
    """Enforces normalized AR anchor coordinate invariant in [0.0, 1.0]."""
    if val < 0.0 or val > 1.0:
        raise ValueError(f"Normalized AR coordinate must be in [0.0, 1.0], got {val}")
    return round(float(val), 4)


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


# ============================================================================
# 1. Health & Agent Manifest DTOs
# ============================================================================


class HealthCheckResponse(BaseModel):
    status: str = "ok"
    service: str = "rekasains-ai-agent"
    timestamp: str = Field(default_factory=utc_now_iso)


# ============================================================================
# 2. Inventory & Active Co-Location Safety DTOs (USP #1 & #7)
# ============================================================================


class InventoryScanRequest(BaseModel):
    image_base64: str = Field(..., min_length=1)
    mime_type: SupportedImageMimeType = "image/jpeg"
    region: RegionCode = RegionCode.ID


class InventoryItemInput(BaseModel):
    material_slug: str = Field(..., min_length=1)
    quantity: float = Field(..., gt=0)
    unit: str = Field(default="pcs", min_length=1)


class InventoryItemDTO(BaseModel):
    material_slug: str
    name_local: str
    category: MaterialCategoryEnum
    quantity: float
    unit: str
    confidence: float = Field(ge=0.0, le=1.0)


class SafetyAlertDTO(BaseModel):
    rule_code: str
    severity: SafetySeverityEnum
    involved_materials: List[str]
    message_local: str


class InventoryScanResponse(BaseModel):
    scan_id: str = Field(default_factory=lambda: str(uuid4()))
    region: RegionCode
    detected_items: List[InventoryItemDTO]
    active_workspace_hazards: List[SafetyAlertDTO]


# ============================================================================
# 3. 3-Tier Matcher, Functional Substitutes & Local Shop DTOs (USP #2, #3, #4)
# ============================================================================


class RecommendationMatchRequest(BaseModel):
    region: RegionCode = RegionCode.ID
    curriculum_code: CurriculumCodeEnum = CurriculumCodeEnum.ID_KURIKULUM_MERDEKA
    age_adaptive_level: AgeAdaptiveLevelEnum = AgeAdaptiveLevelEnum.SMA_UPPER_SEC
    grade_level: str = "SMA_FASE_E"
    user_role: UserRole = UserRole.STUDENT
    inventory_items: List[InventoryItemInput]


class FunctionalMaterialSubstituteDTO(BaseModel):
    missing_material_slug: str
    missing_name_local: str
    substitute_material_slug: str
    substitute_name_local: str
    shared_scientific_principle: str
    adaptation_steps: List[str]


class LocalSourcingItemDTO(BaseModel):
    material_slug: str
    name_local: str
    missing_quantity: float
    unit: str
    currency: CurrencyCodeEnum
    est_price_int: int = Field(..., ge=0, description="Zero floating-point integer currency")
    display_price: str
    recommended_stores: List[str]
    maps_search_url: str
    marketplace_search_url: str


class ExperimentRecommendationCardDTO(BaseModel):
    experiment_slug: str
    title_local: str
    match_tier: MatchTierEnum
    match_percentage: int = Field(ge=0, le=100)
    age_adaptive_level: AgeAdaptiveLevelEnum
    curriculum_badge: str
    safety_severity: Literal["SAFE", "ADULT_SUPERVISION"]
    functional_substitutes: List[FunctionalMaterialSubstituteDTO]
    missing_local_shop_items: List[LocalSourcingItemDTO]


class RecommendationMatchResponse(BaseModel):
    region: RegionCode
    strict_100_matches: List[ExperimentRecommendationCardDTO]
    diy_substitute_matches: List[ExperimentRecommendationCardDTO]
    local_micro_shop_matches: List[ExperimentRecommendationCardDTO]
    blocked_hazard_alerts: List[SafetyAlertDTO]


# ============================================================================
# 4. 4-Level Age-Adaptive STEM Module & AR Overlay DTOs (USP #5, #6, #8, #9)
# ============================================================================


class ExperimentScaffoldRequest(BaseModel):
    region: RegionCode = RegionCode.ID
    curriculum_code: CurriculumCodeEnum = CurriculumCodeEnum.ID_KURIKULUM_MERDEKA
    age_adaptive_level: AgeAdaptiveLevelEnum = AgeAdaptiveLevelEnum.SMA_UPPER_SEC
    grade_level: str = "SMA_FASE_E"
    user_role: UserRole = UserRole.STUDENT
    inventory_items: Optional[List[InventoryItemInput]] = None


class ScientificVariablesAndGraphSchemaDTO(BaseModel):
    formulas_latex: List[str]
    independent_variable: str
    dependent_variable: str
    control_variables: List[str]
    x_axis_label: str
    y_axis_label: str
    expected_trend: ExpectedGraphTrendEnum


class ARVectorPathDTO(BaseModel):
    label: str
    start_x_norm: float
    start_y_norm: float
    end_x_norm: float
    end_y_norm: float
    color_hex: str
    animation_style: ARAnimationStyleEnum

    @field_validator("start_x_norm", "start_y_norm", "end_x_norm", "end_y_norm")
    @classmethod
    def check_normalized_bounds(cls, v: float) -> float:
        return validate_normalized_coordinate(v)


class AROverlaySimulationDTO(BaseModel):
    overlay_type: AROverlayTypeEnum
    caption_local: str
    vector_paths: List[ARVectorPathDTO]


class ExperimentStepDTO(BaseModel):
    step_number: int
    instruction: str
    requires_vision_verification: bool
    vision_verification_prompt: str
    default_ar_overlay: AROverlaySimulationDTO
    checkable: bool = True


class ReflectionQuestionDTO(BaseModel):
    question_id: str
    prompt: str
    options: List[str]
    correct_index: int
    explanation: str


class CurriculumAlignmentDTO(BaseModel):
    curriculum_code: str
    grade_level: str
    competency_code: str
    learning_objective: str


class STEMConceptsBreakdownDTO(BaseModel):
    science: str
    technology: str
    engineering: str
    mathematics: str


class STEMExperimentModuleDTO(BaseModel):
    experiment_slug: str
    title_local: str
    age_adaptive_level: AgeAdaptiveLevelEnum
    curriculum_alignment: CurriculumAlignmentDTO
    stem_concepts: STEMConceptsBreakdownDTO
    scientific_variables_and_graph: Optional[ScientificVariablesAndGraphSchemaDTO] = None
    safety_checks: List[SafetyAlertDTO]
    steps: List[ExperimentStepDTO]
    reflection_questions: List[ReflectionQuestionDTO]
    offline_pack_version: str = "1.1.0"


# ============================================================================
# 5. Interactive Step-by-Step AI Vision Checker DTOs (USP #8 & #9)
# ============================================================================


class StepVisionVerifyRequest(BaseModel):
    image_base64: str = Field(..., min_length=1)
    mime_type: SupportedImageMimeType = "image/jpeg"
    region: RegionCode = RegionCode.ID
    age_adaptive_level: AgeAdaptiveLevelEnum = AgeAdaptiveLevelEnum.SMA_UPPER_SEC


class StepVisionVerifyResponse(BaseModel):
    step_number: int
    is_verified_correct: bool
    confidence: float = Field(ge=0.0, le=1.0)
    feedback_message_local: str
    can_proceed_to_next_step: bool
    ar_overlay_simulation: AROverlaySimulationDTO


# ============================================================================
# 6. Academic Lab Report PDF Generator DTOs (USP #10)
# ============================================================================


class ObservationDataRowDTO(BaseModel):
    trial_number: int
    x_value: float
    y_value: float
    notes: str


class LabReportGenerateRequest(BaseModel):
    region: RegionCode = RegionCode.ID
    age_adaptive_level: AgeAdaptiveLevelEnum = AgeAdaptiveLevelEnum.SMA_UPPER_SEC
    student_name: str = Field(..., min_length=1)
    institution_name: str = Field(..., min_length=1)
    class_or_nim: str = Field(..., min_length=1)
    instructor_name: Optional[str] = None
    result_photo_base64: str = Field(..., min_length=1)
    observation_data_rows: List[ObservationDataRowDTO] = Field(default_factory=list)
    reflection_answers: List[str] = Field(default_factory=list)


class LabReportGenerateResponse(BaseModel):
    report_id: str = Field(default_factory=lambda: str(uuid4()))
    title_local: str
    objective_local: str
    theoretical_summary: str
    variables_summary: Optional[str] = None
    materials_used_list: List[str]
    procedure_summary: List[str]
    result_analysis_discussion: str
    conclusion_local: str
    generated_at_utc: str = Field(default_factory=utc_now_iso)


# ============================================================================
# 7. Internal SSE & Callback Event Envelope (`contracts/events/PAYLOAD_CONTRACT.md`)
# ============================================================================


class RekaSainsEventEnvelope(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid4()))
    event_type: str
    source: str = "services/ai-agent"
    timestamp: str = Field(default_factory=utc_now_iso)
    version: str = "1.1"
    data: Dict[str, Any]
