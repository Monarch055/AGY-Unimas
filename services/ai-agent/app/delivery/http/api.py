"""
Layer 3 (Interface Adapter): FastAPI REST Handlers & SSE Streaming Endpoints.
Synchronized 1:1 with `contracts/api/openapi.yaml` v1.1.0 & `services/core-api/internal/gateway/adk_gateway.go`.
"""

from __future__ import annotations

import asyncio
import json
from typing import Any, AsyncGenerator, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, Path, Query, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.agents.google_adk_engine import adk_engine
from app.domain.catalog_knowledge import CANONICAL_MATERIALS, FUNCTIONAL_SUBSTITUTES
from app.domain.models import (
    AgeAdaptiveLevelEnum,
    ExperimentScaffoldRequest,
    FunctionalMaterialSubstituteDTO,
    HealthCheckResponse,
    InventoryScanRequest,
    InventoryScanResponse,
    LabReportGenerateRequest,
    LabReportGenerateResponse,
    RecommendationMatchRequest,
    RecommendationMatchResponse,
    RegionCode,
    RekaSainsEventEnvelope,
    STEMExperimentModuleDTO,
    StepVisionVerifyRequest,
    StepVisionVerifyResponse,
    SupportedImageMimeType,
    utc_now_iso,
)

router = APIRouter()


class VerifyStepDirectRequest(BaseModel):
    experiment_slug: str = Field(..., min_length=1)
    step_number: int = Field(..., ge=1)
    vision_verification_prompt: str = ""
    image_base64: str = Field(..., min_length=1)
    mime_type: SupportedImageMimeType = "image/jpeg"
    region: RegionCode = RegionCode.ID
    age_adaptive_level: AgeAdaptiveLevelEnum = AgeAdaptiveLevelEnum.SMA_UPPER_SEC


class LabReportDirectRequest(LabReportGenerateRequest):
    experiment_slug: Optional[str] = "rangkaian-listrik-baterai-kaleng-ar"


# ============================================================================
# 1. Health Checks
# ============================================================================


@router.get("/health", response_model=HealthCheckResponse)
@router.get("/healthz", response_model=HealthCheckResponse)
def health_check() -> HealthCheckResponse:
    return HealthCheckResponse(
        status="ok",
        service="rekasains-ai-agent",
        timestamp=utc_now_iso(),
    )


# ============================================================================
# 2. Vision Inventory Scan (USP #1 & #7)
# ============================================================================


@router.post(
    "/vision/scan",
    response_model=InventoryScanResponse,
    status_code=status.HTTP_200_OK,
)
def scan_workspace_inventory(
    req: InventoryScanRequest, background_tasks: BackgroundTasks
) -> InventoryScanResponse:
    """
    Sub-Agent 1 (VisionInventoryAgent) + Sub-Agent 4 (SafetyGuardianAgent).
    Extracts objects, counts quantities, maps to canonical taxonomy,
    and returns immediate red alerts if co-located dangerous items are found.
    """
    resp = adk_engine.scan_inventory(req)

    # Broadcast event envelope via background tasks (Zero-RabbitMQ SSE/telemetry)
    background_tasks.add_task(
        _log_agent_event,
        "inventory.scan.completed",
        {
            "scan_id": resp.scan_id,
            "region": resp.region.value,
            "detected_count": len(resp.detected_items),
            "hazard_count": len(resp.active_workspace_hazards),
        },
    )

    return resp


# ============================================================================
# 3. 3-Tier Matcher & Functional Substitutes (USP #2, #3, #4)
# ============================================================================


@router.post(
    "/recommendations/match",
    response_model=RecommendationMatchResponse,
    status_code=status.HTTP_200_OK,
)
def match_recommendations(
    req: RecommendationMatchRequest,
) -> RecommendationMatchResponse:
    """
    Sub-Agent 2 (ResourceMatcherAgent) + Sub-Agent 4 (SafetyGuardianAgent).
    Matches user inventory against experiments in 3 tiers:
    Strict 100%, DIY/Functional Substitutes, and Local Micro-Shop.
    """
    return adk_engine.match_recommendations(req)


@router.get(
    "/materials/substitutes",
    response_model=List[FunctionalMaterialSubstituteDTO],
    status_code=status.HTTP_200_OK,
)
def list_functional_substitutes(
    region: RegionCode = Query(default=RegionCode.ID),
) -> List[FunctionalMaterialSubstituteDTO]:
    """Returns the list of curated physics/chemistry material substitution rules."""
    results: List[FunctionalMaterialSubstituteDTO] = []
    for (miss_slug, sub_slug), spec in FUNCTIONAL_SUBSTITUTES.items():
        miss_mat = CANONICAL_MATERIALS.get(miss_slug)
        sub_mat = CANONICAL_MATERIALS.get(sub_slug)
        miss_name = miss_mat.local_name(region) if miss_mat else miss_slug
        sub_name = sub_mat.local_name(region) if sub_mat else sub_slug

        principle = spec.shared_principle_id if region == RegionCode.ID else spec.shared_principle_my
        steps = spec.adaptation_steps_id if region == RegionCode.ID else spec.adaptation_steps_my

        results.append(
            FunctionalMaterialSubstituteDTO(
                missing_material_slug=miss_slug,
                missing_name_local=miss_name,
                substitute_material_slug=sub_slug,
                substitute_name_local=sub_name,
                shared_scientific_principle=principle,
                adaptation_steps=steps,
            )
        )
    return results


