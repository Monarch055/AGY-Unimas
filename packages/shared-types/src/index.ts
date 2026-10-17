/**
 * @rekasains/shared-types
 * Single Source of Truth TypeScript DTOs aligned 1:1 with:
 * - contracts/api/openapi.yaml (v1.1.0)
 * - contracts/events/PAYLOAD_CONTRACT.md (v1.1)
 *
 * ZERO BUSINESS LOGIC ALLOWED IN THIS PACKAGE.
 */

export type RegionCode = 'ID' | 'MY';

export type UserRole = 'STUDENT' | 'TEACHER';

export type AgeAdaptiveLevelEnum =
  | 'SD_ELEMENTARY'
  | 'SMP_LOWER_SEC'
  | 'SMA_UPPER_SEC'
  | 'HIGHER_ED_UNI';

export type CurriculumCodeEnum =
  | 'ID_KURIKULUM_MERDEKA'
  | 'ID_DIKTI_HIGHER_ED'
  | 'MY_KSSR'
  | 'MY_KSSM'
  | 'MY_MATRIKULASI_UNI';

export type MaterialCategoryEnum =
  | 'RECYCLED'
  | 'KITCHEN_CHEMICAL'
  | 'HOUSEHOLD_TOOL'
  | 'ELECTRONICS'
  | 'LAB_APPARATUS';

export type SafetySeverityEnum =
  | 'SAFE'
  | 'ADULT_SUPERVISION'
  | 'CRITICAL_CO_LOCATION_WARNING'
  | 'CRITICAL_HAZARD_BLOCKED';

export type MatchTierEnum =
  | 'STRICT_100'
  | 'DIY_SUBSTITUTE'
  | 'LOCAL_MICRO_SHOP';

export type CurrencyCodeEnum = 'IDR' | 'MYR_SEN';

export type ExpectedGraphTrendEnum =
  | 'LINEAR_PROPORTIONAL'
  | 'INVERSE'
  | 'EXPONENTIAL'
  | 'POLYNOMIAL';

export type AROverlayTypeEnum =
  | 'NONE'
  | 'ELECTRON_FLOW'
  | 'FORCE_VECTOR'
  | 'FLUID_PRESSURE'
  | 'MAGNETIC_FIELD'
  | 'MOLECULAR_REACTION';

export type ARAnimationStyleEnum =
  | 'FLOWING_PARTICLES'
  | 'PULSING_ARROW'
  | 'PRESSURE_WAVE';

export type SupportedImageMimeType = 'image/webp' | 'image/jpeg' | 'image/png';

// ============================================================================
// 1. Health & Error Envelopes
// ============================================================================

export interface HealthCheckResponse {
  status: string;
  service: string;
  timestamp: string;
}

