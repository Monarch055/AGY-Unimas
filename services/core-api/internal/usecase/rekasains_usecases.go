package usecase

import (
	"context"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/rekasains/core-api/internal/domain"
)

// RekaSainsControlPlaneUseCase orchestrates all core business workflows across the 10 USPs (Layer 2).
type RekaSainsControlPlaneUseCase struct {
	catalogRepo   CatalogRepository
	inventoryRepo InventoryRepository
	reportRepo    VerificationAndReportRepository
	adkGateway    ADKAgentGateway
	eventPub      EventPublisher
}

func NewRekaSainsControlPlaneUseCase(
	catalogRepo CatalogRepository,
	inventoryRepo InventoryRepository,
	reportRepo VerificationAndReportRepository,
	adkGateway ADKAgentGateway,
	eventPub EventPublisher,
) *RekaSainsControlPlaneUseCase {
	return &RekaSainsControlPlaneUseCase{
		catalogRepo:   catalogRepo,
		inventoryRepo: inventoryRepo,
		reportRepo:    reportRepo,
		adkGateway:    adkGateway,
		eventPub:      eventPub,
	}
}

// EvaluateWorkspaceSafety checks a set of material slugs against the deterministic safety hazard matrix.
// Returns both Proactive Co-Location Warnings (USP #7) and Blocked Mixing Hazards.
func (uc *RekaSainsControlPlaneUseCase) EvaluateWorkspaceSafety(
	ctx context.Context,
	region domain.RegionCode,
	materialSlugs []string,
) []domain.SafetyAlertDTO {
	present := make(map[string]bool, len(materialSlugs))
	for _, slug := range materialSlugs {
		present[strings.TrimSpace(slug)] = true
	}

	rules := uc.catalogRepo.ListSafetyHazardRules(ctx)
	var alerts []domain.SafetyAlertDTO
	for _, rule := range rules {
		if present[rule.MaterialSlugA] && present[rule.MaterialSlugB] {
			alerts = append(alerts, domain.SafetyAlertDTO{
				RuleCode:          rule.RuleCode,
				Severity:          rule.Severity,
				InvolvedMaterials: []string{rule.MaterialSlugA, rule.MaterialSlugB},
				MessageLocal:      rule.LocalWarning(region),
			})
		}
	}
	if alerts == nil {
		alerts = []domain.SafetyAlertDTO{}
	}
	return alerts
}

// ScanWorkspaceInventory invokes VisionInventoryAgent + SafetyGuardianAgent (USP #1 & #7).
// Immediately evaluates co-located materials in the workspace frame for hazardous combinations.
func (uc *RekaSainsControlPlaneUseCase) ScanWorkspaceInventory(
	ctx context.Context,
	imageBase64 string,
	mimeType string,
	region domain.RegionCode,
) (scanID string, detected []domain.InventoryItemDTO, activeHazards []domain.SafetyAlertDTO, err error) {
	if err := domain.ValidateRegion(region); err != nil {
		return "", nil, nil, err
	}
	if strings.TrimSpace(imageBase64) == "" {
		return "", nil, nil, fmt.Errorf("%w: image_base64 is required", domain.ErrInvalidInput)
	}

	items, err := uc.adkGateway.ExtractInventoryFromImage(ctx, imageBase64, mimeType, region)
	if err != nil {
		return "", nil, nil, err
	}

	slugs := make([]string, 0, len(items))
	for i := range items {
		if mat, ok := uc.catalogRepo.GetMaterialBySlug(ctx, items[i].MaterialSlug); ok {
			items[i].NameLocal = mat.LocalName(region)
			items[i].Category = mat.Category
			if items[i].Unit == "" {
				items[i].Unit = mat.DefaultUnit
			}
		}
		slugs = append(slugs, items[i].MaterialSlug)
	}

	activeHazards = uc.EvaluateWorkspaceSafety(ctx, region, slugs)
	scanID = fmt.Sprintf("scan-%d", time.Now().UTC().UnixNano())

	_ = uc.eventPub.PublishEvent(ctx, "inventory.scan.completed", map[string]any{
		"scan_id":                  scanID,
		"region":                   region,
		"detected_count":           len(items),
		"active_workspace_hazards": len(activeHazards),
	})

	return scanID, items, activeHazards, nil
}

