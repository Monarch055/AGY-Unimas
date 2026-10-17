package usecase

import (
	"context"

	"github.com/rekasains/core-api/internal/domain"
)

// CatalogRepository provides read access to the canonical material taxonomy,
// functional physics/chemistry substitutes, safety hazard rules, and 4-level experiment blueprints.
type CatalogRepository interface {
	GetMaterialBySlug(ctx context.Context, slug string) (domain.CanonicalMaterial, bool)
	ListAllMaterials(ctx context.Context) []domain.CanonicalMaterial
	GetFunctionalSubstitutesForMissing(ctx context.Context, missingSlug string) []domain.FunctionalSubstituteRule
	ListSafetyHazardRules(ctx context.Context) []domain.SafetyHazardRule
	GetExperimentBySlug(ctx context.Context, slug string) (domain.ExperimentBlueprint, bool)
	ListAllExperiments(ctx context.Context) []domain.ExperimentBlueprint
}

// InventoryRepository persists user physical inventory items.
type InventoryRepository interface {
	SaveUserInventory(ctx context.Context, userID string, items []domain.InventoryItemInput) error
	GetUserInventory(ctx context.Context, userID string) ([]domain.InventoryItemInput, error)
}

// VerificationAndReportRepository persists step vision checkpoints, lab reports, and idempotent offline sync ledger.
type VerificationAndReportRepository interface {
	SaveStepVerification(ctx context.Context, userID, experimentSlug string, resp domain.StepVisionVerifyResponse) error
	SaveLabReport(ctx context.Context, userID, experimentSlug string, req domain.LabReportGenerateRequest, resp domain.LabReportGenerateResponse) error
	RecordOfflineCompletionIdempotent(ctx context.Context, userID string, item domain.OfflineCompletionItemInput, xpAwarded int) (alreadySynced bool, totalUserXP int, totalSyncedCount int, err error)
}

// ADKAgentGateway communicates with services/ai-agent (Python Google ADK 6-Sub-Agent Engine)
// and provides deterministic fallback when ai-agent is unreachable or running in standalone test mode.
type ADKAgentGateway interface {
	ExtractInventoryFromImage(ctx context.Context, imageBase64, mimeType string, region domain.RegionCode) ([]domain.InventoryItemDTO, error)
	VerifyExperimentStepVision(ctx context.Context, exp domain.ExperimentBlueprint, step domain.ExperimentStepDTO, imageBase64 string, region domain.RegionCode, level domain.AgeAdaptiveLevel) (domain.StepVisionVerifyResponse, error)
	SynthesizeLabReport(ctx context.Context, exp domain.ExperimentBlueprint, req domain.LabReportGenerateRequest) (domain.LabReportGenerateResponse, error)
}

// EventPublisher publishes asynchronous domain events to RabbitMQ (rekasains.events).
type EventPublisher interface {
	PublishEvent(ctx context.Context, routingKey string, payload map[string]any) error
}
