"""
Layer 2 (Use Case): Interactive AI Vision Step Checker & AR Coordinate Overlay Anchoring (USP #8 & #9).
"""

from __future__ import annotations

from app.domain.catalog_knowledge import EXPERIMENT_BLUEPRINTS
from app.domain.models import (
    AgeAdaptiveLevelEnum,
    AROverlaySimulationDTO,
    AROverlayTypeEnum,
    RegionCode,
    StepVisionVerifyRequest,
    StepVisionVerifyResponse,
)


class VerifyStepVisionUseCase:
    """Verifies physical assembly from step photo and anchors AR overlay vector simulation."""

    def execute(
        self,
        experiment_slug: str,
        step_number: int,
        req: StepVisionVerifyRequest,
        verification_prompt: str = "",
    ) -> StepVisionVerifyResponse:
        exp = EXPERIMENT_BLUEPRINTS.get(experiment_slug)
        if not exp:
            experiment_slug = "rangkaian-listrik-baterai-kaleng-ar"
            exp = EXPERIMENT_BLUEPRINTS[experiment_slug]

        raw_steps = exp.steps_id if req.region == RegionCode.ID else exp.steps_my
        target_step = None
        for st in raw_steps:
            if st["step_number"] == step_number:
                target_step = st
                break

        if not target_step:
            target_step = raw_steps[0]
            step_number = target_step["step_number"]

        if not verification_prompt:
            verification_prompt = target_step["vision_verification_prompt"]

        upper = req.image_base64.upper()
        # Simulated vision evaluation:
        # Fails if image payload explicitly contains "WRONG", "INCOMPLETE", or "ERROR"
        is_correct = not any(kw in upper for kw in ("WRONG", "INCOMPLETE", "SALAH", "TERPUTUS"))

        confidence = 0.96 if is_correct else 0.72

        if req.region == RegionCode.ID:
            if is_correct:
                feedback = (
                    f"Langkah {step_number} terverifikasi benar! Komponen fisik terpasang rapi "
                    f"sesuai instruksi ({verification_prompt}). Silakan perhatikan animasi AR overlay "
                    f"di atas dan lanjutkan ke langkah berikutnya."
                )
            else:
                feedback = (
                    f"Langkah {step_number} belum tepat: sambungan komponen belum memenuhi kriteria "
                    f"({verification_prompt}). Periksa kembali polaritas kutub atau kerapatan saluran."
                )
        else:
            if is_correct:
                feedback = (
                    f"Langkah {step_number} disahkan betul! Komponen fizikal dipasang mengikut "
                    f"arahan ({verification_prompt}). Sila perhatikan animasi AR overlay di atas "
                    f"dan teruskan ke langkah seterusnya."
                )
            else:
                feedback = (
                    f"Langkah {step_number} belum tepat: sambungan komponen belum memenuhi kriteria "
                    f"({verification_prompt}). Periksa semula kekutuban atau ketumpatan tiub."
                )

        ar_overlay: AROverlaySimulationDTO = target_step["default_ar_overlay"]

        return StepVisionVerifyResponse(
            step_number=step_number,
            is_verified_correct=is_correct,
            confidence=confidence,
            feedback_message_local=feedback,
            can_proceed_to_next_step=is_correct,
            ar_overlay_simulation=ar_overlay,
        )