// ConfirmUserInventory saves the user's confirmed physical inventory and returns immediate safety checks.
func (uc *RekaSainsControlPlaneUseCase) ConfirmUserInventory(
	ctx context.Context,
	userID string,
	region domain.RegionCode,
	items []domain.InventoryItemInput,
) (int, []domain.SafetyAlertDTO, error) {
	if err := domain.ValidateRegion(region); err != nil {
		return 0, nil, err
	}
	validItems := make([]domain.InventoryItemInput, 0, len(items))
	slugs := make([]string, 0, len(items))
	for _, item := range items {
		if item.MaterialSlug == "" || item.Quantity <= 0 {
			continue
		}
		validItems = append(validItems, item)
		slugs = append(slugs, item.MaterialSlug)
	}

	if err := uc.inventoryRepo.SaveUserInventory(ctx, userID, validItems); err != nil {
		return 0, nil, err
	}

	alerts := uc.EvaluateWorkspaceSafety(ctx, region, slugs)
	return len(validItems), alerts, nil
}

// GetUserInventory retrieves the user's confirmed physical inventory localized to ID or MY.
func (uc *RekaSainsControlPlaneUseCase) GetUserInventory(
	ctx context.Context,
	userID string,
	region domain.RegionCode,
) ([]domain.InventoryItemDTO, error) {
	if err := domain.ValidateRegion(region); err != nil {
		region = domain.RegionID
	}
	rawItems, err := uc.inventoryRepo.GetUserInventory(ctx, userID)
	if err != nil {
		return nil, err
	}

	result := make([]domain.InventoryItemDTO, 0, len(rawItems))
	for _, raw := range rawItems {
		dto := domain.InventoryItemDTO{
			MaterialSlug: raw.MaterialSlug,
			NameLocal:    raw.MaterialSlug,
			Category:     "HOUSEHOLD_TOOL",
			Quantity:     raw.Quantity,
			Unit:         raw.Unit,
			Confidence:   1.0,
		}
		if mat, ok := uc.catalogRepo.GetMaterialBySlug(ctx, raw.MaterialSlug); ok {
			dto.NameLocal = mat.LocalName(region)
			dto.Category = mat.Category
			if dto.Unit == "" {
				dto.Unit = mat.DefaultUnit
			}
		}
		result = append(result, dto)
	}
	return result, nil
}

