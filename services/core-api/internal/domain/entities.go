package domain

import (
	"errors"
	"fmt"
	"math"
	"net/url"
	"strings"
)

// Domain Errors (Layer 1 — Zero external dependencies)
var (
	ErrExperimentNotFound    = errors.New("experiment not found in catalog")
	ErrStepNotFound          = errors.New("experiment step not found")
	ErrCriticalSafetyBlocked = errors.New("experiment blocked due to critical chemical/physical hazard")
	ErrInvalidRegion         = errors.New("region must be ID or MY")
	ErrInvalidAgeLevel       = errors.New("age_adaptive_level must be SD_ELEMENTARY, SMP_LOWER_SEC, SMA_UPPER_SEC, or HIGHER_ED_UNI")
	ErrInvalidInput          = errors.New("invalid request payload")
)

type RegionCode string

const (
	RegionID RegionCode = "ID"
	RegionMY RegionCode = "MY"
)

func ValidateRegion(r RegionCode) error {
	if r != RegionID && r != RegionMY {
		return ErrInvalidRegion
	}
	return nil
}

type AgeAdaptiveLevel string

const (
	LevelSDElementary AgeAdaptiveLevel = "SD_ELEMENTARY"
	LevelSMPLowerSec  AgeAdaptiveLevel = "SMP_LOWER_SEC"
	LevelSMAUpperSec  AgeAdaptiveLevel = "SMA_UPPER_SEC"
	LevelHigherEdUni  AgeAdaptiveLevel = "HIGHER_ED_UNI"
)

func ValidateAgeLevel(l AgeAdaptiveLevel) error {
	switch l {
	case LevelSDElementary, LevelSMPLowerSec, LevelSMAUpperSec, LevelHigherEdUni:
		return nil
	default:
		return ErrInvalidAgeLevel
	}
}

type SafetySeverity string

const (
	SeveritySafe                      SafetySeverity = "SAFE"
	SeverityAdultSupervision          SafetySeverity = "ADULT_SUPERVISION"
	SeverityCriticalCoLocationWarning SafetySeverity = "CRITICAL_CO_LOCATION_WARNING"
	SeverityCriticalHazardBlocked     SafetySeverity = "CRITICAL_HAZARD_BLOCKED"
)

type MatchTier string

const (
	TierStrict100      MatchTier = "STRICT_100"
	TierDIYSubstitute  MatchTier = "DIY_SUBSTITUTE"
	TierLocalMicroShop MatchTier = "LOCAL_MICRO_SHOP"
)

// CanonicalMaterial represents a physical material in Indonesia & Malaysia taxonomy.
// Currency values are strictly integer (EstPriceIDR in full Rupiah, EstPriceMYRSen in Sen Ringgit).
type CanonicalMaterial struct {
	Slug           string
	Category       string
	NameID         string
	NameMY         string
	AliasesID      []string
	AliasesMY      []string
	FunctionalTags []string
	DefaultUnit    string
	EstPriceIDR    int64
	EstPriceMYRSen int32
	StoreTypesID   []string
	StoreTypesMY   []string
}

func (m CanonicalMaterial) LocalName(region RegionCode) string {
	if region == RegionMY {
		return m.NameMY
	}
	return m.NameID
}

func (m CanonicalMaterial) LocalStores(region RegionCode) []string {
	if region == RegionMY {
		return m.StoreTypesMY
	}
	return m.StoreTypesID
}

// FormatLocalPrice returns the integer price, currency code, and formatted display string
// without any floating-point arithmetic.
func (m CanonicalMaterial) FormatLocalPrice(region RegionCode, quantity float64) (currency string, totalInt int64, display string) {
	qtyMultiplier := int64(math.Ceil(math.Max(1.0, quantity)))
	if region == RegionMY {
		totalSen := int64(m.EstPriceMYRSen) * qtyMultiplier
		ringgit := totalSen / 100
		sen := totalSen % 100
		return "MYR_SEN", totalSen, fmt.Sprintf("RM %d.%02d", ringgit, sen)
	}
	totalIDR := m.EstPriceIDR * qtyMultiplier
	return "IDR", totalIDR, formatRupiahInt(totalIDR)
}

