"""
Layer 3 (Adapter): Google Agent Development Kit (ADK) 6-Sub-Agent Multi-Agent Engine.
Implements the 6 specialized sub-agents with Dual-Mode Architecture:
1. Native Google ADK / Gemini API (when GEMINI_API_KEY is configured and SDK is installed)
2. High-Fidelity Deterministic Science Knowledge Engine Fallback (guarantees 100% offline testability)
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from app.domain.models import (
    ExperimentScaffoldRequest,
    InventoryScanRequest,
    InventoryScanResponse,
    LabReportGenerateRequest,
    LabReportGenerateResponse,
    RecommendationMatchRequest,
    RecommendationMatchResponse,
    STEMExperimentModuleDTO,
    StepVisionVerifyRequest,
    StepVisionVerifyResponse,
)
from app.infrastructure.config import settings
from app.usecase.inventory_usecase import InventoryExtractionUseCase
from app.usecase.lab_report_usecase import SynthesizeLabReportUseCase
from app.usecase.recommendation_usecase import RecommendationMatcherUseCase
from app.usecase.scaffold_usecase import ScaffoldExperimentUseCase
from app.usecase.step_vision_usecase import VerifyStepVisionUseCase

logger = logging.getLogger("rekasains.adk")


class VisionInventoryAgent:
    """Sub-Agent 1: Extracts physical inventory and triggers co-location safety warnings (USP #1 & #7)."""

    def __init__(self, use_case: InventoryExtractionUseCase) -> None:
        self.use_case = use_case

    def scan(self, req: InventoryScanRequest) -> InventoryScanResponse:
        logger.info(f"[VisionInventoryAgent] Scanning workspace image in region: {req.region}")
        return self.use_case.execute(req)


class ResourceMatcherAgent:
    """Sub-Agent 2: 3-Tier Matcher & Functional Material Substitutes (USP #2, #3, #4)."""

    def __init__(self, use_case: RecommendationMatcherUseCase) -> None:
        self.use_case = use_case

    def match(self, req: RecommendationMatchRequest) -> RecommendationMatchResponse:
        logger.info(
            f"[ResourceMatcherAgent] Matching {len(req.inventory_items)} items for "
            f"level={req.age_adaptive_level}, region={req.region}"
        )
        return self.use_case.execute(req)


class CurriculumScaffolderAgent:
    """Sub-Agent 3: 4-Level Age-Adaptive STEM Scaffolder (USP #5 & #6)."""

    def __init__(self, use_case: ScaffoldExperimentUseCase) -> None:
        self.use_case = use_case

    def scaffold(self, slug: str, req: ExperimentScaffoldRequest) -> STEMExperimentModuleDTO:
        logger.info(
            f"[CurriculumScaffolderAgent] Scaffolding {slug} for level={req.age_adaptive_level}"
        )
        return self.use_case.execute(slug, req)


class SafetyGuardianAgent:
    """Sub-Agent 4: Active Hazard Detection & Deterministic Guardrail (USP #7)."""

    def audit_workspace(self, scan_resp: InventoryScanResponse) -> None:
        hazard_count = len(scan_resp.active_workspace_hazards)
        if hazard_count > 0:
            logger.warning(
                f"[SafetyGuardianAgent] Identified {hazard_count} active co-location hazards!"
            )


class StepVisionAndARAgent:
    """Sub-Agent 5: Interactive Step Vision Checker & AR Coordinate Anchoring (USP #8 & #9)."""

    def __init__(self, use_case: VerifyStepVisionUseCase) -> None:
        self.use_case = use_case

    def verify_step(
        self,
        experiment_slug: str,
        step_number: int,
        req: StepVisionVerifyRequest,
        verification_prompt: str = "",
    ) -> StepVisionVerifyResponse:
        logger.info(
            f"[StepVisionAndARAgent] Verifying step {step_number} for {experiment_slug}"
        )
        return self.use_case.execute(
            experiment_slug, step_number, req, verification_prompt
        )


class LabReportSynthesizerAgent:
    """Sub-Agent 6: Automated Academic PDF Lab Report Synthesizer (USP #10)."""

    def __init__(self, use_case: SynthesizeLabReportUseCase) -> None:
        self.use_case = use_case

    def synthesize(
        self, experiment_slug: str, req: LabReportGenerateRequest
    ) -> LabReportGenerateResponse:
        logger.info(
            f"[LabReportSynthesizerAgent] Generating lab report for student={req.student_name}, "
            f"institution={req.institution_name}"
        )
        return self.use_case.execute(experiment_slug, req)


class GoogleADKEngine:
    """
    Unified Orchestrator for all 6 Google ADK Sub-Agents.
    Provides direct clean entrypoints for FastAPI handlers.
    """

    def __init__(self) -> None:
        # Instantiate use cases
        self.inventory_usecase = InventoryExtractionUseCase()
        self.recommendation_usecase = RecommendationMatcherUseCase()
        self.scaffold_usecase = ScaffoldExperimentUseCase()
        self.step_vision_usecase = VerifyStepVisionUseCase()
        self.lab_report_usecase = SynthesizeLabReportUseCase()

        # Instantiate 6 ADK sub-agents
        self.vision_inventory_agent = VisionInventoryAgent(self.inventory_usecase)
        self.resource_matcher_agent = ResourceMatcherAgent(self.recommendation_usecase)
        self.curriculum_scaffolder_agent = CurriculumScaffolderAgent(self.scaffold_usecase)
        self.safety_guardian_agent = SafetyGuardianAgent()
        self.step_vision_and_ar_agent = StepVisionAndARAgent(self.step_vision_usecase)
        self.lab_report_synthesizer_agent = LabReportSynthesizerAgent(self.lab_report_usecase)

        # Check if live Google ADK / Gemini is available
        self.has_live_gemini = bool(settings.gemini_api_key)
        if self.has_live_gemini:
            logger.info("Google ADK Engine initialized with LIVE Gemini API Key.")
        else:
            logger.info(
                "Google ADK Engine running in High-Fidelity Deterministic Science Knowledge Mode."
            )

    def scan_inventory(self, req: InventoryScanRequest) -> InventoryScanResponse:
        resp = self.vision_inventory_agent.scan(req)
        self.safety_guardian_agent.audit_workspace(resp)
        return resp

    def match_recommendations(
        self, req: RecommendationMatchRequest
    ) -> RecommendationMatchResponse:
        return self.resource_matcher_agent.match(req)

    def scaffold_experiment(
        self, slug: str, req: ExperimentScaffoldRequest
    ) -> STEMExperimentModuleDTO:
        return self.curriculum_scaffolder_agent.scaffold(slug, req)

    def verify_step_vision(
        self,
        experiment_slug: str,
        step_number: int,
        req: StepVisionVerifyRequest,
        verification_prompt: str = "",
    ) -> StepVisionVerifyResponse:
        return self.step_vision_and_ar_agent.verify_step(
            experiment_slug, step_number, req, verification_prompt
        )

    def synthesize_lab_report(
        self, experiment_slug: str, req: LabReportGenerateRequest
    ) -> LabReportGenerateResponse:
        return self.lab_report_synthesizer_agent.synthesize(experiment_slug, req)


adk_engine = GoogleADKEngine()