// MatchThreeTierExperiments implements the deterministic 3-Tier Resource Constraint & Functional Substitute Matcher (USP #2, #3, #4, #5, #7).
func (uc *RekaSainsControlPlaneUseCase) MatchThreeTierExperiments(
	ctx context.Context,
	region domain.RegionCode,
	ageLevel domain.AgeAdaptiveLevel,
	inventoryItems []domain.InventoryItemInput,
) (
	strict100 []domain.ExperimentRecommendationCardDTO,
	diySubstitutes []domain.ExperimentRecommendationCardDTO,
	localMicroShop []domain.ExperimentRecommendationCardDTO,
	blockedHazards []domain.SafetyAlertDTO,
	err error,
) {
	if err := domain.ValidateRegion(region); err != nil {
		return nil, nil, nil, nil, err
	}
	if err := domain.ValidateAgeLevel(ageLevel); err != nil {
		return nil, nil, nil, nil, err
	}

	userQtyMap := make(map[string]float64, len(inventoryItems))
	slugs := make([]string, 0, len(inventoryItems))
	for _, item := range inventoryItems {
		if item.Quantity > 0 {
			userQtyMap[item.MaterialSlug] += item.Quantity
			slugs = append(slugs, item.MaterialSlug)
		}
	}

	blockedHazards = uc.EvaluateWorkspaceSafety(ctx, region, slugs)

	strict100 = []domain.ExperimentRecommendationCardDTO{}
	diySubstitutes = []domain.ExperimentRecommendationCardDTO{}
	localMicroShop = []domain.ExperimentRecommendationCardDTO{}

	experiments := uc.catalogRepo.ListAllExperiments(ctx)
	for _, exp := range experiments {
		totalReq := len(exp.RequiredMaterials)
		if totalReq == 0 {
			continue
		}

		directSatisfiedCount := 0
		var missingReqs []domain.ExperimentRequiredMaterial

		for _, reqMat := range exp.RequiredMaterials {
			haveQty := userQtyMap[reqMat.MaterialSlug]
			if haveQty >= reqMat.MinQuantity {
				directSatisfiedCount++
			} else {
				missingReqs = append(missingReqs, domain.ExperimentRequiredMaterial{
					MaterialSlug: reqMat.MaterialSlug,
					MinQuantity:  reqMat.MinQuantity - haveQty,
					Unit:         reqMat.Unit,
				})
			}
		}

		scaffoldMeta, hasLevel := exp.AdaptiveScaffolds[ageLevel]
		if !hasLevel {
			scaffoldMeta = exp.AdaptiveScaffolds[domain.LevelSMPLowerSec]
		}
		curriculumBadge := scaffoldMeta.CurriculumBadgeID
		if region == domain.RegionMY {
			curriculumBadge = scaffoldMeta.CurriculumBadgeMY
		}

		// Tier 1: STRICT_100 (100% of required materials are physically present in required quantity)
		if len(missingReqs) == 0 {
			strict100 = append(strict100, domain.ExperimentRecommendationCardDTO{
				ExperimentSlug:        exp.Slug,
				TitleLocal:            exp.LocalTitle(region),
				MatchTier:             domain.TierStrict100,
				MatchPercentage:       100,
				AgeAdaptiveLevel:      ageLevel,
				CurriculumBadge:       curriculumBadge,
				SafetySeverity:        exp.SafetySeverity,
				FunctionalSubstitutes: []domain.FunctionalMaterialSubstituteDTO{},
				MissingLocalShopItems: []domain.LocalSourcingItemDTO{},
			})
			continue
		}

		// Only consider Tier 2 or Tier 3 if missing at most 2 materials
		if len(missingReqs) > 2 {
			continue
		}

		// Check Tier 2: DIY_SUBSTITUTE (Functional Physics/Chemistry Substitute available in user's inventory)
		var matchedSubstitutes []domain.FunctionalMaterialSubstituteDTO
		var remainingMissingForShop []domain.ExperimentRequiredMaterial

		for _, missing := range missingReqs {
			subRules := uc.catalogRepo.GetFunctionalSubstitutesForMissing(ctx, missing.MaterialSlug)
			foundSubInInventory := false
			var fallbackSubRule *domain.FunctionalSubstituteRule

			for i, rule := range subRules {
				if i == 0 {
					ruleCopy := rule
					fallbackSubRule = &ruleCopy
				}
				if userQtyMap[rule.SubstituteMaterialSlug] > 0 {
					missingMat, _ := uc.catalogRepo.GetMaterialBySlug(ctx, missing.MaterialSlug)
					subMat, _ := uc.catalogRepo.GetMaterialBySlug(ctx, rule.SubstituteMaterialSlug)
					matchedSubstitutes = append(matchedSubstitutes, domain.FunctionalMaterialSubstituteDTO{
						MissingMaterialSlug:       missing.MaterialSlug,
						MissingNameLocal:          missingMat.LocalName(region),
						SubstituteMaterialSlug:    rule.SubstituteMaterialSlug,
						SubstituteNameLocal:       subMat.LocalName(region),
						SharedScientificPrinciple: rule.LocalPrinciple(region),
						AdaptationSteps:           rule.LocalSteps(region),
					})
					foundSubInInventory = true
					break
				}
			}

			if !foundSubInInventory {
				// If only 1 item is missing and there is a known household functional substitute rule,
				// also surface the functional substitute recommendation alongside local shop option.
				if fallbackSubRule != nil && len(missingReqs) == 1 {
					missingMat, _ := uc.catalogRepo.GetMaterialBySlug(ctx, missing.MaterialSlug)
					subMat, _ := uc.catalogRepo.GetMaterialBySlug(ctx, fallbackSubRule.SubstituteMaterialSlug)
					matchedSubstitutes = append(matchedSubstitutes, domain.FunctionalMaterialSubstituteDTO{
						MissingMaterialSlug:       missing.MaterialSlug,
						MissingNameLocal:          missingMat.LocalName(region),
						SubstituteMaterialSlug:    fallbackSubRule.SubstituteMaterialSlug,
						SubstituteNameLocal:       subMat.LocalName(region),
						SharedScientificPrinciple: fallbackSubRule.LocalPrinciple(region),
						AdaptationSteps:           fallbackSubRule.LocalSteps(region),
					})
				}
				remainingMissingForShop = append(remainingMissingForShop, missing)
			}
		}

		matchPct := int(math.Round((float64(directSatisfiedCount) / float64(totalReq)) * 100.0))

		if len(remainingMissingForShop) == 0 && len(matchedSubstitutes) > 0 {
			// User actually has the functional substitute in their inventory!
			diySubstitutes = append(diySubstitutes, domain.ExperimentRecommendationCardDTO{
				ExperimentSlug:        exp.Slug,
				TitleLocal:            exp.LocalTitle(region),
				MatchTier:             domain.TierDIYSubstitute,
				MatchPercentage:       matchPct,
				AgeAdaptiveLevel:      ageLevel,
				CurriculumBadge:       curriculumBadge,
				SafetySeverity:        exp.SafetySeverity,
				FunctionalSubstitutes: matchedSubstitutes,
				MissingLocalShopItems: []domain.LocalSourcingItemDTO{},
			})
			continue
		}

		// Tier 3: LOCAL_MICRO_SHOP (Missing 1-2 cheap local materials with Rp/RM integer price & Smart Deep-Links)
		shopItems := make([]domain.LocalSourcingItemDTO, 0, len(remainingMissingForShop))
		for _, miss := range remainingMissingForShop {
			mat, ok := uc.catalogRepo.GetMaterialBySlug(ctx, miss.MaterialSlug)
			if !ok {
				continue
			}
			currency, priceInt, displayPrice := mat.FormatLocalPrice(region, miss.MinQuantity)
			mapsURL, marketURL := mat.BuildLocalSourcingLinks(region)
			shopItems = append(shopItems, domain.LocalSourcingItemDTO{
				MaterialSlug:         miss.MaterialSlug,
				NameLocal:            mat.LocalName(region),
				MissingQuantity:      miss.MinQuantity,
				Unit:                 miss.Unit,
				Currency:             currency,
				EstPriceInt:          priceInt,
				DisplayPrice:         displayPrice,
				RecommendedStores:    mat.LocalStores(region),
				MapsSearchURL:        mapsURL,
				MarketplaceSearchURL: marketURL,
			})
		}

		localMicroShop = append(localMicroShop, domain.ExperimentRecommendationCardDTO{
			ExperimentSlug:        exp.Slug,
			TitleLocal:            exp.LocalTitle(region),
			MatchTier:             domain.TierLocalMicroShop,
			MatchPercentage:       matchPct,
			AgeAdaptiveLevel:      ageLevel,
			CurriculumBadge:       curriculumBadge,
			SafetySeverity:        exp.SafetySeverity,
			FunctionalSubstitutes: matchedSubstitutes,
			MissingLocalShopItems: shopItems,
		})
	}

	return strict100, diySubstitutes, localMicroShop, blockedHazards, nil
}