func formatRupiahInt(amount int64) string {
	if amount <= 0 {
		return "Rp 0 (Barang Bekas)"
	}
	raw := fmt.Sprintf("%d", amount)
	n := len(raw)
	if n <= 3 {
		return "Rp " + raw
	}
	var parts []string
	for n > 3 {
		parts = append([]string{raw[n-3 : n]}, parts...)
		n -= 3
	}
	parts = append([]string{raw[:n]}, parts...)
	return "Rp " + strings.Join(parts, ".")
}

// BuildLocalSourcingLinks generates smart deep-links for Google Maps & local marketplace (Tokopedia/Shopee).
func (m CanonicalMaterial) BuildLocalSourcingLinks(region RegionCode) (mapsURL string, marketplaceURL string) {
	localName := m.LocalName(region)
	stores := m.LocalStores(region)
	storeQuery := "Toko terdekat"
	if len(stores) > 0 {
		storeQuery = stores[0] + " terdekat"
	}
	mapsURL = "https://www.google.com/maps/search/?api=1&query=" + url.QueryEscape(storeQuery)
	if region == RegionMY {
		marketplaceURL = "https://shopee.com.my/search?keyword=" + url.QueryEscape(localName)
	} else {
		marketplaceURL = "https://www.tokopedia.com/search?q=" + url.QueryEscape(localName)
	}
	return mapsURL, marketplaceURL
}

// FunctionalSubstituteRule defines a physics/chemistry-equivalent household material substitute (USP #3).
type FunctionalSubstituteRule struct {
	MissingMaterialSlug         string
	SubstituteMaterialSlug      string
	SharedScientificPrincipleID string
	SharedScientificPrincipleMY string
	AdaptationStepsID           []string
	AdaptationStepsMY           []string
}

func (r FunctionalSubstituteRule) LocalPrinciple(region RegionCode) string {
	if region == RegionMY {
		return r.SharedScientificPrincipleMY
	}
	return r.SharedScientificPrincipleID
}

func (r FunctionalSubstituteRule) LocalSteps(region RegionCode) []string {
	if region == RegionMY {
		return r.AdaptationStepsMY
	}
	return r.AdaptationStepsID
}

// SafetyHazardRule defines deterministic co-location & mixing safety rules (USP #7).
type SafetyHazardRule struct {
	RuleCode      string
	MaterialSlugA string
	MaterialSlugB string
	Severity      SafetySeverity
	WarningID     string
	WarningMY     string
}

func (r SafetyHazardRule) LocalWarning(region RegionCode) string {
	if region == RegionMY {
		return r.WarningMY
	}
	return r.WarningID
}

// InventoryItemInput represents user-submitted or confirmed material quantities.
type InventoryItemInput struct {
	MaterialSlug string  `json:"material_slug"`
	Quantity     float64 `json:"quantity"`
	Unit         string  `json:"unit"`
}

// InventoryItemDTO represents an enriched physical inventory item.
type InventoryItemDTO struct {
	MaterialSlug string  `json:"material_slug"`
	NameLocal    string  `json:"name_local"`
	Category     string  `json:"category"`
	Quantity     float64 `json:"quantity"`
	Unit         string  `json:"unit"`
	Confidence   float64 `json:"confidence"`
}

// SafetyAlertDTO represents an active safety warning or hazard block.
type SafetyAlertDTO struct {
	RuleCode          string         `json:"rule_code"`
	Severity          SafetySeverity `json:"severity"`
	InvolvedMaterials []string       `json:"involved_materials"`
	MessageLocal      string         `json:"message_local"`
}

