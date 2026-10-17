package httpdelivery

import (
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/rekasains/core-api/internal/domain"
	"github.com/rekasains/core-api/internal/usecase"
)

// ServerHandler implements all REST API routes specified in contracts/api/openapi.yaml (v1.1.0).
type ServerHandler struct {
	uc     *usecase.RekaSainsControlPlaneUseCase
	logger *slog.Logger
	mux    *http.ServeMux
}

func NewServerHandler(uc *usecase.RekaSainsControlPlaneUseCase, logger *slog.Logger) *ServerHandler {
	h := &ServerHandler{
		uc:     uc,
		logger: logger,
		mux:    http.NewServeMux(),
	}
	h.registerRoutes()
	return h
}

func (h *ServerHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// CORS & Security Headers for apps/web PWA communication
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-ID, X-Request-ID")
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	reqID := r.Header.Get("X-Request-ID")
	if reqID == "" {
		reqID = fmt.Sprintf("req-%d", time.Now().UTC().UnixNano())
	}
	w.Header().Set("X-Request-ID", reqID)

	h.mux.ServeHTTP(w, r)
}

func (h *ServerHandler) registerRoutes() {
	h.mux.HandleFunc("/health", h.handleHealth)
	h.mux.HandleFunc("/v1/health", h.handleHealth)
	h.mux.HandleFunc("/v1/inventory/scan", h.handleInventoryScan)
	h.mux.HandleFunc("/v1/inventory/items", h.handleInventoryItems)
	h.mux.HandleFunc("/v1/recommendations/match", h.handleRecommendationsMatch)
	h.mux.HandleFunc("/v1/experiments/", h.handleExperimentsSubroutes)
	h.mux.HandleFunc("/v1/sync/offline-progress", h.handleOfflineProgressSync)
}

func extractUserID(r *http.Request) string {
	uid := strings.TrimSpace(r.Header.Get("X-User-ID"))
	if uid == "" {
		return "student-default-001"
	}
	return uid
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, code string, err error) {
	writeJSON(w, status, map[string]any{
		"error_code": code,
		"message":    err.Error(),
	})
}

func (h *ServerHandler) handleHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", errors.New("only GET is supported"))
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"status":    "ok",
		"service":   "rekasains-core-api",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

// POST /v1/inventory/scan (USP #1 & #7)
func (h *ServerHandler) handleInventoryScan(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", errors.New("only POST is supported"))
		return
	}

	var req struct {
		ImageBase64 string            `json:"image_base64"`
		MimeType    string            `json:"mime_type"`
		Region      domain.RegionCode `json:"region"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", err)
		return
	}
	if req.Region == "" {
		req.Region = domain.RegionID
	}

	scanID, items, activeHazards, err := h.uc.ScanWorkspaceInventory(r.Context(), req.ImageBase64, req.MimeType, req.Region)
	if err != nil {
		writeError(w, http.StatusBadRequest, "SCAN_VALIDATION_ERROR", err)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"scan_id":                  scanID,
		"region":                   req.Region,
		"detected_items":           items,
		"active_workspace_hazards": activeHazards,
	})
}

// GET & PUT /v1/inventory/items
func (h *ServerHandler) handleInventoryItems(w http.ResponseWriter, r *http.Request) {
	userID := extractUserID(r)

	switch r.Method {
	case http.MethodGet:
		region := domain.RegionCode(strings.ToUpper(r.URL.Query().Get("region")))
		if region == "" {
			region = domain.RegionID
		}
		items, err := h.uc.GetUserInventory(r.Context(), userID, region)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "INVENTORY_FETCH_ERROR", err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{
			"items": items,
		})

	case http.MethodPut:
		var req struct {
			Region domain.RegionCode           `json:"region"`
			Items  []domain.InventoryItemInput `json:"items"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "INVALID_JSON", err)
			return
		}
		totalItems, alerts, err := h.uc.ConfirmUserInventory(r.Context(), userID, req.Region, req.Items)
		if err != nil {
			writeError(w, http.StatusBadRequest, "INVENTORY_CONFIRM_ERROR", err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{
			"status":        "confirmed",
			"total_items":   totalItems,
			"safety_alerts": alerts,
		})

	default:
		writeError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", errors.New("only GET and PUT are supported"))
	}
}