// ScaffoldExperimentModule generates a 4-Level Age-Adaptive STEM Module & Offline Lab Pack (USP #5, #6, #8, #9).
func (uc *RekaSainsControlPlaneUseCase) ScaffoldExperimentModule(
	ctx context.Context,
	slug string,
	region domain.RegionCode,
	curriculumCode string,
	ageLevel domain.AgeAdaptiveLevel,
	gradeLevel string,
) (domain.STEMExperimentModuleDTO, error) {
	if err := domain.ValidateRegion(region); err != nil {
		return domain.STEMExperimentModuleDTO{}, err
	}
	if err := domain.ValidateAgeLevel(ageLevel); err != nil {
		return domain.STEMExperimentModuleDTO{}, err
	}

	exp, ok := uc.catalogRepo.GetExperimentBySlug(ctx, slug)
	if !ok {
		return domain.STEMExperimentModuleDTO{}, domain.ErrExperimentNotFound
	}

	meta, hasMeta := exp.AdaptiveScaffolds[ageLevel]
	if !hasMeta {
		meta = exp.AdaptiveScaffolds[domain.LevelSMPLowerSec]
	}

	competency := meta.CompetencyCodeID
	objective := meta.LearningObjectiveID
	stemConcepts := meta.STEMConceptsID
	varsAndGraph := meta.VariablesAndGraphID
	steps := exp.StepsID

	if region == domain.RegionMY {
		competency = meta.CompetencyCodeMY
		objective = meta.LearningObjectiveMY
		stemConcepts = meta.STEMConceptsMY
		varsAndGraph = meta.VariablesAndGraphMY
		steps = exp.StepsMY
	}

	// Sanitize all default AR overlay coordinates into [0.0, 1.0]
	sanitizedSteps := make([]domain.ExperimentStepDTO, len(steps))
	for i, s := range steps {
		s.DefaultAROverlay = domain.SanitizeAROverlay(s.DefaultAROverlay)
		sanitizedSteps[i] = s
	}

	safetyChecks := []domain.SafetyAlertDTO{}
	if exp.SafetySeverity == domain.SeverityAdultSupervision {
		msg := "Pendampingan Orang Tua/Guru disarankan selama langkah perakitan berlangsung."
		if region == domain.RegionMY {
			msg = "Pengawasan Ibu Bapa/Guru disyorkan sepanjang langkah pemasangan dijalankan."
		}
		safetyChecks = append(safetyChecks, domain.SafetyAlertDTO{
			RuleCode:          "SAFE_ADULT_SUPERVISION_ADVISORY",
			Severity:          domain.SeverityAdultSupervision,
			InvolvedMaterials: []string{},
			MessageLocal:      msg,
		})
	}

	questions := exp.ReflectionQuestions[region]
	if questions == nil {
		questions = []domain.ReflectionQuestionDTO{}
	}

	module := domain.STEMExperimentModuleDTO{
		ExperimentSlug:   exp.Slug,
		TitleLocal:       exp.LocalTitle(region),
		AgeAdaptiveLevel: ageLevel,
		CurriculumAlignment: domain.CurriculumAlignmentDTO{
			CurriculumCode:    curriculumCode,
			GradeLevel:        gradeLevel,
			CompetencyCode:    competency,
			LearningObjective: objective,
		},
		STEMConcepts:                stemConcepts,
		ScientificVariablesAndGraph: varsAndGraph,
		SafetyChecks:                safetyChecks,
		Steps:                       sanitizedSteps,
		ReflectionQuestions:         questions,
		OfflinePackVersion:          "1.1.0",
	}

	_ = uc.eventPub.PublishEvent(ctx, "experiment.module.synthesized", map[string]any{
		"experiment_slug":    exp.Slug,
		"region":             region,
		"age_adaptive_level": ageLevel,
	})

	return module, nil
}