// FunctionalMaterialSubstituteDTO represents a functional physics/chemistry substitute in recommendations.
type FunctionalMaterialSubstituteDTO struct {
	MissingMaterialSlug       string   `json:"missing_material_slug"`
	MissingNameLocal          string   `json:"missing_name_local"`
	SubstituteMaterialSlug    string   `json:"substitute_material_slug"`
	SubstituteNameLocal       string   `json:"substitute_name_local"`
	SharedScientificPrinciple string   `json:"shared_scientific_principle"`
	AdaptationSteps           []string `json:"adaptation_steps"`
}

// LocalSourcingItemDTO represents a cheap missing item available at local stores (Rp / RM).
type LocalSourcingItemDTO struct {
	MaterialSlug         string   `json:"material_slug"`
	NameLocal            string   `json:"name_local"`
	MissingQuantity      float64  `json:"missing_quantity"`
	Unit                 string   `json:"unit"`
	Currency             string   `json:"currency"`
	EstPriceInt          int64    `json:"est_price_int"`
	DisplayPrice         string   `json:"display_price"`
	RecommendedStores    []string `json:"recommended_stores"`
	MapsSearchURL        string   `json:"maps_search_url"`
	MarketplaceSearchURL string   `json:"marketplace_search_url"`
}

// ExperimentRecommendationCardDTO represents a matched experiment card in one of the 3 tiers.
type ExperimentRecommendationCardDTO struct {
	ExperimentSlug        string                            `json:"experiment_slug"`
	TitleLocal            string                            `json:"title_local"`
	MatchTier             MatchTier                         `json:"match_tier"`
	MatchPercentage       int                               `json:"match_percentage"`
	AgeAdaptiveLevel      AgeAdaptiveLevel                  `json:"age_adaptive_level"`
	CurriculumBadge       string                            `json:"curriculum_badge"`
	SafetySeverity        SafetySeverity                    `json:"safety_severity"`
	FunctionalSubstitutes []FunctionalMaterialSubstituteDTO `json:"functional_substitutes"`
	MissingLocalShopItems []LocalSourcingItemDTO            `json:"missing_local_shop_items"`
}

// ScientificVariablesAndGraphSchemaDTO holds LaTeX equations, variables & graph definitions for SMA & University levels.
type ScientificVariablesAndGraphSchemaDTO struct {
	FormulasLatex       []string `json:"formulas_latex"`
	IndependentVariable string   `json:"independent_variable"`
	DependentVariable   string   `json:"dependent_variable"`
	ControlVariables    []string `json:"control_variables"`
	XAxisLabel          string   `json:"x_axis_label"`
	YAxisLabel          string   `json:"y_axis_label"`
	ExpectedTrend       string   `json:"expected_trend"`
}

// ARVectorPathDTO holds normalized [0.0, 1.0] coordinates for HTML5 Canvas/SVG AR Overlay simulation.
type ARVectorPathDTO struct {
	Label          string  `json:"label"`
	StartXNorm     float64 `json:"start_x_norm"`
	StartYNorm     float64 `json:"start_y_norm"`
	EndXNorm       float64 `json:"end_x_norm"`
	EndYNorm       float64 `json:"end_y_norm"`
	ColorHex       string  `json:"color_hex"`
	AnimationStyle string  `json:"animation_style"`
}

// AROverlaySimulationDTO defines the AR Overlay layer for an experiment step.
type AROverlaySimulationDTO struct {
	OverlayType  string            `json:"overlay_type"`
	CaptionLocal string            `json:"caption_local"`
	VectorPaths  []ARVectorPathDTO `json:"vector_paths"`
}

// ClampNorm strictly clamps a coordinate to [0.0, 1.0] to prevent AR overlay drift across screen sizes.
func ClampNorm(v float64) float64 {
	if math.IsNaN(v) || math.IsInf(v, 0) {
		return 0.0
	}
	if v < 0.0 {
		return 0.0
	}
	if v > 1.0 {
		return 1.0
	}
	return math.Round(v*1000) / 1000
}

