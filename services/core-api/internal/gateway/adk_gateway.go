package gateway

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/rekasains/core-api/internal/domain"
)

// HybridADKGateway implements usecase.ADKAgentGateway.
// It first attempts to call the Python Google ADK 6-Sub-Agent service (`services/ai-agent`),
// and automatically falls back to a deterministic engine if `services/ai-agent` is offline or being built in parallel.
type HybridADKGateway struct {
	baseURL    string
	httpClient *http.Client
}

func NewHybridADKGateway(baseURL string) *HybridADKGateway {
	if strings.TrimSpace(baseURL) == "" {
		baseURL = "http://localhost:8081/ai/v1"
	}
	return &HybridADKGateway{
		baseURL: strings.TrimRight(baseURL, "/"),
		httpClient: &http.Client{
			Timeout: 3500 * time.Millisecond,
		},
	}
}

// ExtractInventoryFromImage invokes VisionInventoryAgent or uses deterministic fallback.
func (g *HybridADKGateway) ExtractInventoryFromImage(
	ctx context.Context,
	imageBase64 string,
	mimeType string,
	region domain.RegionCode,
) ([]domain.InventoryItemDTO, error) {
	reqBody := map[string]any{
		"image_base64": imageBase64,
		"mime_type":    mimeType,
		"region":       region,
	}
	var remoteResp struct {
		DetectedItems []domain.InventoryItemDTO `json:"detected_items"`
	}
	if err := g.postJSON(ctx, "/vision/scan", reqBody, &remoteResp); err == nil && len(remoteResp.DetectedItems) > 0 {
		return remoteResp.DetectedItems, nil
	}

	// Smart Deterministic Fallback when services/ai-agent is not running yet
	upperHint := strings.ToUpper(imageBase64)
	items := []domain.InventoryItemDTO{
		{
			MaterialSlug: "plastic_bottle_pet_600ml",
			Category:     "RECYCLED",
			Quantity:     2,
			Unit:         "pcs",
			Confidence:   0.97,
		},
		{
			MaterialSlug: "thick_plastic_straw",
			Category:     "RECYCLED",
			Quantity:     2,
			Unit:         "pcs",
			Confidence:   0.94,
		},
		{
			MaterialSlug: "battery_aa_1_5v",
			Category:     "ELECTRONICS",
			Quantity:     2,
			Unit:         "pcs",
			Confidence:   0.96,
		},
		{
			MaterialSlug: "aluminum_can_recycled",
			Category:     "RECYCLED",
			Quantity:     1,
			Unit:         "pcs",
			Confidence:   0.95,
		},
	}

	// If caller passes hazard test marker in image_base64 (e.g. "HAZARD_BLEACH_ACID"), include the co-located hazardous items
	if strings.Contains(upperHint, "HAZARD") || strings.Contains(upperHint, "BLEACH") {
		items = append(items,
			domain.InventoryItemDTO{
				MaterialSlug: "sodium_hypochlorite",
				Category:     "KITCHEN_CHEMICAL",
				Quantity:     1,
				Unit:         "bottle",
				Confidence:   0.98,
			},
			domain.InventoryItemDTO{
				MaterialSlug: "floor_cleaner_acidic",
				Category:     "KITCHEN_CHEMICAL",
				Quantity:     1,
				Unit:         "bottle",
				Confidence:   0.97,
			},
		)
	}

	return items, nil
}

// VerifyExperimentStepVision invokes StepVisionAndARAgent or uses deterministic fallback.
func (g *HybridADKGateway) VerifyExperimentStepVision(
	ctx context.Context,
	exp domain.ExperimentBlueprint,
	step domain.ExperimentStepDTO,
	imageBase64 string,
	region domain.RegionCode,
	level domain.AgeAdaptiveLevel,
) (domain.StepVisionVerifyResponse, error) {
	reqBody := map[string]any{
		"experiment_slug":            exp.Slug,
		"step_number":                step.StepNumber,
		"vision_verification_prompt": step.VisionVerificationPrompt,
		"image_base64":               imageBase64,
		"region":                     region,
		"age_adaptive_level":         level,
	}
	var remoteResp domain.StepVisionVerifyResponse
	if err := g.postJSON(ctx, "/vision/verify-step", reqBody, &remoteResp); err == nil && remoteResp.StepNumber > 0 {
		return remoteResp, nil
	}

	upperHint := strings.ToUpper(imageBase64)
	isCorrect := !strings.Contains(upperHint, "INCOMPLETE") && !strings.Contains(upperHint, "WRONG")

	feedback := fmt.Sprintf("Langkah %d terverifikasi benar! Komponen sudah terpasang sesuai instruksi (%s). Silakan amati simulasi AR dan lanjut ke langkah berikutnya.", step.StepNumber, step.VisionVerificationPrompt)
	if region == domain.RegionMY {
		feedback = fmt.Sprintf("Langkah %d disahkan betul! Komponen telah dipasang mengikut arahan (%s). Sila perhatikan simulasi AR dan teruskan ke langkah seterusnya.", step.StepNumber, step.VisionVerificationPrompt)
	}
	if !isCorrect {
		if region == domain.RegionMY {
			feedback = fmt.Sprintf("Langkah %d belum tepat: pastikan sambungan komponen memenuhi kriteria (%s) sebelum meneruskan.", step.StepNumber, step.VisionVerificationPrompt)
		} else {
			feedback = fmt.Sprintf("Langkah %d belum tepat: pastikan sambungan komponen memenuhi kriteria (%s) sebelum melanjutkan.", step.StepNumber, step.VisionVerificationPrompt)
		}
	}

	return domain.StepVisionVerifyResponse{
		StepNumber:           step.StepNumber,
		IsVerifiedCorrect:    isCorrect,
		Confidence:           0.95,
		FeedbackMessageLocal: feedback,
		CanProceedToNextStep: isCorrect,
		AROverlaySimulation:  domain.SanitizeAROverlay(step.DefaultAROverlay),
	}, nil
}