// VerifyStepVisionAndAR verifies a user's step photo via StepVisionAndARAgent and returns normalized AR coordinates (USP #8 & #9).
func (uc *RekaSainsControlPlaneUseCase) VerifyStepVisionAndAR(
	ctx context.Context,
	userID string,
	experimentSlug string,
	stepNumber int,
	imageBase64 string,
	region domain.RegionCode,
	ageLevel domain.AgeAdaptiveLevel,
) (domain.StepVisionVerifyResponse, error) {
	if err := domain.ValidateRegion(region); err != nil {
		return domain.StepVisionVerifyResponse{}, err
	}
	if err := domain.ValidateAgeLevel(ageLevel); err != nil {
		return domain.StepVisionVerifyResponse{}, err
	}
	if strings.TrimSpace(imageBase64) == "" {
		return domain.StepVisionVerifyResponse{}, fmt.Errorf("%w: image_base64 is required", domain.ErrInvalidInput)
	}

	exp, ok := uc.catalogRepo.GetExperimentBySlug(ctx, experimentSlug)
	if !ok {
		return domain.StepVisionVerifyResponse{}, domain.ErrExperimentNotFound
	}

	steps := exp.StepsID
	if region == domain.RegionMY {
		steps = exp.StepsMY
	}

	var targetStep *domain.ExperimentStepDTO
	for i := range steps {
		if steps[i].StepNumber == stepNumber {
			targetStep = &steps[i]
			break
		}
	}
	if targetStep == nil {
		return domain.StepVisionVerifyResponse{}, domain.ErrStepNotFound
	}

	resp, err := uc.adkGateway.VerifyExperimentStepVision(ctx, exp, *targetStep, imageBase64, region, ageLevel)
	if err != nil {
		return domain.StepVisionVerifyResponse{}, err
	}

	resp.AROverlaySimulation = domain.SanitizeAROverlay(resp.AROverlaySimulation)
	_ = uc.reportRepo.SaveStepVerification(ctx, userID, experimentSlug, resp)

	_ = uc.eventPub.PublishEvent(ctx, "experiment.step.verified", map[string]any{
		"user_id":             userID,
		"experiment_slug":     experimentSlug,
		"step_number":         stepNumber,
		"is_verified_correct": resp.IsVerifiedCorrect,
	})

	return resp, nil
}