// SanitizeAROverlay guarantees all vector path coordinates lie strictly within [0.0, 1.0].
func SanitizeAROverlay(ar AROverlaySimulationDTO) AROverlaySimulationDTO {
	sanitized := AROverlaySimulationDTO{
		OverlayType:  ar.OverlayType,
		CaptionLocal: ar.CaptionLocal,
		VectorPaths:  make([]ARVectorPathDTO, len(ar.VectorPaths)),
	}
	for i, vp := range ar.VectorPaths {
		sanitized.VectorPaths[i] = ARVectorPathDTO{
			Label:          vp.Label,
			StartXNorm:     ClampNorm(vp.StartXNorm),
			StartYNorm:     ClampNorm(vp.StartYNorm),
			EndXNorm:       ClampNorm(vp.EndXNorm),
			EndYNorm:       ClampNorm(vp.EndYNorm),
			ColorHex:       vp.ColorHex,
			AnimationStyle: vp.AnimationStyle,
		}
	}
	return sanitized
}

type ExperimentStepDTO struct {
	StepNumber                 int                    `json:"step_number"`
	Instruction                string                 `json:"instruction"`
	RequiresVisionVerification bool                   `json:"requires_vision_verification"`
	VisionVerificationPrompt   string                 `json:"vision_verification_prompt"`
	DefaultAROverlay           AROverlaySimulationDTO `json:"default_ar_overlay"`
	Checkable                  bool                   `json:"checkable"`
}

type ReflectionQuestionDTO struct {
	QuestionID   string   `json:"question_id"`
	Prompt       string   `json:"prompt"`
	Options      []string `json:"options"`
	CorrectIndex int      `json:"correct_index"`
	Explanation  string   `json:"explanation"`
}

type CurriculumAlignmentDTO struct {
	CurriculumCode    string `json:"curriculum_code"`
	GradeLevel        string `json:"grade_level"`
	CompetencyCode    string `json:"competency_code"`
	LearningObjective string `json:"learning_objective"`
}

type STEMConceptsBreakdownDTO struct {
	Science     string `json:"science"`
	Technology  string `json:"technology"`
	Engineering string `json:"engineering"`
	Mathematics string `json:"mathematics"`
}

type STEMExperimentModuleDTO struct {
	ExperimentSlug              string                                `json:"experiment_slug"`
	TitleLocal                  string                                `json:"title_local"`
	AgeAdaptiveLevel            AgeAdaptiveLevel                      `json:"age_adaptive_level"`
	CurriculumAlignment         CurriculumAlignmentDTO                `json:"curriculum_alignment"`
	STEMConcepts                STEMConceptsBreakdownDTO              `json:"stem_concepts"`
	ScientificVariablesAndGraph *ScientificVariablesAndGraphSchemaDTO `json:"scientific_variables_and_graph,omitempty"`
	SafetyChecks                []SafetyAlertDTO                      `json:"safety_checks"`
	Steps                       []ExperimentStepDTO                   `json:"steps"`
	ReflectionQuestions         []ReflectionQuestionDTO               `json:"reflection_questions"`
	OfflinePackVersion          string                                `json:"offline_pack_version"`
}

// ExperimentRequiredMaterial defines a material requirement for an experiment blueprint.
type ExperimentRequiredMaterial struct {
	MaterialSlug string
	MinQuantity  float64
	Unit         string
}

// AdaptiveLevelMetadata holds level-specific pedagogical content (SD, SMP, SMA, Higher Ed).
type AdaptiveLevelMetadata struct {
	CurriculumBadgeID     string
	CurriculumBadgeMY     string
	CompetencyCodeID      string
	CompetencyCodeMY      string
	LearningObjectiveID   string
	LearningObjectiveMY   string
	STEMConceptsID        STEMConceptsBreakdownDTO
	STEMConceptsMY        STEMConceptsBreakdownDTO
	VariablesAndGraphID   *ScientificVariablesAndGraphSchemaDTO
	VariablesAndGraphMY   *ScientificVariablesAndGraphSchemaDTO
}