export interface ApiErrorEnvelope {
  error_code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// 2. Inventory & Active Co-Location Safety DTOs (USP #1 & #7)
// ============================================================================

export interface InventoryScanRequest {
  image_base64: string;
  mime_type: SupportedImageMimeType;
  region: RegionCode;
}

export interface InventoryItemInput {
  material_slug: string;
  quantity: number;
  unit: string;
}

export interface InventoryItemDTO {
  material_slug: string;
  name_local: string;
  category: MaterialCategoryEnum;
  quantity: number;
  unit: string;
  confidence: number;
}

export interface SafetyAlertDTO {
  rule_code: string;
  severity: SafetySeverityEnum;
  involved_materials: string[];
  message_local: string;
}

export interface InventoryScanResponse {
  scan_id: string;
  region: RegionCode;
  detected_items: InventoryItemDTO[];
  active_workspace_hazards: SafetyAlertDTO[];
}

export interface InventoryConfirmRequest {
  region: RegionCode;
  items: InventoryItemInput[];
}

export interface InventoryConfirmResponse {
  status: string;
  total_items: number;
  safety_alerts: SafetyAlertDTO[];
}

export interface InventoryListResponse {
  items: InventoryItemDTO[];
}

// ============================================================================
// 3. 3-Tier Matcher, Functional Substitutes & Local Shop DTOs (USP #2, #3, #4)
// ============================================================================

export interface RecommendationMatchRequest {
  region: RegionCode;
  curriculum_code: CurriculumCodeEnum;
  age_adaptive_level: AgeAdaptiveLevelEnum;
  grade_level: string;
  user_role: UserRole;
  inventory_items: InventoryItemInput[];
}

export interface FunctionalMaterialSubstituteDTO {
  missing_material_slug: string;
  missing_name_local: string;
  substitute_material_slug: string;
  substitute_name_local: string;
  shared_scientific_principle: string;
  adaptation_steps: string[];
}

export interface LocalSourcingItemDTO {
  material_slug: string;
  name_local: string;
  missing_quantity: number;
  unit: string;
  currency: CurrencyCodeEnum;
  est_price_int: number;
  display_price: string;
  recommended_stores: string[];
  maps_search_url: string;
  marketplace_search_url: string;
}

export interface ExperimentRecommendationCardDTO {
  experiment_slug: string;
  title_local: string;
  match_tier: MatchTierEnum;
  match_percentage: number;
  age_adaptive_level: AgeAdaptiveLevelEnum;
  curriculum_badge: string;
  safety_severity: 'SAFE' | 'ADULT_SUPERVISION';
  functional_substitutes: FunctionalMaterialSubstituteDTO[];
  missing_local_shop_items: LocalSourcingItemDTO[];
}

export interface RecommendationMatchResponse {
  region: RegionCode;
  strict_100_matches: ExperimentRecommendationCardDTO[];
  diy_substitute_matches: ExperimentRecommendationCardDTO[];
  local_micro_shop_matches: ExperimentRecommendationCardDTO[];
  blocked_hazard_alerts: SafetyAlertDTO[];
}

// ============================================================================
// 4. 4-Level Age-Adaptive STEM Module & AR Overlay DTOs (USP #5, #6, #8, #9)
// ============================================================================

export interface ExperimentScaffoldRequest {
  region: RegionCode;
  curriculum_code: CurriculumCodeEnum;
  age_adaptive_level: AgeAdaptiveLevelEnum;
  grade_level: string;
  user_role: UserRole;
}

export interface ScientificVariablesAndGraphSchemaDTO {
  formulas_latex: string[];
  independent_variable: string;
  dependent_variable: string;
  control_variables: string[];
  x_axis_label: string;
  y_axis_label: string;
  expected_trend: ExpectedGraphTrendEnum;
}

export interface ARVectorPathDTO {
  label: string;
  start_x_norm: number;
  start_y_norm: number;
  end_x_norm: number;
  end_y_norm: number;
  color_hex: string;
  animation_style: ARAnimationStyleEnum;
}

export interface AROverlaySimulationDTO {
  overlay_type: AROverlayTypeEnum;
  caption_local: string;
  vector_paths: ARVectorPathDTO[];
}

export interface ExperimentStepDTO {
  step_number: number;
  instruction: string;
  requires_vision_verification: boolean;
  vision_verification_prompt: string;
  default_ar_overlay: AROverlaySimulationDTO;
  checkable: boolean;
}

export interface ReflectionQuestionDTO {
  question_id: string;
  prompt: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface CurriculumAlignmentDTO {
  curriculum_code: CurriculumCodeEnum | string;
  grade_level: string;
  competency_code: string;
  learning_objective: string;
}

export interface STEMConceptsBreakdownDTO {
  science: string;
  technology: string;
  engineering: string;
  mathematics: string;
}

export interface STEMExperimentModuleDTO {
  experiment_slug: string;
  title_local: string;
  age_adaptive_level: AgeAdaptiveLevelEnum;
  curriculum_alignment: CurriculumAlignmentDTO;
  stem_concepts: STEMConceptsBreakdownDTO;
  scientific_variables_and_graph?: ScientificVariablesAndGraphSchemaDTO;
  safety_checks: SafetyAlertDTO[];
  steps: ExperimentStepDTO[];
  reflection_questions: ReflectionQuestionDTO[];
  offline_pack_version: string;
}

// ============================================================================
// 5. Interactive Step-by-Step AI Vision Checker DTOs (USP #8 & #9)
// ============================================================================

export interface StepVisionVerifyRequest {
  image_base64: string;
  mime_type: SupportedImageMimeType;
  region: RegionCode;
  age_adaptive_level: AgeAdaptiveLevelEnum;
}

export interface StepVisionVerifyResponse {
  step_number: number;
  is_verified_correct: boolean;
  confidence: number;
  feedback_message_local: string;
  can_proceed_to_next_step: boolean;
  ar_overlay_simulation: AROverlaySimulationDTO;
}

// ============================================================================
// 6. Academic Lab Report PDF Generator & Offline Sync DTOs (USP #10)
// ============================================================================

export interface ObservationDataRowDTO {
  trial_number: number;
  x_value: number;
  y_value: number;
  notes: string;
}

export interface LabReportGenerateRequest {
  region: RegionCode;
  age_adaptive_level: AgeAdaptiveLevelEnum;
  student_name: string;
  institution_name: string;
  class_or_nim: string;
  instructor_name?: string;
  result_photo_base64: string;
  observation_data_rows: ObservationDataRowDTO[];
  reflection_answers: string[];
}

export interface LabReportGenerateResponse {
  report_id: string;
  title_local: string;
  objective_local: string;
  theoretical_summary: string;
  variables_summary?: string;
  materials_used_list: string[];
  procedure_summary: string[];
  result_analysis_discussion: string;
  conclusion_local: string;
  generated_at_utc: string;
}

export interface OfflineCompletionItemInput {
  client_mutation_id: string;
  experiment_slug: string;
  completed_at_utc: string;
  checked_steps: number[];
  quiz_score: number;
  optional_photo_base64: string | null;
}

export interface OfflineProgressSyncRequest {
  completions: OfflineCompletionItemInput[];
}

export interface AwardedBadgeDTO {
  badge_code: string;
  title_local: string;
  icon_slug: string;
}

export interface OfflineProgressSyncResponse {
  synced_count: number;
  total_xp: number;
  newly_awarded_badges: AwardedBadgeDTO[];
}

// ============================================================================
// 7. Asynchronous Event Broker Contracts (contracts/events/PAYLOAD_CONTRACT.md)
// ============================================================================

export type RekaSainsEventRoutingKey =
  | 'inventory.scan.completed'
  | 'experiment.module.requested'
  | 'experiment.module.synthesized'
  | 'experiment.step.verified'
  | 'lab_report.synthesized'
  | 'experiment.completed';

export interface RekaSainsEventEnvelope<TPayload = Record<string, unknown>> {
  event_id: string;
  event_type: RekaSainsEventRoutingKey;
  source: 'services/core-api' | 'services/ai-agent';
  timestamp: string;
  version: '1.1';
  data: TPayload;
}
