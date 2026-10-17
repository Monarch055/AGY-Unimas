"""
Layer 2 (Use Case): 4-Level Age-Adaptive STEM Scaffolding & Offline Lab Pack Synthesis (USP #5, #6, #9).
"""

from __future__ import annotations

from typing import List

from app.domain.catalog_knowledge import EXPERIMENT_BLUEPRINTS, ExperimentBlueprintSpec
from app.domain.models import (
    AgeAdaptiveLevelEnum,
    CurriculumAlignmentDTO,
    CurriculumCodeEnum,
    ExperimentScaffoldRequest,
    ExperimentStepDTO,
    ReflectionQuestionDTO,
    RegionCode,
    SafetyAlertDTO,
    SafetySeverityEnum,
    STEMConceptsBreakdownDTO,
    STEMExperimentModuleDTO,
)


class ScaffoldExperimentUseCase:
    """Produces the structured pedagogical STEM module adapted to learner age and curriculum."""

    def execute(self, slug: str, req: ExperimentScaffoldRequest) -> STEMExperimentModuleDTO:
        exp = EXPERIMENT_BLUEPRINTS.get(slug)
        if not exp:
            # Fallback to the first available blueprint if slug not found
            slug = "rangkaian-listrik-baterai-kaleng-ar"
            exp = EXPERIMENT_BLUEPRINTS[slug]

        title = exp.title_id if req.region == RegionCode.ID else exp.title_my
        alignment = self._build_curriculum_alignment(exp, req.age_adaptive_level, req.region, req.curriculum_code, req.grade_level)
        concepts = self._build_concepts(exp, req.age_adaptive_level, req.region)
        variables_graph = exp.variables_and_graph(req.age_adaptive_level, req.region)
        steps = self._build_steps(exp, req.region)
        reflections = self._build_reflections(exp, req.region)

        safety_checks: List[SafetyAlertDTO] = []
        if exp.safety_severity != "SAFE":
            safety_checks.append(
                SafetyAlertDTO(
                    rule_code="GENERAL_ADULT_SUPERVISION",
                    severity=SafetySeverityEnum.ADULT_SUPERVISION,
                    involved_materials=[rm.material_slug for rm in exp.required_materials],
                    message_local="Eksperimen ini membutuhkan pengawasan orang dewasa / guru pendamping saat perakitan."
                    if req.region == RegionCode.ID
                    else "Eksperimen ini memerlukan pengawasan orang dewasa / guru pembimbing semasa pemasangan.",
                )
            )

        return STEMExperimentModuleDTO(
            experiment_slug=exp.slug,
            title_local=title,
            age_adaptive_level=req.age_adaptive_level,
            curriculum_alignment=alignment,
            stem_concepts=concepts,
            scientific_variables_and_graph=variables_graph,
            safety_checks=safety_checks,
            steps=steps,
            reflection_questions=reflections,
            offline_pack_version="1.1.0",
        )

    def _build_curriculum_alignment(
        self,
        exp: ExperimentBlueprintSpec,
        level: AgeAdaptiveLevelEnum,
        region: RegionCode,
        curriculum_code: CurriculumCodeEnum,
        grade_level: str,
    ) -> CurriculumAlignmentDTO:
        if region == RegionCode.ID:
            comp_code = exp.competency_codes_id.get(level, "K-MERDEKA-GEN")
            obj = exp.learning_objectives_id.get(level, "Memahami prinsip sains dasar dari eksperimen.")
        else:
            comp_code = exp.competency_codes_my.get(level, "KSSR-KSSM-GEN")
            obj = exp.learning_objectives_my.get(level, "Memahami prinsip sains asas daripada eksperimen.")

        return CurriculumAlignmentDTO(
            curriculum_code=curriculum_code.value,
            grade_level=grade_level,
            competency_code=comp_code,
            learning_objective=obj,
        )

    def _build_concepts(
        self,
        exp: ExperimentBlueprintSpec,
        level: AgeAdaptiveLevelEnum,
        region: RegionCode,
    ) -> STEMConceptsBreakdownDTO:
        breakdown_dict = exp.stem_concepts_id if region == RegionCode.ID else exp.stem_concepts_my
        concepts = breakdown_dict.get(level)
        if not concepts:
            # fallback to SMA level
            concepts = breakdown_dict.get(AgeAdaptiveLevelEnum.SMA_UPPER_SEC) or STEMConceptsBreakdownDTO(
                science="Konsep sains terpadu",
                technology="Aplikasi teknologi",
                engineering="Metode rekayasa",
                mathematics="Analisis matematis",
            )
        return concepts

    def _build_steps(
        self,
        exp: ExperimentBlueprintSpec,
        region: RegionCode,
    ) -> List[ExperimentStepDTO]:
        raw_steps = exp.steps_id if region == RegionCode.ID else exp.steps_my
        return [
            ExperimentStepDTO(
                step_number=st["step_number"],
                instruction=st["instruction"],
                requires_vision_verification=st["requires_vision_verification"],
                vision_verification_prompt=st["vision_verification_prompt"],
                default_ar_overlay=st["default_ar_overlay"],
                checkable=True,
            )
            for st in raw_steps
        ]

    def _build_reflections(
        self,
        exp: ExperimentBlueprintSpec,
        region: RegionCode,
    ) -> List[ReflectionQuestionDTO]:
        raw_ref = exp.reflection_questions_id if region == RegionCode.ID else exp.reflection_questions_my
        return [
            ReflectionQuestionDTO(
                question_id=rf["question_id"],
                prompt=rf["prompt"],
                options=rf["options"],
                correct_index=rf["correct_index"],
                explanation=rf["explanation"],
            )
            for rf in raw_ref
        ]