# ============================================================================
# 4. 4-Level Age-Adaptive Scaffolder (USP #5 & #6)
# ============================================================================


@router.post(
    "/curriculum/scaffold/{slug}",
    response_model=STEMExperimentModuleDTO,
    status_code=status.HTTP_200_OK,
)
def scaffold_experiment_module(
    slug: str = Path(..., min_length=1),
    req: ExperimentScaffoldRequest = ...,
) -> STEMExperimentModuleDTO:
    """
    Sub-Agent 3 (CurriculumScaffolderAgent).
    Synthesizes the complete age-adaptive STEM module (SD, SMP, SMA, Higher Ed).
    """
    return adk_engine.scaffold_experiment(slug, req)


# ============================================================================
# 5. Interactive Step Vision Checker & AR Anchoring (USP #8 & #9)
# ============================================================================


@router.post(
    "/vision/verify-step",
    response_model=StepVisionVerifyResponse,
    status_code=status.HTTP_200_OK,
)
def verify_step_vision(
    req: VerifyStepDirectRequest, background_tasks: BackgroundTasks
) -> StepVisionVerifyResponse:
    """
    Sub-Agent 5 (StepVisionAndARAgent).
    Verifies user's step assembly via camera and returns normalized AR overlay coordinates.
    """
    step_req = StepVisionVerifyRequest(
        image_base64=req.image_base64,
        mime_type=req.mime_type,
        region=req.region,
        age_adaptive_level=req.age_adaptive_level,
    )
    resp = adk_engine.verify_step_vision(
        experiment_slug=req.experiment_slug,
        step_number=req.step_number,
        req=step_req,
        verification_prompt=req.vision_verification_prompt,
    )

    background_tasks.add_task(
        _log_agent_event,
        "experiment.step.verified",
        {
            "experiment_slug": req.experiment_slug,
            "step_number": req.step_number,
            "is_verified_correct": resp.is_verified_correct,
            "confidence": resp.confidence,
        },
    )

    return resp


# ============================================================================
# 6. Academic PDF Lab Report Synthesizer (USP #10)
# ============================================================================


@router.post(
    "/lab-report/synthesize",
    response_model=LabReportGenerateResponse,
    status_code=status.HTTP_200_OK,
)
def synthesize_academic_lab_report(
    req: LabReportDirectRequest, background_tasks: BackgroundTasks
) -> LabReportGenerateResponse:
    """
    Sub-Agent 6 (LabReportSynthesizerAgent).
    Synthesizes academic lab report drafts from experiment photos and observation data.
    """
    slug = req.experiment_slug or "rangkaian-listrik-baterai-kaleng-ar"
    base_req = LabReportGenerateRequest(
        region=req.region,
        age_adaptive_level=req.age_adaptive_level,
        student_name=req.student_name,
        institution_name=req.institution_name,
        class_or_nim=req.class_or_nim,
        instructor_name=req.instructor_name,
        result_photo_base64=req.result_photo_base64,
        observation_data_rows=req.observation_data_rows,
        reflection_answers=req.reflection_answers,
    )
    resp = adk_engine.synthesize_lab_report(slug, base_req)

    background_tasks.add_task(
        _log_agent_event,
        "lab_report.synthesized",
        {
            "report_id": resp.report_id,
            "student_name": req.student_name,
            "institution_name": req.institution_name,
        },
    )

    return resp


# ============================================================================
# 7. Brokerless SSE Event Stream (`contracts/events/PAYLOAD_CONTRACT.md`)
# ============================================================================


async def _sse_streamer() -> AsyncGenerator[str, None]:
    """Yields connected ping and heartbeat frames for SSE clients."""
    initial_event = RekaSainsEventEnvelope(
        event_type="agent.connected",
        data={"message": "Connected to RekaSains Google ADK SSE Stream"},
    )
    yield f"data: {initial_event.model_dump_json()}\n\n"

    # Send keepalive heartbeats
    for _ in range(3):
        await asyncio.sleep(1)
        hb_event = RekaSainsEventEnvelope(
            event_type="agent.heartbeat",
            data={"status": "online"},
        )
        yield f"data: {hb_event.model_dump_json()}\n\n"


@router.get("/events/stream")
async def events_sse_stream() -> StreamingResponse:
    """Server-Sent Events endpoint implementing PAYLOAD_CONTRACT.md without RabbitMQ."""
    return StreamingResponse(_sse_streamer(), media_type="text/event-stream")


def _log_agent_event(event_type: str, data: Dict[str, Any]) -> None:
    envelope = RekaSainsEventEnvelope(
        event_type=event_type,
        data=data,
    )
    # In-memory logging of event envelope
    # In production, this can be pushed to an internal SSE broadcast queue
    pass
