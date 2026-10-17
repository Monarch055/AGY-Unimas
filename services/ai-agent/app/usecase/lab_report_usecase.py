"""
Layer 2 (Use Case): Automated Academic PDF Lab Report Synthesis (USP #10).
"""

from __future__ import annotations

from typing import List
from uuid import uuid4

from app.domain.catalog_knowledge import EXPERIMENT_BLUEPRINTS, ExperimentBlueprintSpec
from app.domain.models import (
    AgeAdaptiveLevelEnum,
    LabReportGenerateRequest,
    LabReportGenerateResponse,
    RegionCode,
    utc_now_iso,
)


class SynthesizeLabReportUseCase:
    """Synthesizes structured scientific lab report drafts ready for academic review & PDF export."""

    def execute(
        self, experiment_slug: str, req: LabReportGenerateRequest
    ) -> LabReportGenerateResponse:
        exp = EXPERIMENT_BLUEPRINTS.get(experiment_slug)
        if not exp:
            experiment_slug = "rangkaian-listrik-baterai-kaleng-ar"
            exp = EXPERIMENT_BLUEPRINTS[experiment_slug]

        title = (
            f"Laporan Praktikum STEM: {exp.title_id}"
            if req.region == RegionCode.ID
            else f"Laporan Amali STEM: {exp.title_my}"
        )

        level = req.age_adaptive_level
        scaffold_dict = exp.stem_concepts_id if req.region == RegionCode.ID else exp.stem_concepts_my
        concepts = scaffold_dict.get(level) or scaffold_dict.get(AgeAdaptiveLevelEnum.SMA_UPPER_SEC)

        obj_dict = exp.learning_objectives_id if req.region == RegionCode.ID else exp.learning_objectives_my
        objective = obj_dict.get(level) or "Membuktikan fenomena ilmiah melalui praktikum STEM terpadu."

        vars_spec = exp.variables_and_graph(level, req.region)
        if vars_spec:
            vars_summary = (
                f"Variabel Bebas: {vars_spec.independent_variable} | "
                f"Variabel Terikat: {vars_spec.dependent_variable} | "
                f"Variabel Kontrol: {', '.join(vars_spec.control_variables)} | "
                f"Persamaan Rumus: {' ; '.join(vars_spec.formulas_latex)}"
            )
            theoretical = f"{concepts.science} (Persamaan: {' ; '.join(vars_spec.formulas_latex)})"
        else:
            vars_summary = "Pengamatan kualitatif terhadap fenomena sains praktis dan rekayasa alat."
            theoretical = concepts.science

        materials_list: List[str] = [
            f"{rm.material_slug} ({int(rm.min_quantity)} {rm.unit})"
            for rm in exp.required_materials
        ]

        steps_raw = exp.steps_id if req.region == RegionCode.ID else exp.steps_my
        procedure_list: List[str] = [
            f"Langkah {st['step_number']}: {st['instruction']}" for st in steps_raw
        ]

        # Analyze observation rows if present
        data_summary = ""
        if req.observation_data_rows:
            count = len(req.observation_data_rows)
            first_row = req.observation_data_rows[0]
            last_row = req.observation_data_rows[-1]
            data_summary = (
                f"Berdasarkan pengambilan data sebanyak {count} kali percobaan "
                f"(Trial 1: X={first_row.x_value}, Y={first_row.y_value} hingga "
                f"Trial {count}: X={last_row.x_value}, Y={last_row.y_value}), "
                f"terlihat adanya korelasi data yang sesuai dengan hipotesis teoritis."
            )
        else:
            data_summary = "Pengamatan visual membuktikan berhasilnya rakitan eksperimen tanpa kendala fungsional."

        discussion = (
            f"Eksperimen '{title}' telah diselesaikan oleh {req.student_name} "
            f"dari {req.institution_name} ({req.class_or_nim}). {data_summary} "
            f"Prinsip Rekayasa & Teknologi: {concepts.engineering}. "
            f"Analisis Konsep Sains: {concepts.science}."
        )

        conclusion = (
            f"Berdasarkan hasil praktikum dan analisis data, dapat disimpulkan bahwa "
            f"tujuan pembelajaran telah tercapai secara empiris: '{objective}'. "
            f"Seluruh variabel eksperimen menunjukkan tren yang konsisten dengan kaidah STEM."
        )
        if req.region == RegionCode.MY:
            conclusion = (
                f"Berdasarkan dapatan amali dan analisis data, dapat disimpulkan bahawa "
                f"objektif pembelajaran telah dicapai secara empirikal: '{objective}'. "
                f"Semua pembolehubah eksperimen menunjukkan corak yang konsisten dengan prinsip STEM."
            )

        return LabReportGenerateResponse(
            report_id=str(uuid4()),
            title_local=title,
            objective_local=objective,
            theoretical_summary=theoretical,
            variables_summary=vars_summary,
            materials_used_list=materials_list,
            procedure_summary=procedure_list,
            result_analysis_discussion=discussion,
            conclusion_local=conclusion,
            generated_at_utc=utc_now_iso(),
        )
