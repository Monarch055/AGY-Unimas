"""
Layer 4 (Frameworks & Drivers Entrypoint):
FastAPI application bootstrap for `services/ai-agent` (6-Sub-Agent Google ADK Engine).
Exposes routes under both `/ai/v1/*` and `/v1/*` supporting both:
1. OpenAPI v1.1.0 endpoints (`/inventory/scan`, `/recommendations/match`, `/experiments/{slug}/scaffold`,
   `/experiments/{slug}/steps/{step_number}/verify-vision`, `/experiments/{slug}/lab-report/generate`,
   `/agents/manifest`, `/events/stream`)
2. Internal Core-API Gateway endpoints (`/vision/scan`, `/materials/substitutes`, `/curriculum/scaffold/{slug}`,
   `/vision/verify-step`, `/lab-report/synthesize`)
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from uuid import uuid4

from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.agents.adk_orchestrator import (
    CurriculumScaffolderAgent,
    LabReportSynthesizerAgent,
    ResourceMatcherAgent,
    SafetyGuardianAgent,
    StepVisionAndARAgent,
    VisionInventoryAgent,
    get_adk_agents_manifest,
)
from app.agents.gemini_lab_agents import (
    ExperimentSessionStore,
    GeminiCurriculumScaffolderAgent,
    GeminiLabReportAgent,
    GeminiResourceMatcherAgent,
    GeminiStepVisionAgent,
)
from app.delivery.http.api import router as gateway_compat_router
from app.delivery.http.router import create_agent_api_router
from app.domain.models import HealthCheckResponse, utc_now_iso
from app.infrastructure.config import settings
from app.infrastructure.event_stream import InMemorySSEEventBroadcaster
from app.infrastructure.gemini_client import GeminiError
from app.usecase.workflows import (
    MatchThreeTierAndSubstitutesUseCase,
    ScaffoldAdaptiveExperimentUseCase,
    ScanWorkspaceInventoryUseCase,
    SynthesizeAcademicLabReportUseCase,
    VerifyStepVisionAndARUseCase,
)

logging.basicConfig(
    level=settings.log_level.upper(),
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("rekasains.ai-agent")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("==================================================================")
    logger.info("   REKASAINS GOOGLE ADK 6-SUB-AGENT ENGINE INITIALIZED            ")
    logger.info(f"   Mode: Dual-Mode (Live Gemini Key: {bool(settings.gemini_api_key)})")
    logger.info(f"   Port: {settings.port} | Model: {settings.vision_model}")
    logger.info("   Sub-Agents: Vision, Matcher, Scaffolder, Safety, AR, LabReport ")
    logger.info("==================================================================")
    yield
    logger.info("Shutting down RekaSains Google ADK Engine gracefully.")


from fastapi.middleware.asyncexitstack import AsyncExitStackMiddleware
from starlette.middleware import Middleware
from starlette.middleware.errors import ServerErrorMiddleware
from starlette.middleware.exceptions import ExceptionMiddleware


class CompatFastAPI(FastAPI):
    """Ensures middleware unpacking compatibility across Starlette 0.27–1.x and FastAPI."""

    def build_middleware_stack(self):  # type: ignore[override]
        debug = self.debug
        error_handler = None
        exception_handlers = {}
        for key, value in self.exception_handlers.items():
            if key in (500, Exception):
                error_handler = value
            else:
                exception_handlers[key] = value
        middleware = (
            [Middleware(ServerErrorMiddleware, handler=error_handler, debug=debug)]
            + self.user_middleware
            + [
                Middleware(ExceptionMiddleware, handlers=exception_handlers, debug=debug),
                Middleware(AsyncExitStackMiddleware),
            ]
        )
        asgi_app = self.router
        for m in reversed(middleware):
            parts = tuple(m)
            if len(parts) == 3:
                cls, args, kwargs = parts
                asgi_app = cls(asgi_app, *args, **kwargs)
            else:
                cls, kwargs = parts
                asgi_app = cls(app=asgi_app, **kwargs)
        return asgi_app


def create_app() -> FastAPI:
    application = CompatFastAPI(
        title="RekaSains Google ADK AI Agent Service",
        description=(
            "Multi-Agent AI, Computer Vision, AR Coordinate Anchoring & Academic Lab Report Engine "
            "for RekaSains orchestrating 6 specialized Google ADK Sub-Agents (Zero-RabbitMQ Direct REST & SSE)."
        ),
        version="1.1.0",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-RekaSains-Engine"],
    )

    @application.middleware("http")
    async def attach_request_id(request: Request, call_next) -> Response:  # type: ignore[no-untyped-def]
        req_id = request.headers.get("X-Request-ID") or str(uuid4())
        response: Response = await call_next(request)
        response.headers["X-Request-ID"] = req_id
        # Lets clients show whether agent answers came from Gemini or the rule-based fallback.
        response.headers["X-RekaSains-Engine"] = "gemini" if settings.gemini_api_key else "rules"
        return response

    @application.exception_handler(GeminiError)
    async def gemini_error_handler(request: Request, exc: GeminiError) -> JSONResponse:
        logger.warning(f"Gemini failed at {request.url.path}: {exc}")
        return JSONResponse(
            status_code=status.HTTP_502_BAD_GATEWAY,
            content={"error_code": "GEMINI_FAILED", "detail": str(exc)},
        )

    @application.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error(f"Unhandled exception at {request.url.path}: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": "error",
                "message": "Internal AI Engine Error",
                "detail": str(exc),
                "timestamp": utc_now_iso(),
            },
        )

    event_bus = InMemorySSEEventBroadcaster(max_events=250)

    safety_agent = SafetyGuardianAgent()
    vision_agent = VisionInventoryAgent()
    if settings.gemini_api_key:
        # Gemini proposes experiments and writes modules/reports; safety stays rule-based.
        experiment_store = ExperimentSessionStore()
        matcher_agent = GeminiResourceMatcherAgent(experiment_store)
        scaffolder_agent = GeminiCurriculumScaffolderAgent(experiment_store)
        step_vision_ar_agent = GeminiStepVisionAgent(experiment_store)
        lab_report_agent = GeminiLabReportAgent(experiment_store)
    else:
        matcher_agent = ResourceMatcherAgent()
        scaffolder_agent = CurriculumScaffolderAgent()
        step_vision_ar_agent = StepVisionAndARAgent()
        lab_report_agent = LabReportSynthesizerAgent()

    scan_uc = ScanWorkspaceInventoryUseCase(
        vision_agent=vision_agent,
        safety_agent=safety_agent,
        event_bus=event_bus,
    )
    match_uc = MatchThreeTierAndSubstitutesUseCase(
        matcher_agent=matcher_agent,
        safety_agent=safety_agent,
    )
    scaffold_uc = ScaffoldAdaptiveExperimentUseCase(
        scaffolder_agent=scaffolder_agent,
        safety_agent=safety_agent,
        event_bus=event_bus,
    )
    verify_step_uc = VerifyStepVisionAndARUseCase(
        step_vision_ar_agent=step_vision_ar_agent,
        event_bus=event_bus,
    )
    lab_report_uc = SynthesizeAcademicLabReportUseCase(
        lab_report_agent=lab_report_agent,
        event_bus=event_bus,
    )

    canonical_router = create_agent_api_router(
        scan_uc=scan_uc,
        match_uc=match_uc,
        scaffold_uc=scaffold_uc,
        verify_step_uc=verify_step_uc,
        lab_report_uc=lab_report_uc,
        manifest_provider=get_adk_agents_manifest,
        recent_events_provider=event_bus.get_recent_events,
    )

    # Mount canonical OpenAPI routes first, then Core-API internal gateway compat routes
    application.include_router(canonical_router, prefix="/ai/v1", tags=["Google ADK 6-Agents (/ai/v1)"])
    application.include_router(canonical_router, prefix="/v1", tags=["Google ADK 6-Agents Alias (/v1)"])
    application.include_router(gateway_compat_router, prefix="/ai/v1", tags=["Core-API Gateway Compat (/ai/v1)"])
    application.include_router(gateway_compat_router, prefix="/v1", tags=["Core-API Gateway Compat (/v1)"])

    @application.get("/health", response_model=HealthCheckResponse)
    @application.get("/healthz", response_model=HealthCheckResponse)
    def root_health() -> HealthCheckResponse:
        return HealthCheckResponse(
            status="ok",
            service="rekasains-ai-agent",
            timestamp=utc_now_iso(),
        )

    return application


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=False,
    )
