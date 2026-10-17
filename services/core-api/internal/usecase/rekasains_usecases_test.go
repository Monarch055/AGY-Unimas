package usecase_test

import (
	"context"
	"testing"

	"github.com/rekasains/core-api/internal/delivery/events"
	"github.com/rekasains/core-api/internal/domain"
	"github.com/rekasains/core-api/internal/gateway"
	"github.com/rekasains/core-api/internal/repository"
	"github.com/rekasains/core-api/internal/usecase"
)

func setupTestUseCase() (*usecase.RekaSainsControlPlaneUseCase, *events.InternalSSEEventEmitter) {
	store := repository.NewSeededStore()
	adkGw := gateway.NewHybridADKGateway("http://127.0.0.1:59999/ai/v1") // unreachable port triggers deterministic fallback
	pub := events.NewInternalSSEEventEmitter(nil)
	uc := usecase.NewRekaSainsControlPlaneUseCase(store, store, store, adkGw, pub)
	return uc, pub
}

// Test 1: Active Co-Location Chemical Safety Recall (USP #7)
func TestScanWorkspaceInventory_ActiveCoLocationHazardRecall(t *testing.T) {
	uc, _ := setupTestUseCase()
	ctx := context.Background()

	_, items, hazards, err := uc.ScanWorkspaceInventory(ctx, "data:image/webp;base64,HAZARD_BLEACH_ACID_TEST", "image/webp", domain.RegionID)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(items) == 0 {
		t.Fatalf("expected detected items, got 0")
	}
	if len(hazards) == 0 {
		t.Fatalf("expected CRITICAL_CO_LOCATION_WARNING when bleach and acidic floor cleaner are co-located")
	}

	foundCoLocationRule := false
	for _, h := range hazards {
		if h.RuleCode == "HAZ_CO_LOCATED_BLEACH_AND_ACID_CLEANER" && h.Severity == domain.SeverityCriticalCoLocationWarning {
			foundCoLocationRule = true
		}
	}
	if !foundCoLocationRule {
		t.Fatalf("expected HAZ_CO_LOCATED_BLEACH_AND_ACID_CLEANER alert, got %+v", hazards)
	}
}