// ExperimentBlueprint represents a complete catalog experiment with 4-level adaptive scaffolding.
type ExperimentBlueprint struct {
	Slug                string
	TitleID             string
	TitleMY             string
	SafetySeverity      SafetySeverity
	RequiredMaterials   []ExperimentRequiredMaterial
	AdaptiveScaffolds   map[AgeAdaptiveLevel]AdaptiveLevelMetadata
	StepsID             []ExperimentStepDTO
	StepsMY             []ExperimentStepDTO
	ReflectionQuestions map[RegionCode][]ReflectionQuestionDTO
}

func (e ExperimentBlueprint) LocalTitle(region RegionCode) string {
	if region == RegionMY {
		return e.TitleMY
	}
	return e.TitleID
}

// StepVisionVerifyResponse represents the output of StepVisionAndARAgent verification.
type StepVisionVerifyResponse struct {
	StepNumber            int                    `json:"step_number"`
	IsVerifiedCorrect     bool                   `json:"is_verified_correct"`
	Confidence            float64                `json:"confidence"`
	FeedbackMessageLocal  string                 `json:"feedback_message_local"`
	CanProceedToNextStep  bool                   `json:"can_proceed_to_next_step"`
	AROverlaySimulation   AROverlaySimulationDTO `json:"ar_overlay_simulation"`
}

// ObservationDataRowDTO represents a single row in the student's observation table.
type ObservationDataRowDTO struct {
	TrialNumber int     `json:"trial_number"`
	XValue      float64 `json:"x_value"`
	YValue      float64 `json:"y_value"`
	Notes       string  `json:"notes"`
}

// LabReportGenerateRequest represents the request payload to generate an Academic Lab Report PDF draft.
type LabReportGenerateRequest struct {
	Region              RegionCode              `json:"region"`
	AgeAdaptiveLevel    AgeAdaptiveLevel        `json:"age_adaptive_level"`
	StudentName         string                  `json:"student_name"`
	InstitutionName     string                  `json:"institution_name"`
	ClassOrNIM          string                  `json:"class_or_nim"`
	InstructorName      string                  `json:"instructor_name,omitempty"`
	ResultPhotoBase64   string                  `json:"result_photo_base64"`
	ObservationDataRows []ObservationDataRowDTO `json:"observation_data_rows"`
	ReflectionAnswers   []string                `json:"reflection_answers"`
}

// LabReportGenerateResponse represents the synthesized Academic Lab Report ready for preview & PDF download.
type LabReportGenerateResponse struct {
	ReportID                 string   `json:"report_id"`
	TitleLocal               string   `json:"title_local"`
	ObjectiveLocal           string   `json:"objective_local"`
	TheoreticalSummary       string   `json:"theoretical_summary"`
	VariablesSummary         string   `json:"variables_summary,omitempty"`
	MaterialsUsedList        []string `json:"materials_used_list"`
	ProcedureSummary         []string `json:"procedure_summary"`
	ResultAnalysisDiscussion string   `json:"result_analysis_discussion"`
	ConclusionLocal          string   `json:"conclusion_local"`
	GeneratedAtUTC           string   `json:"generated_at_utc"`
}

type OfflineCompletionItemInput struct {
	ClientMutationID    string  `json:"client_mutation_id"`
	ExperimentSlug      string  `json:"experiment_slug"`
	CompletedAtUTC      string  `json:"completed_at_utc"`
	CheckedSteps        []int   `json:"checked_steps"`
	QuizScore           int     `json:"quiz_score"`
	OptionalPhotoBase64 *string `json:"optional_photo_base64"`
}

type AwardedBadgeDTO struct {
	BadgeCode  string `json:"badge_code"`
	TitleLocal string `json:"title_local"`
	IconSlug   string `json:"icon_slug"`
}

type OfflineProgressSyncResponse struct {
	SyncedCount        int               `json:"synced_count"`
	TotalXP            int               `json:"total_xp"`
	NewlyAwardedBadges []AwardedBadgeDTO `json:"newly_awarded_badges"`
}