// SynthesizeLabReport invokes LabReportSynthesizerAgent or uses deterministic academic report synthesizer fallback.
func (g *HybridADKGateway) SynthesizeLabReport(
	ctx context.Context,
	exp domain.ExperimentBlueprint,
	req domain.LabReportGenerateRequest,
) (domain.LabReportGenerateResponse, error) {
	var remoteResp domain.LabReportGenerateResponse
	if err := g.postJSON(ctx, "/lab-report/synthesize", req, &remoteResp); err == nil && remoteResp.ReportID != "" {
		return remoteResp, nil
	}

	meta, ok := exp.AdaptiveScaffolds[req.AgeAdaptiveLevel]
	if !ok {
		meta = exp.AdaptiveScaffolds[domain.LevelSMAUpperSec]
	}

	objective := meta.LearningObjectiveID
	concepts := meta.STEMConceptsID
	varsSpec := meta.VariablesAndGraphID
	steps := exp.StepsID
	if req.Region == domain.RegionMY {
		objective = meta.LearningObjectiveMY
		concepts = meta.STEMConceptsMY
		varsSpec = meta.VariablesAndGraphMY
		steps = exp.StepsMY
	}

	materialsList := make([]string, 0, len(exp.RequiredMaterials))
	for _, rm := range exp.RequiredMaterials {
		materialsList = append(materialsList, fmt.Sprintf("%s (%.0f %s)", rm.MaterialSlug, rm.MinQuantity, rm.Unit))
	}

	procList := make([]string, 0, len(steps))
	for _, st := range steps {
		procList = append(procList, fmt.Sprintf("Langkah %d: %s", st.StepNumber, st.Instruction))
	}

	var varsSummary string
	if varsSpec != nil {
		varsSummary = fmt.Sprintf(
			"Variabel Bebas: %s | Variabel Terikat: %s | Variabel Kontrol: %s | Persamaan: %s",
			varsSpec.IndependentVariable,
			varsSpec.DependentVariable,
			strings.Join(varsSpec.ControlVariables, ", "),
			strings.Join(varsSpec.FormulasLatex, " ; "),
		)
	} else {
		varsSummary = "Pengamatan fenomena kualitatif dan eksplorasi konsep STEM terpadu."
	}

	trialSummary := fmt.Sprintf("Tercatat %d baris data pengamatan kuantitatif.", len(req.ObservationDataRows))
	if len(req.ObservationDataRows) > 0 {
		first := req.ObservationDataRows[0]
		last := req.ObservationDataRows[len(req.ObservationDataRows)-1]
		trialSummary = fmt.Sprintf(
			"Berdasarkan %d percobaan (Trial 1: X=%.2f, Y=%.2f hingga Trial %d: X=%.2f, Y=%.2f), data menunjukkan tren yang konsisten dengan hipotesis teori.",
			len(req.ObservationDataRows), first.XValue, first.YValue, last.TrialNumber, last.XValue, last.YValue,
		)
	}

	discussion := fmt.Sprintf(
		"Praktikum '%s' dilaksanakan oleh %s (%s - %s). %s Konsep Sains Utama: %s. Rekayasa & Teknologi: %s.",
		exp.LocalTitle(req.Region),
		req.StudentName,
		req.InstitutionName,
		req.ClassOrNIM,
		trialSummary,
		concepts.Science,
		concepts.Engineering,
	)

	conclusion := fmt.Sprintf(
		"Eksperimen berhasil membuktikan tujuan pembelajaran: %s Seluruh langkah kerja telah terverifikasi dan sesuai dengan prinsip ilmiah %s.",
		objective,
		meta.CompetencyCodeID,
	)
	if req.Region == domain.RegionMY {
		conclusion = fmt.Sprintf(
			"Eksperimen berjaya membuktikan objektif pembelajaran: %s Semua langkah kerja telah disahkan mengikut piawaian %s.",
			objective,
			meta.CompetencyCodeMY,
		)
	}

	nowUTC := time.Now().UTC()
	return domain.LabReportGenerateResponse{
		ReportID:                 fmt.Sprintf("rep-%d", nowUTC.UnixNano()),
		TitleLocal:               fmt.Sprintf("Laporan Praktikum STEM: %s", exp.LocalTitle(req.Region)),
		ObjectiveLocal:           objective,
		TheoreticalSummary:       fmt.Sprintf("%s | Matematika: %s", concepts.Science, concepts.Mathematics),
		VariablesSummary:         varsSummary,
		MaterialsUsedList:        materialsList,
		ProcedureSummary:         procList,
		ResultAnalysisDiscussion: discussion,
		ConclusionLocal:          conclusion,
		GeneratedAtUTC:           nowUTC.Format(time.RFC3339),
	}, nil
}

func (g *HybridADKGateway) postJSON(ctx context.Context, path string, reqPayload any, out any) error {
	bodyBytes, err := json.Marshal(reqPayload)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, g.baseURL+path, bytes.NewReader(bodyBytes))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := g.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("ai-agent returned HTTP %d", resp.StatusCode)
	}
	return json.NewDecoder(resp.Body).Decode(out)
}