// Test 2: 3-Tier Matcher + Functional Physics/Chemistry Substitute (PVC Pipe -> Thick Plastic Straw) (USP #2, #3, #4)
func TestMatchThreeTierExperiments_FunctionalSubstituteAndStrict100(t *testing.T) {
	uc, _ := setupTestUseCase()
	ctx := context.Background()

	// User has plastic_bottle_pet_600ml + thick_plastic_straw (missing pvc_pipe_half_inch!)
	inventory := []domain.InventoryItemInput{
		{MaterialSlug: "plastic_bottle_pet_600ml", Quantity: 1, Unit: "pcs"},
		{MaterialSlug: "thick_plastic_straw", Quantity: 2, Unit: "pcs"},
	}

	strict100, diySub, localShop, _, err := uc.MatchThreeTierExperiments(
		ctx,
		domain.RegionID,
		domain.LevelSMAUpperSec,
		inventory,
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(strict100) != 0 {
		t.Fatalf("expected 0 strict_100 matches when pvc_pipe_half_inch is missing, got %d", len(strict100))
	}

	foundPneumaticRocketInDIY := false
	for _, card := range diySub {
		if card.ExperimentSlug == "roket-tekanan-fluida-pipa-air" {
			foundPneumaticRocketInDIY = true
			if len(card.FunctionalSubstitutes) == 0 {
				t.Fatalf("expected functional substitute for pvc_pipe_half_inch")
			}
			sub := card.FunctionalSubstitutes[0]
			if sub.MissingMaterialSlug != "pvc_pipe_half_inch" || sub.SubstituteMaterialSlug != "thick_plastic_straw" {
				t.Fatalf("unexpected substitute mapping: %+v", sub)
			}
		}
	}
	if !foundPneumaticRocketInDIY {
		t.Fatalf("expected roket-tekanan-fluida-pipa-air in diy_substitute_matches, got %+v (localShop: %+v)", diySub, localShop)
	}
}

// Test 3: 4-Level Age-Adaptive Scaffolding (SD vs SMA/University with LaTeX & Variables) (USP #5 & #6)
func TestScaffoldExperimentModule_FourLevelAdaptive(t *testing.T) {
	uc, _ := setupTestUseCase()
	ctx := context.Background()

	sdMod, err := uc.ScaffoldExperimentModule(ctx, "rangkaian-listrik-baterai-kaleng-ar", domain.RegionID, "ID_KURIKULUM_MERDEKA", domain.LevelSDElementary, "SD_FASE_C")
	if err != nil {
		t.Fatalf("unexpected error for SD: %v", err)
	}
	if sdMod.ScientificVariablesAndGraph != nil {
		t.Fatalf("expected nil ScientificVariablesAndGraph for SD_ELEMENTARY")
	}

	uniMod, err := uc.ScaffoldExperimentModule(ctx, "rangkaian-listrik-baterai-kaleng-ar", domain.RegionMY, "MY_MATRIKULASI_UNI", domain.LevelHigherEdUni, "UNI_YEAR_1")
	if err != nil {
		t.Fatalf("unexpected error for Higher Ed: %v", err)
	}
	if uniMod.ScientificVariablesAndGraph == nil || len(uniMod.ScientificVariablesAndGraph.FormulasLatex) == 0 {
		t.Fatalf("expected LaTeX formulas and variables for HIGHER_ED_UNI")
	}
}

// Test 4: Step Vision Verification, Normalized AR Coordinates & Lab Report Synthesis (USP #8, #9, #10)
func TestVerifyStepAndGenerateLabReport(t *testing.T) {
	uc, _ := setupTestUseCase()
	ctx := context.Background()

	stepResp, err := uc.VerifyStepVisionAndAR(
		ctx,
		"user-test-1",
		"rangkaian-listrik-baterai-kaleng-ar",
		1,
		"data:image/webp;base64,VALID_STEP_1_PHOTO",
		domain.RegionID,
		domain.LevelSMAUpperSec,
	)
	if err != nil {
		t.Fatalf("unexpected step verify error: %v", err)
	}
	if !stepResp.IsVerifiedCorrect || !stepResp.CanProceedToNextStep {
		t.Fatalf("expected step 1 to be verified correct")
	}
	for _, vp := range stepResp.AROverlaySimulation.VectorPaths {
		if vp.StartXNorm < 0.0 || vp.StartXNorm > 1.0 || vp.EndXNorm < 0.0 || vp.EndXNorm > 1.0 {
			t.Fatalf("AR coordinate out of [0.0, 1.0] bounds: %+v", vp)
		}
	}

	reportResp, err := uc.GenerateAcademicLabReport(ctx, "user-test-1", "rangkaian-listrik-baterai-kaleng-ar", domain.LabReportGenerateRequest{
		Region:           domain.RegionID,
		AgeAdaptiveLevel: domain.LevelSMAUpperSec,
		StudentName:      "Budi Santoso",
		InstitutionName:  "SMAN 1 Bandung",
		ClassOrNIM:       "XI IPA 1",
		InstructorName:   "Ibu Siti, S.Pd.",
		ResultPhotoBase64: "data:image/webp;base64,RESULT_PHOTO",
		ObservationDataRows: []domain.ObservationDataRowDTO{
			{TrialNumber: 1, XValue: 1.5, YValue: 12.4, Notes: "1 Baterai AA"},
			{TrialNumber: 2, XValue: 3.0, YValue: 24.8, Notes: "2 Baterai AA Seri"},
		},
		ReflectionAnswers: []string{"Lapisan cat diamplas agar logam aluminium menghantarkan elektron."},
	})
	if err != nil {
		t.Fatalf("unexpected lab report error: %v", err)
	}
	if reportResp.ReportID == "" || reportResp.VariablesSummary == "" {
		t.Fatalf("expected non-empty report ID and variables summary, got %+v", reportResp)
	}
}

// Test 5: Idempotent Offline Progress Sync (USP #10)
func TestSyncOfflineProgress_Idempotency(t *testing.T) {
	uc, _ := setupTestUseCase()
	ctx := context.Background()

	completions := []domain.OfflineCompletionItemInput{
		{
			ClientMutationID: "mut-uuid-0001",
			ExperimentSlug:   "rangkaian-listrik-baterai-kaleng-ar",
			CompletedAtUTC:   "2026-10-17T04:00:00Z",
			CheckedSteps:     []int{1, 2},
			QuizScore:        10,
		},
	}

	firstSync, err := uc.SyncOfflineProgress(ctx, "user-offline-1", completions)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if firstSync.SyncedCount != 1 || firstSync.TotalXP != 200 {
		t.Fatalf("expected SyncedCount=1 and TotalXP=200, got %+v", firstSync)
	}

	// Duplicate retry with identical client_mutation_id must NOT double-award XP
	secondSync, err := uc.SyncOfflineProgress(ctx, "user-offline-1", completions)
	if err != nil {
		t.Fatalf("unexpected error on retry: %v", err)
	}
	if secondSync.SyncedCount != 0 || secondSync.TotalXP != 200 {
		t.Fatalf("idempotency violated: expected SyncedCount=0 and TotalXP=200 on duplicate mutation, got %+v", secondSync)
	}
}