// GenerateAcademicLabReport synthesizes a structured Academic Lab Report ready for PDF export (USP #10).
func (uc *RekaSainsControlPlaneUseCase) GenerateAcademicLabReport(
	ctx context.Context,
	userID string,
	experimentSlug string,
	req domain.LabReportGenerateRequest,
) (domain.LabReportGenerateResponse, error) {
	if err := domain.ValidateRegion(req.Region); err != nil {
		return domain.LabReportGenerateResponse{}, err
	}
	if err := domain.ValidateAgeLevel(req.AgeAdaptiveLevel); err != nil {
		return domain.LabReportGenerateResponse{}, err
	}
	if strings.TrimSpace(req.StudentName) == "" || strings.TrimSpace(req.InstitutionName) == "" {
		return domain.LabReportGenerateResponse{}, fmt.Errorf("%w: student_name and institution_name are required", domain.ErrInvalidInput)
	}

	exp, ok := uc.catalogRepo.GetExperimentBySlug(ctx, experimentSlug)
	if !ok {
		return domain.LabReportGenerateResponse{}, domain.ErrExperimentNotFound
	}

	resp, err := uc.adkGateway.SynthesizeLabReport(ctx, exp, req)
	if err != nil {
		return domain.LabReportGenerateResponse{}, err
	}

	_ = uc.reportRepo.SaveLabReport(ctx, userID, experimentSlug, req, resp)

	_ = uc.eventPub.PublishEvent(ctx, "lab_report.synthesized", map[string]any{
		"report_id":          resp.ReportID,
		"user_id":            userID,
		"experiment_slug":    experimentSlug,
		"age_adaptive_level": req.AgeAdaptiveLevel,
	})

	return resp, nil
}

// SyncOfflineProgress processes offline experiment completions idempotently using client_mutation_id (USP #10).
func (uc *RekaSainsControlPlaneUseCase) SyncOfflineProgress(
	ctx context.Context,
	userID string,
	completions []domain.OfflineCompletionItemInput,
) (domain.OfflineProgressSyncResponse, error) {
	newlySynced := 0
	totalXP := 0
	totalCompletions := 0

	for _, comp := range completions {
		if strings.TrimSpace(comp.ClientMutationID) == "" || strings.TrimSpace(comp.ExperimentSlug) == "" {
			continue
		}
		xpForCompletion := 100 + (comp.QuizScore * 10)
		if xpForCompletion < 50 {
			xpForCompletion = 50
		}
		alreadySynced, updatedXP, updatedCount, err := uc.reportRepo.RecordOfflineCompletionIdempotent(ctx, userID, comp, xpForCompletion)
		if err != nil {
			return domain.OfflineProgressSyncResponse{}, err
		}
		totalXP = updatedXP
		totalCompletions = updatedCount
		if !alreadySynced {
			newlySynced++
			_ = uc.eventPub.PublishEvent(ctx, "experiment.completed", map[string]any{
				"user_id":            userID,
				"client_mutation_id": comp.ClientMutationID,
				"experiment_slug":    comp.ExperimentSlug,
				"xp_awarded":         xpForCompletion,
			})
		}
	}

	var badges []domain.AwardedBadgeDTO
	if totalCompletions >= 1 {
		badges = append(badges, domain.AwardedBadgeDTO{
			BadgeCode:  "BADGE_STEM_PIONEER",
			TitleLocal: "Perintis RekaSains / Perintis Sains",
			IconSlug:   "sparkles-flask",
		})
	}
	if totalXP >= 250 {
		badges = append(badges, domain.AwardedBadgeDTO{
			BadgeCode:  "BADGE_GREEN_UPCYCLER",
			TitleLocal: "Inovator Daur Ulang Sains / Inovator Kitar Semula",
			IconSlug:   "recycle-atom",
		})
	}
	if badges == nil {
		badges = []domain.AwardedBadgeDTO{}
	}

	return domain.OfflineProgressSyncResponse{
		SyncedCount:        newlySynced,
		TotalXP:            totalXP,
		NewlyAwardedBadges: badges,
	}, nil
}
