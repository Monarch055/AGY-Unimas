"""
Layer 2 (Application Ports):
Dependency Inversion Interfaces for the 6 Google ADK Sub-Agents and Event Stream Dispatcher.
"""

from __future__ import annotations

from typing import Dict, List, Protocol, Tuple

from app.domain.models import (
    AgeAdaptiveLevelEnum,
    ExperimentScaffoldRequest,
    InventoryItemDTO,
    InventoryItemInput,
    InventoryScanRequest,
    LabReportGenerateRequest,
    LabReportGenerateResponse,
    RecommendationMatchRequest,
    RecommendationMatchResponse,
    RegionCode,
    RekaSainsEventEnvelope,
    STEMExperimentModuleDTO,
    SafetyAlertDTO,
    StepVisionVerifyRequest,
    StepVisionVerifyResponse,
)


class SafetyGuardianAgentPort(Protocol):
    """Agent #4: Active Co-Location & Chemical/Physical Hazard Gatekeeper (USP #7)."""

    def evaluate_workspace_hazards(
        self, material_slugs: List[str], region: RegionCode
    ) -> List[SafetyAlertDTO]:
        ...


class VisionInventoryAgentPort(Protocol):
    """Agent #1: Multimodal Workspace Inventory Perception Agent (USP #1 & #7)."""

    def extract_inventory_from_image(
        self, req: InventoryScanRequest
    ) -> List[InventoryItemDTO]:
        ...

    def extract_inventory_with_engine(
        self, req: InventoryScanRequest
    ) -> Tuple[List[InventoryItemDTO], str]:
        """Returns the detected items and the engine name ("rules" or the Gemini model)."""
        ...


class ResourceMatcherAgentPort(Protocol):
    """Agent #2: 3-Tier Resource Matcher & Functional Substitute Recommender (USP #2, #3, #4)."""

    def match_experiments(
        self, req: RecommendationMatchRequest, blocked_alerts: List[SafetyAlertDTO]
    ) -> RecommendationMatchResponse:
        ...


class CurriculumScaffolderAgentPort(Protocol):
    """Agent #3: 4-Level Age-Adaptive STEM Curriculum Scaffolder (USP #5 & #6)."""

    def scaffold_module(
        self, experiment_slug: str, req: ExperimentScaffoldRequest, safety_checks: List[SafetyAlertDTO]
    ) -> STEMExperimentModuleDTO:
        ...


class StepVisionAndARAgentPort(Protocol):
    """Agent #5: Interactive Step-by-Step AI Vision Checker & AR Coordinate Anchoring Agent (USP #8 & #9)."""

    def verify_step_and_anchor_ar(
        self, experiment_slug: str, step_number: int, req: StepVisionVerifyRequest
    ) -> StepVisionVerifyResponse:
        ...


class LabReportSynthesizerAgentPort(Protocol):
    """Agent #6: Automated Academic Lab Report PDF Draft Synthesizer (USP #10)."""

    def synthesize_lab_report(
        self, experiment_slug: str, req: LabReportGenerateRequest
    ) -> LabReportGenerateResponse:
        ...


class EventStreamBroadcasterPort(Protocol):
    """Zero-RabbitMQ Internal SSE & Background Telemetry Broadcaster."""

    def publish_event(self, event: RekaSainsEventEnvelope) -> None:
        ...