// POST /v1/recommendations/match (USP #2, #3, #4, #5)
func (h *ServerHandler) handleRecommendationsMatch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", errors.New("only POST is supported"))
		return
	}

	var req struct {
		Region           domain.RegionCode           `json:"region"`
		CurriculumCode   string                      `json:"curriculum_code"`
		AgeAdaptiveLevel domain.AgeAdaptiveLevel     `json:"age_adaptive_level"`
		GradeLevel       string                      `json:"grade_level"`
		UserRole         string                      `json:"user_role"`
		InventoryItems   []domain.InventoryItemInput `json:"inventory_items"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", err)
		return
	}
	if req.AgeAdaptiveLevel == "" {
		req.AgeAdaptiveLevel = domain.LevelSMPLowerSec
	}

	strict100, diySub, localShop, blockedHazards, err := h.uc.MatchThreeTierExperiments(
		r.Context(),
		req.Region,
		req.AgeAdaptiveLevel,
		req.InventoryItems,
	)
	if err != nil {
		writeError(w, http.StatusBadRequest, "MATCH_VALIDATION_ERROR", err)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"region":                   req.Region,
		"strict_100_matches":       strict100,
		"diy_substitute_matches":   diySub,
		"local_micro_shop_matches": localShop,
		"blocked_hazard_alerts":    blockedHazards,
	})
}

// Dispatches:
// - POST /v1/experiments/{slug}/scaffold
// - POST /v1/experiments/{slug}/steps/{step_number}/verify-vision
// - POST /v1/experiments/{slug}/lab-report/generate
func (h *ServerHandler) handleExperimentsSubroutes(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", errors.New("only POST is supported"))
		return
	}

	trimmed := strings.TrimPrefix(r.URL.Path, "/v1/experiments/")
	parts := strings.Split(strings.Trim(trimmed, "/"), "/")
	if len(parts) < 2 {
		writeError(w, http.StatusNotFound, "ROUTE_NOT_FOUND", errors.New("unknown experiment route"))
		return
	}

	slug := parts[0]
	userID := extractUserID(r)

	// 1. POST /v1/experiments/{slug}/scaffold
	if len(parts) == 2 && parts[1] == "scaffold" {
		var req struct {
			Region           domain.RegionCode       `json:"region"`
			CurriculumCode   string                  `json:"curriculum_code"`
			AgeAdaptiveLevel domain.AgeAdaptiveLevel `json:"age_adaptive_level"`
			GradeLevel       string                  `json:"grade_level"`
			UserRole         string                  `json:"user_role"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "INVALID_JSON", err)
			return
		}
		if req.AgeAdaptiveLevel == "" {
			req.AgeAdaptiveLevel = domain.LevelSMPLowerSec
		}

		module, err := h.uc.ScaffoldExperimentModule(
			r.Context(),
			slug,
			req.Region,
			req.CurriculumCode,
			req.AgeAdaptiveLevel,
			req.GradeLevel,
		)
		if err != nil {
			if errors.Is(err, domain.ErrExperimentNotFound) {
				writeError(w, http.StatusNotFound, "EXPERIMENT_NOT_FOUND", err)
				return
			}
			if errors.Is(err, domain.ErrCriticalSafetyBlocked) {
				writeError(w, http.StatusUnprocessableEntity, "SAFETY_HAZARD_BLOCKED", err)
				return
			}
			writeError(w, http.StatusBadRequest, "SCAFFOLD_ERROR", err)
			return
		}
		writeJSON(w, http.StatusOK, module)
		return
	}

	// 2. POST /v1/experiments/{slug}/steps/{step_number}/verify-vision
	if len(parts) == 4 && parts[1] == "steps" && parts[3] == "verify-vision" {
		stepNum, err := strconv.Atoi(parts[2])
		if err != nil || stepNum < 1 {
			writeError(w, http.StatusBadRequest, "INVALID_STEP_NUMBER", errors.New("step_number must be a positive integer"))
			return
		}
		var req struct {
			ImageBase64      string                  `json:"image_base64"`
			MimeType         string                  `json:"mime_type"`
			Region           domain.RegionCode       `json:"region"`
			AgeAdaptiveLevel domain.AgeAdaptiveLevel `json:"age_adaptive_level"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "INVALID_JSON", err)
			return
		}
		if req.Region == "" {
			req.Region = domain.RegionID
		}
		if req.AgeAdaptiveLevel == "" {
			req.AgeAdaptiveLevel = domain.LevelSMPLowerSec
		}

		resp, err := h.uc.VerifyStepVisionAndAR(
			r.Context(),
			userID,
			slug,
			stepNum,
			req.ImageBase64,
			req.Region,
			req.AgeAdaptiveLevel,
		)
		if err != nil {
			if errors.Is(err, domain.ErrExperimentNotFound) || errors.Is(err, domain.ErrStepNotFound) {
				writeError(w, http.StatusNotFound, "STEP_NOT_FOUND", err)
				return
			}
			writeError(w, http.StatusBadRequest, "STEP_VERIFY_ERROR", err)
			return
		}
		writeJSON(w, http.StatusOK, resp)
		return
	}

	// 3. POST /v1/experiments/{slug}/lab-report/generate
	if len(parts) == 3 && parts[1] == "lab-report" && parts[2] == "generate" {
		var req domain.LabReportGenerateRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "INVALID_JSON", err)
			return
		}
		if req.Region == "" {
			req.Region = domain.RegionID
		}
		if req.AgeAdaptiveLevel == "" {
			req.AgeAdaptiveLevel = domain.LevelSMAUpperSec
		}

		resp, err := h.uc.GenerateAcademicLabReport(r.Context(), userID, slug, req)
		if err != nil {
			if errors.Is(err, domain.ErrExperimentNotFound) {
				writeError(w, http.StatusNotFound, "EXPERIMENT_NOT_FOUND", err)
				return
			}
			writeError(w, http.StatusBadRequest, "LAB_REPORT_ERROR", err)
			return
		}
		writeJSON(w, http.StatusOK, resp)
		return
	}

	writeError(w, http.StatusNotFound, "ROUTE_NOT_FOUND", errors.New("unknown experiment subroute"))
}

// POST /v1/sync/offline-progress (USP #10)
func (h *ServerHandler) handleOfflineProgressSync(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", errors.New("only POST is supported"))
		return
	}

	var req struct {
		Completions []domain.OfflineCompletionItemInput `json:"completions"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", err)
		return
	}

	userID := extractUserID(r)
	resp, err := h.uc.SyncOfflineProgress(r.Context(), userID, req.Completions)
	if err != nil {
		writeError(w, http.StatusBadRequest, "OFFLINE_SYNC_ERROR", err)
		return
	}
	writeJSON(w, http.StatusOK, resp)
}
