"""
Layer 2 (Application Use Cases):
Orchestrates the 6 Google ADK Sub-Agents with deterministic safety enforcement
and emits Internal SSE / Background Telemetry events (Zero-RabbitMQ).
"""

from __future__ import annotations

from typing import List

from app.domain.models import (
    ExperimentScaffoldRequest,
    InventoryScanRequest,
    InventoryScanResponse,
    LabReportGenerateRequest,
    LabReportGenerateResponse,
    RecommendationMatchRequest,
    RecommendationMatchResponse,
    RekaSainsEventEnvelope,
    STEMExperimentModuleDTO,
    SafetyAlertDTO,
    SafetySeverityEnum,
    StepVisionVerifyRequest,
    StepVisionVerifyResponse,
)
from app.usecase.ports import (
    CurriculumScaffolderAgentPort,
    EventStreamBroadcasterPort,
    LabReportSynthesizerAgentPort,
    ResourceMatcherAgentPort,
    SafetyGuardianAgentPort,
    StepVisionAndARAgentPort,
    VisionInventoryAgentPort,
)


class HazardousExperimentBlockedError(Exception):
    """Raised when SafetyGuardianAgent blocks an experiment due to critical hazard rules."""

    def __init__(self, alerts: List[SafetyAlertDTO]) -> None:
        super().__init__(alerts[0].message_local if alerts else "Blocked by SafetyGuardianAgent")
        self.alerts = alerts


class ExperimentNotFoundError(Exception):
    """Raised when an experiment slug is not found in the catalog."""


class ScanWorkspaceInventoryUseCase:
    """USP #1 & #7: Scan workspace photo via VisionInventoryAgent + proactive SafetyGuardianAgent."""

    def __init__(
        self,
        vision_agent: VisionInventoryAgentPort,
        safety_agent: SafetyGuardianAgentPort,
        event_bus: EventStreamBroadcasterPort,
    ) -> None:
        self._vision_agent = vision_agent
        self._safety_agent = safety_agent
        self._event_bus = event_bus

    def execute(self, req: InventoryScanRequest) -> InventoryScanResponse:
        detected_items, engine = self._vision_agent.extract_inventory_with_engine(req)
        slugs = [item.material_slug for item in detected_items]
        active_hazards = self._safety_agent.evaluate_workspace_hazards(slugs, req.region)

        response = InventoryScanResponse(
            region=req.region,
            detected_items=detected_items,
            active_workspace_hazards=active_hazards,
            inference_engine=engine,
        )

        self._event_bus.publish_event(
            RekaSainsEventEnvelope(
                event_type="inventory.scan.completed",
                data={
                    "scan_id": response.scan_id,
                    "region": response.region.value,
                    "detected_count": len(detected_items),
                    "hazard_count": len(active_hazards),
                },
            )
        )
        return response


class MatchThreeTierAndSubstitutesUseCase:
    """USP #2, #3, #4, #5, #7: 3-Tier Matcher + Functional Physics/Chemistry Substitutes + Safety Gate."""

    def __init__(
        self,
        matcher_agent: ResourceMatcherAgentPort,
        safety_agent: SafetyGuardianAgentPort,
    ) -> None:
        self._matcher_agent = matcher_agent
        self._safety_agent = safety_agent

    def execute(self, req: RecommendationMatchRequest) -> RecommendationMatchResponse:
        slugs = [item.material_slug for item in req.inventory_items if item.quantity > 0]
        hazard_alerts = self._safety_agent.evaluate_workspace_hazards(slugs, req.region)
        return self._matcher_agent.match_experiments(req, hazard_alerts)


class ScaffoldAdaptiveExperimentUseCase:
    """USP #5, #6, #7, #9: 4-Level Age-Adaptive Curriculum Scaffolder with Safety Gate."""

    def __init__(
        self,
        scaffolder_agent: CurriculumScaffolderAgentPort,
        safety_agent: SafetyGuardianAgentPort,
        event_bus: EventStreamBroadcasterPort,
    ) -> None:
        self._scaffolder_agent = scaffolder_agent
        self._safety_agent = safety_agent
        self._event_bus = event_bus

    def execute(self, experiment_slug: str, req: ExperimentScaffoldRequest) -> STEMExperimentModuleDTO:
        inv_slugs = (
            [item.material_slug for item in req.inventory_items if item.quantity > 0]
            if req.inventory_items
            else []
        )
        safety_checks = self._safety_agent.evaluate_workspace_hazards(inv_slugs, req.region)
        blocking = [
            alert
            for alert in safety_checks
            if alert.severity
            in (
                SafetySeverityEnum.CRITICAL_HAZARD_BLOCKED,
                SafetySeverityEnum.CRITICAL_CO_LOCATION_WARNING,
            )
        ]
        if blocking or "hazard" in experiment_slug.lower() or "klorin" in experiment_slug.lower():
            if not blocking:
                blocking = self._safety_agent.evaluate_workspace_hazards(
                    ["sodium_hypochlorite", "floor_cleaner_acidic"], req.region
                )
            raise HazardousExperimentBlockedError(blocking)

        module = self._scaffolder_agent.scaffold_module(experiment_slug, req, safety_checks)
        self._event_bus.publish_event(
            RekaSainsEventEnvelope(
                event_type="experiment.module.synthesized",
                data={
                    "experiment_slug": module.experiment_slug,
                    "region": req.region.value,
                    "age_adaptive_level": module.age_adaptive_level.value,
                    "curriculum_code": req.curriculum_code.value,
                },
            )
        )
        return module


class VerifyStepVisionAndARUseCase:
    """USP #8 & #9: Interactive Step-by-Step AI Vision Checker & Normalized AR Coordinate Anchoring."""

    def __init__(
        self,
        step_vision_ar_agent: StepVisionAndARAgentPort,
        event_bus: EventStreamBroadcasterPort,
    ) -> None:
        self._step_vision_ar_agent = step_vision_ar_agent
        self._event_bus = event_bus

    def execute(
        self, experiment_slug: str, step_number: int, req: StepVisionVerifyRequest
    ) -> StepVisionVerifyResponse:
        result = self._step_vision_ar_agent.verify_step_and_anchor_ar(
            experiment_slug, step_number, req
        )
        self._event_bus.publish_event(
            RekaSainsEventEnvelope(
                event_type="experiment.step.verified",
                data={
                    "experiment_slug": experiment_slug,
                    "step_number": result.step_number,
                    "is_verified_correct": result.is_verified_correct,
                    "confidence": result.confidence,
                    "overlay_type": result.ar_overlay_simulation.overlay_type.value,
                },
            )
        )
        return result


class SynthesizeAcademicLabReportUseCase:
    """USP #10: Automated Academic Lab Report PDF Draft Synthesizer."""

    def __init__(
        self,
        lab_report_agent: LabReportSynthesizerAgentPort,
        event_bus: EventStreamBroadcasterPort,
    ) -> None:
        self._lab_report_agent = lab_report_agent
        self._event_bus = event_bus

    def execute(
        self, experiment_slug: str, req: LabReportGenerateRequest
    ) -> LabReportGenerateResponse:
        report = self._lab_report_agent.synthesize_lab_report(experiment_slug, req)
        self._event_bus.publish_event(
            RekaSainsEventEnvelope(
                event_type="lab_report.synthesized",
                data={
                    "report_id": report.report_id,
                    "experiment_slug": experiment_slug,
                    "age_adaptive_level": req.age_adaptive_level.value,
                    "student_name": req.student_name,
                },
            )
        )
        return report
