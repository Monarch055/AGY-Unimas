"""
Layer 3 (HTTP & SSE Delivery Adapter):
FastAPI routes for the 6-Sub-Agent Google ADK Engine (`services/ai-agent`).
Strictly adheres to `contracts/api/openapi.yaml` (v1.1.0) and Zero-RabbitMQ SSE streaming.
"""

from __future__ import annotations

import json
from typing import Any, Callable, Dict, List

from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse

from app.agents.conversational_tutor_agent import conversational_tutor_agent
from app.domain.models import (
    ChatStreamRequest,
    ExperimentScaffoldRequest,
    HealthCheckResponse,
    InventoryScanRequest,
    InventoryScanResponse,
    LabReportGenerateRequest,
    LabReportGenerateResponse,
    RecommendationMatchRequest,
    RecommendationMatchResponse,
    RekaSainsEventEnvelope,
    STEMExperimentModuleDTO,
    StepVisionVerifyRequest,
    StepVisionVerifyResponse,
)
from app.usecase.workflows import (
    HazardousExperimentBlockedError,
    MatchThreeTierAndSubstitutesUseCase,
    ScaffoldAdaptiveExperimentUseCase,
    ScanWorkspaceInventoryUseCase,
    SynthesizeAcademicLabReportUseCase,
    VerifyStepVisionAndARUseCase,
)


def create_agent_api_router(
    scan_uc: ScanWorkspaceInventoryUseCase,
    match_uc: MatchThreeTierAndSubstitutesUseCase,
    scaffold_uc: ScaffoldAdaptiveExperimentUseCase,
    verify_step_uc: VerifyStepVisionAndARUseCase,
    lab_report_uc: SynthesizeAcademicLabReportUseCase,
    manifest_provider: Callable[[], Dict[str, Any]],
    recent_events_provider: Callable[[], List[RekaSainsEventEnvelope]],
) -> APIRouter:
    router = APIRouter()

    @router.get("/health", response_model=HealthCheckResponse)
    def health_check() -> HealthCheckResponse:
        return HealthCheckResponse(status="ok", service="rekasains-ai-agent")

    @router.get("/agents/manifest")
    def get_agents_manifest() -> Dict[str, Any]:
        return manifest_provider()

    @router.post("/inventory/scan", response_model=InventoryScanResponse)
    def scan_workspace_inventory(
        req: InventoryScanRequest, background_tasks: BackgroundTasks
    ) -> InventoryScanResponse:
        return scan_uc.execute(req)

    @router.post("/recommendations/match", response_model=RecommendationMatchResponse)
    def match_three_tier_recommendations(
        req: RecommendationMatchRequest,
    ) -> RecommendationMatchResponse:
        return match_uc.execute(req)

    @router.post(
        "/experiments/{slug}/scaffold",
        response_model=STEMExperimentModuleDTO,
        responses={422: {"description": "Blocked by SafetyGuardianAgent"}},
    )
    def scaffold_adaptive_experiment(
        slug: str, req: ExperimentScaffoldRequest
    ) -> Any:
        try:
            return scaffold_uc.execute(slug, req)
        except HazardousExperimentBlockedError as exc:
            return JSONResponse(
                status_code=422,
                content={
                    "error_code": "CRITICAL_HAZARD_BLOCKED",
                    "message": str(exc),
                    "safety_alerts": [a.model_dump() for a in exc.alerts],
                },
            )

    @router.post(
        "/experiments/{slug}/steps/{step_number}/verify-vision",
        response_model=StepVisionVerifyResponse,
    )
    def verify_step_vision_and_ar(
        slug: str, step_number: int, req: StepVisionVerifyRequest
    ) -> StepVisionVerifyResponse:
        if step_number < 1:
            raise HTTPException(status_code=400, detail="step_number must be >= 1")
        return verify_step_uc.execute(slug, step_number, req)

    @router.post(
        "/experiments/{slug}/lab-report/generate",
        response_model=LabReportGenerateResponse,
    )
    def generate_academic_lab_report(
        slug: str, req: LabReportGenerateRequest
    ) -> LabReportGenerateResponse:
        return lab_report_uc.execute(slug, req)

    @router.get("/events/stream")
    def stream_agent_events() -> StreamingResponse:
        """
        Server-Sent Events (SSE) stream replacing RabbitMQ for real-time agent telemetry
        and inter-service event inspection (`contracts/events/PAYLOAD_CONTRACT.md`).
        """
        events = recent_events_provider()

        def event_generator():
            for ev in events:
                payload = json.dumps(ev.model_dump())
                yield f"event: {ev.event_type}\ndata: {payload}\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    @router.post("/chat/stream")
    async def stream_chat(req: ChatStreamRequest) -> StreamingResponse:
        """
        Sub-Agent 7: ConversationalTutorAgent (Tanya Lab AI SSE stream, FEAT-003).
        """
        return StreamingResponse(
            conversational_tutor_agent.stream_chat_response(req),
            media_type="text/event-stream",
        )

    return router
