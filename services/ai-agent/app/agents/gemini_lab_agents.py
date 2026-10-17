"""
Layer 3 (Adapters): Gemini-backed implementations of the matcher, scaffolder, step checker and
lab report ports. Gemini proposes and writes; code verifies what must be certain:

- Match tiers are computed from the user's inventory, not taken from the model's claim.
- Experiments that use any material from the deterministic hazard rules are dropped.
- Generated experiments and modules are kept in memory so later steps can refer to them by slug.
"""

from __future__ import annotations

import hashlib
import logging
import re
import threading
from dataclasses import dataclass, field
from typing import Dict, List, Literal, Optional
from urllib.parse import quote_plus

from pydantic import BaseModel, Field

from app.domain.catalog_knowledge import CANONICAL_MATERIALS, SAFETY_HAZARD_RULES
from app.domain.models import (
    AgeAdaptiveLevelEnum,
    AROverlaySimulationDTO,
    AROverlayTypeEnum,
    CurrencyCodeEnum,
    CurriculumAlignmentDTO,
    ExperimentRecommendationCardDTO,
    ExperimentScaffoldRequest,
    ExperimentStepDTO,
    ExpectedGraphTrendEnum,
    FunctionalMaterialSubstituteDTO,
    LabReportGenerateRequest,
    LabReportGenerateResponse,
    LocalSourcingItemDTO,
    MatchTierEnum,
    RecommendationMatchRequest,
    RecommendationMatchResponse,
    ReflectionQuestionDTO,
    RegionCode,
    SafetyAlertDTO,
    SafetySeverityEnum,
    ScientificVariablesAndGraphSchemaDTO,
    STEMConceptsBreakdownDTO,
    STEMExperimentModuleDTO,
    StepVisionVerifyRequest,
    StepVisionVerifyResponse,
)
from app.infrastructure.config import settings
from app.infrastructure.gemini_client import (
    GeminiError,
    decode_image,
    generate_structured,
    output_language,
)

logger = logging.getLogger("rekasains.gemini-agents")

HAZARDOUS_SLUGS = {r.material_slug_a for r in SAFETY_HAZARD_RULES} | {
    r.material_slug_b for r in SAFETY_HAZARD_RULES
}
MAX_LOCAL_SHOP_MISSING = 2
NO_OVERLAY = AROverlaySimulationDTO(overlay_type=AROverlayTypeEnum.NONE, caption_local="", vector_paths=[])

LEVEL_DESCRIPTIONS: Dict[AgeAdaptiveLevelEnum, str] = {
    AgeAdaptiveLevelEnum.SD_ELEMENTARY: "SD / Sekolah Rendah (bahasa sederhana, cerita fenomena, tanpa rumus)",
    AgeAdaptiveLevelEnum.SMP_LOWER_SEC: "SMP / Menengah Rendah (konsep sebab-akibat, perhitungan sederhana)",
    AgeAdaptiveLevelEnum.SMA_UPPER_SEC: "SMA/SMK / Menengah Atas (rumus, variabel bebas/terikat/kontrol, data kuantitatif)",
    AgeAdaptiveLevelEnum.HIGHER_ED_UNI: "Perguruan tinggi (analisis kuantitatif, regresi, ketidakpastian pengukuran)",
}


def _level_needs_variables(level: AgeAdaptiveLevelEnum) -> bool:
    return level in (AgeAdaptiveLevelEnum.SMA_UPPER_SEC, AgeAdaptiveLevelEnum.HIGHER_ED_UNI)


def _material_name(slug: str, region: RegionCode) -> str:
    spec = CANONICAL_MATERIALS.get(slug)
    if spec:
        return spec.local_name(region)
    return re.sub(r"^other_", "", slug).replace("_", " ").strip() or slug


def _format_price(amount: int, region: RegionCode) -> str:
    if region == RegionCode.ID:
        return "Rp " + f"{amount:,}".replace(",", ".")
    return f"RM {amount // 100}.{amount % 100:02d}"


def _slugify(title: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:48] or "eksperimen"
    digest = hashlib.sha1(title.encode("utf-8")).hexdigest()[:6]
    return f"ai-{base}-{digest}"


# ============================================================================
# Shared in-memory store of generated experiments and modules
# ============================================================================


@dataclass
class _ExperimentRecord:
    slug: str
    region: RegionCode
    title: str
    summary: str
    curriculum_badge: str
    safety: str
    materials: List[str]
    module: Optional[STEMExperimentModuleDTO] = None


@dataclass
class ExperimentSessionStore:
    _records: Dict[str, _ExperimentRecord] = field(default_factory=dict)
    _lock: threading.Lock = field(default_factory=threading.Lock)

    def put(self, record: _ExperimentRecord) -> None:
        with self._lock:
            existing = self._records.get(record.slug)
            if existing and existing.module:
                record.module = existing.module
            self._records[record.slug] = record

    def get(self, slug: str) -> Optional[_ExperimentRecord]:
        with self._lock:
            return self._records.get(slug)

    def set_module(self, slug: str, module: STEMExperimentModuleDTO) -> None:
        with self._lock:
            if slug in self._records:
                self._records[slug].module = module


def _require_record(store: ExperimentSessionStore, slug: str) -> _ExperimentRecord:
    record = store.get(slug)
    if record is None:
        raise GeminiError(
            "Eksperimen ini tidak dikenal oleh server (mungkin server baru dijalankan ulang). "
            "Cari eksperimen lagi dari inventaris."
        )
    return record


# ============================================================================
# Agent #2: ResourceMatcherAgent (Gemini proposes, code assigns tiers)
# ============================================================================


class _NeededMaterial(BaseModel):
    material_slug: str = Field(description="Slug persis dari inventaris/katalog, atau 'other'.")
    name: str
    quantity: int = Field(ge=1)


class _SubstituteIdea(BaseModel):
    missing_name: str
    missing_slug: str = Field(description="Slug bahan yang kurang (katalog) atau 'other'.")
    substitute_slug: str = Field(description="Slug bahan pengganti yang ADA di inventaris pengguna.")
    shared_principle: str
    adaptation_steps: List[str]


class _ShopItemIdea(BaseModel):
    material_slug: str
    name: str
    quantity: int = Field(ge=1)
    unit: str
    est_price_int: int = Field(ge=0, description="Harga total dalam Rupiah (ID) atau sen Ringgit (MY).")
    stores: List[str]


class _ExperimentIdea(BaseModel):
    title: str
    summary: str
    curriculum_badge: str = Field(description="Kurikulum + jenjang + topik, mis. 'Kurikulum Merdeka SMA Fase E: Hukum Ohm'.")
    safety: Literal["SAFE", "ADULT_SUPERVISION"]
    materials: List[_NeededMaterial]
    substitutes: List[_SubstituteIdea]
    shop_items: List[_ShopItemIdea]


class _ExperimentIdeas(BaseModel):
    experiments: List[_ExperimentIdea]


class GeminiResourceMatcherAgent:
    agent_name = "ResourceMatcherAgent"

    def __init__(self, store: ExperimentSessionStore) -> None:
        self._store = store

    def match_experiments(
        self, req: RecommendationMatchRequest, blocked_alerts: List[SafetyAlertDTO]
    ) -> RecommendationMatchResponse:
        inventory = {i.material_slug: i.quantity for i in req.inventory_items if i.quantity > 0}
        usable = {slug: qty for slug, qty in inventory.items() if slug not in HAZARDOUS_SLUGS}

        empty = RecommendationMatchResponse(
            region=req.region,
            strict_100_matches=[],
            diy_substitute_matches=[],
            local_micro_shop_matches=[],
            blocked_hazard_alerts=blocked_alerts,
        )
        if not usable:
            return empty

        ideas = generate_structured(self._prompt(req, usable), _ExperimentIdeas, temperature=0.7)

        strict: List[ExperimentRecommendationCardDTO] = []
        diy: List[ExperimentRecommendationCardDTO] = []
        shop: List[ExperimentRecommendationCardDTO] = []
        for idea in ideas.experiments:
            card = self._to_card(idea, req, usable)
            if card is None:
                continue
            {
                MatchTierEnum.STRICT_100: strict,
                MatchTierEnum.DIY_SUBSTITUTE: diy,
                MatchTierEnum.LOCAL_MICRO_SHOP: shop,
            }[card.match_tier].append(card)

        return empty.model_copy(
            update={
                "strict_100_matches": strict,
                "diy_substitute_matches": diy,
                "local_micro_shop_matches": shop,
            }
        )

    def _prompt(self, req: RecommendationMatchRequest, usable: Dict[str, float]) -> str:
        inventory_lines = "\n".join(
            f"- {slug}: {_material_name(slug, req.region)} (jumlah {qty:g})" for slug, qty in usable.items()
        )
        catalog_lines = "\n".join(
            f"- {slug}: {spec.local_name(req.region)}" for slug, spec in CANONICAL_MATERIALS.items()
            if slug not in HAZARDOUS_SLUGS
        )
        currency = "Rupiah (bilangan bulat)" if req.region == RegionCode.ID else "sen Ringgit (bilangan bulat, RM1 = 100)"
        return (
            "Kamu adalah guru sains yang merancang eksperimen STEM dari barang di sekitar siswa.\n"
            f"Negara: {'Indonesia' if req.region == RegionCode.ID else 'Malaysia'}. "
            f"Kurikulum: {req.curriculum_code.value}, tingkat {req.grade_level}. "
            f"Jenjang: {LEVEL_DESCRIPTIONS[req.age_adaptive_level]}. Peran pengguna: {req.user_role.value}.\n\n"
            f"Bahan yang DIMILIKI pengguna:\n{inventory_lines}\n\n"
            f"Katalog bahan umum (boleh dipakai sebagai bahan yang perlu dibeli):\n{catalog_lines}\n\n"
            "Usulkan 4 sampai 6 eksperimen yang aman, mendidik, dan sesuai jenjang. Aturan:\n"
            "1. Utamakan eksperimen yang memakai bahan yang dimiliki. Minimal 2 eksperimen harus bisa dibuat "
            "hanya dengan bahan yang dimiliki.\n"
            "2. Di 'materials', tulis SEMUA bahan yang dibutuhkan. Pakai slug persis dari daftar di atas; "
            "pakai 'other' hanya untuk benda umum yang tidak ada di daftar.\n"
            "3. Jika ada bahan yang tidak dimiliki tetapi bisa diganti bahan yang dimiliki, isi 'substitutes' "
            "dengan substitute_slug dari bahan yang DIMILIKI dan prinsip ilmiah yang sama.\n"
            f"4. Jika ada maksimal {MAX_LOCAL_SHOP_MISSING} bahan murah yang harus dibeli, isi 'shop_items' "
            f"dengan perkiraan harga dalam {currency} dan jenis toko lokal (warung, minimarket, toko bangunan, "
            "kedai runcit, MR.DIY, dsb).\n"
            "5. DILARANG memakai pemutih, pembersih lantai asam, amonia, api terbuka besar, listrik PLN/stopkontak, "
            "atau bahan kimia berbahaya. Tandai ADULT_SUPERVISION bila butuh gunting tajam, panas, atau tekanan.\n"
            "6. curriculum_badge menyebut kurikulum, jenjang/fase, dan topik yang relevan.\n"
            f"Tulis semua teks dalam {output_language(req.region)}."
        )

    def _to_card(
        self, idea: _ExperimentIdea, req: RecommendationMatchRequest, usable: Dict[str, float]
    ) -> Optional[ExperimentRecommendationCardDTO]:
        needed = [m for m in idea.materials if m.material_slug]
        if not needed or any(m.material_slug in HAZARDOUS_SLUGS for m in needed):
            return None
        if any(s.material_slug in HAZARDOUS_SLUGS for s in idea.shop_items):
            return None

        present = [m for m in needed if m.material_slug in usable and usable[m.material_slug] >= m.quantity]
        missing = [m for m in needed if m not in present]

        valid_subs = [s for s in idea.substitutes if s.substitute_slug in usable]
        covered = {s.missing_slug for s in valid_subs} | {s.missing_name.lower() for s in valid_subs}
        uncovered = [
            m for m in missing if m.material_slug not in covered and m.name.lower() not in covered
        ]

        if not missing:
            tier = MatchTierEnum.STRICT_100
        elif not uncovered:
            tier = MatchTierEnum.DIY_SUBSTITUTE
        elif len(uncovered) <= MAX_LOCAL_SHOP_MISSING and idea.shop_items:
            tier = MatchTierEnum.LOCAL_MICRO_SHOP
        else:
            return None

        currency = CurrencyCodeEnum.IDR if req.region == RegionCode.ID else CurrencyCodeEnum.MYR_SEN
        suffix = "terdekat" if req.region == RegionCode.ID else "berdekatan"
        shop_items = (
            [
                LocalSourcingItemDTO(
                    material_slug=s.material_slug,
                    name_local=s.name,
                    missing_quantity=s.quantity,
                    unit=s.unit,
                    currency=currency,
                    est_price_int=s.est_price_int,
                    display_price=_format_price(s.est_price_int, req.region),
                    recommended_stores=s.stores,
                    maps_search_url="https://www.google.com/maps/search/?api=1&query="
                    + quote_plus(f"{s.stores[0] if s.stores else 'toko'} {suffix}"),
                    marketplace_search_url=(
                        f"https://www.tokopedia.com/search?q={quote_plus(s.name)}"
                        if req.region == RegionCode.ID
                        else f"https://shopee.com.my/search?keyword={quote_plus(s.name)}"
                    ),
                )
                for s in idea.shop_items
            ]
            if tier == MatchTierEnum.LOCAL_MICRO_SHOP
            else []
        )
        substitutes = (
            [
                FunctionalMaterialSubstituteDTO(
                    missing_material_slug=s.missing_slug,
                    missing_name_local=s.missing_name,
                    substitute_material_slug=s.substitute_slug,
                    substitute_name_local=_material_name(s.substitute_slug, req.region),
                    shared_scientific_principle=s.shared_principle,
                    adaptation_steps=s.adaptation_steps,
                )
                for s in valid_subs
            ]
            if tier != MatchTierEnum.STRICT_100
            else []
        )

        slug = _slugify(idea.title)
        self._store.put(
            _ExperimentRecord(
                slug=slug,
                region=req.region,
                title=idea.title,
                summary=idea.summary,
                curriculum_badge=idea.curriculum_badge,
                safety=idea.safety,
                materials=[f"{m.quantity}x {m.name}" for m in needed],
            )
        )
        return ExperimentRecommendationCardDTO(
            experiment_slug=slug,
            title_local=idea.title,
            match_tier=tier,
            match_percentage=round(100 * len(present) / len(needed)),
            age_adaptive_level=req.age_adaptive_level,
            curriculum_badge=idea.curriculum_badge,
            safety_severity=idea.safety,
            functional_substitutes=substitutes,
            missing_local_shop_items=shop_items,
        )


# ============================================================================
# Agent #3: CurriculumScaffolderAgent
# ============================================================================


class _StepIdea(BaseModel):
    instruction: str
    needs_photo_check: bool
    photo_check_prompt: str = Field(description="Apa yang harus terlihat di foto jika langkah benar; kosong jika tidak perlu.")


class _QuestionIdea(BaseModel):
    prompt: str
    options: List[str] = Field(description="3 atau 4 pilihan jawaban.")
    correct_index: int = Field(ge=0)
    explanation: str


class _VariablesIdea(BaseModel):
    independent_variable: str
    dependent_variable: str
    control_variables: List[str]
    x_axis_label: str
    y_axis_label: str
    formulas_latex: List[str]
    expected_trend: Literal["LINEAR_PROPORTIONAL", "INVERSE", "EXPONENTIAL", "POLYNOMIAL"]


class _ModuleIdea(BaseModel):
    competency_code: str
    learning_objective: str
    science: str
    technology: str
    engineering: str
    mathematics: str
    safety_notes: List[str]
    steps: List[_StepIdea]
    variables: Optional[_VariablesIdea] = None
    questions: List[_QuestionIdea]


class GeminiCurriculumScaffolderAgent:
    agent_name = "CurriculumScaffolderAgent"

    def __init__(self, store: ExperimentSessionStore) -> None:
        self._store = store

    def scaffold_module(
        self, experiment_slug: str, req: ExperimentScaffoldRequest, safety_checks: List[SafetyAlertDTO]
    ) -> STEMExperimentModuleDTO:
        record = _require_record(self._store, experiment_slug)
        idea = generate_structured(self._prompt(record, req), _ModuleIdea, temperature=0.5)

        severity = (
            SafetySeverityEnum.ADULT_SUPERVISION if record.safety == "ADULT_SUPERVISION" else SafetySeverityEnum.SAFE
        )
        variables = None
        if idea.variables and _level_needs_variables(req.age_adaptive_level):
            v = idea.variables
            variables = ScientificVariablesAndGraphSchemaDTO(
                formulas_latex=v.formulas_latex,
                independent_variable=v.independent_variable,
                dependent_variable=v.dependent_variable,
                control_variables=v.control_variables,
                x_axis_label=v.x_axis_label,
                y_axis_label=v.y_axis_label,
                expected_trend=ExpectedGraphTrendEnum(v.expected_trend),
            )

        module = STEMExperimentModuleDTO(
            experiment_slug=experiment_slug,
            title_local=record.title,
            age_adaptive_level=req.age_adaptive_level,
            curriculum_alignment=CurriculumAlignmentDTO(
                curriculum_code=req.curriculum_code.value,
                grade_level=req.grade_level,
                competency_code=idea.competency_code,
                learning_objective=idea.learning_objective,
            ),
            stem_concepts=STEMConceptsBreakdownDTO(
                science=idea.science,
                technology=idea.technology,
                engineering=idea.engineering,
                mathematics=idea.mathematics,
            ),
            scientific_variables_and_graph=variables,
            safety_checks=list(safety_checks)
            + [
                SafetyAlertDTO(
                    rule_code=f"AI_SAFETY_NOTE_{i + 1}",
                    severity=severity,
                    involved_materials=[],
                    message_local=note,
                )
                for i, note in enumerate(idea.safety_notes)
            ],
            steps=[
                ExperimentStepDTO(
                    step_number=i + 1,
                    instruction=s.instruction,
                    requires_vision_verification=s.needs_photo_check and bool(s.photo_check_prompt.strip()),
                    vision_verification_prompt=s.photo_check_prompt if s.needs_photo_check else "",
                    default_ar_overlay=NO_OVERLAY,
                    checkable=True,
                )
                for i, s in enumerate(idea.steps)
            ],
            reflection_questions=[
                ReflectionQuestionDTO(
                    question_id=f"q{i + 1}",
                    prompt=q.prompt,
                    options=q.options,
                    correct_index=min(q.correct_index, max(0, len(q.options) - 1)),
                    explanation=q.explanation,
                )
                for i, q in enumerate(idea.questions)
                if q.options
            ],
        )
        self._store.set_module(experiment_slug, module)
        return module

    def _prompt(self, record: _ExperimentRecord, req: ExperimentScaffoldRequest) -> str:
        variables_rule = (
            "Isi 'variables' (variabel bebas, terikat, kontrol, label sumbu grafik, rumus LaTeX, tren) "
            "karena siswa akan mencatat data kuantitatif."
            if _level_needs_variables(req.age_adaptive_level)
            else "Biarkan 'variables' kosong (null)."
        )
        return (
            "Susun modul praktikum lengkap untuk eksperimen berikut.\n"
            f"Judul: {record.title}\nRingkasan: {record.summary}\nKurikulum: {record.curriculum_badge}\n"
            f"Bahan: {', '.join(record.materials)}\n"
            f"Kurikulum kode: {req.curriculum_code.value}, tingkat {req.grade_level}. "
            f"Jenjang: {LEVEL_DESCRIPTIONS[req.age_adaptive_level]}.\n\n"
            "Ketentuan:\n"
            "- competency_code: kode capaian/kompetensi yang wajar untuk kurikulum tersebut; jangan mengarang "
            "kode resmi yang tidak kamu yakini, tulis deskriptif bila ragu.\n"
            "- science/technology/engineering/mathematics: penjelasan konsep sesuai jenjang, 1-3 kalimat masing-masing.\n"
            "- steps: 4-8 langkah kerja yang konkret dan bisa diikuti. needs_photo_check=true hanya untuk langkah "
            "perakitan yang hasilnya terlihat di foto, dengan photo_check_prompt yang spesifik.\n"
            "- safety_notes: 1-4 peringatan keselamatan yang relevan.\n"
            f"- {variables_rule}\n"
            "- questions: 3 soal pilihan ganda refleksi konsep dengan penjelasan jawaban.\n"
            f"Tulis semua teks dalam {output_language(req.region)}."
        )


# ============================================================================
# Agent #5: StepVisionAndARAgent (photo check only; no fake AR anchoring)
# ============================================================================


class _StepVerdict(BaseModel):
    is_correct: bool
    confidence: float = Field(ge=0.0, le=1.0)
    feedback: str


class GeminiStepVisionAgent:
    agent_name = "StepVisionAndARAgent"

    def __init__(self, store: ExperimentSessionStore) -> None:
        self._store = store

    def verify_step_and_anchor_ar(
        self, experiment_slug: str, step_number: int, req: StepVisionVerifyRequest
    ) -> StepVisionVerifyResponse:
        record = _require_record(self._store, experiment_slug)
        if record.module is None:
            raise GeminiError("Modul eksperimen belum disusun. Buka tab Praktikum lagi.")
        step = next((s for s in record.module.steps if s.step_number == step_number), None)
        if step is None:
            raise GeminiError(f"Langkah {step_number} tidak ada di modul ini.")
        image = decode_image(req.image_base64, req.mime_type)
        if image is None:
            raise GeminiError("Foto tidak valid. Kirim foto JPEG, PNG, atau WebP.")

        prompt = (
            f"Eksperimen: {record.title}\nLangkah {step_number}: {step.instruction}\n"
            f"Kriteria benar: {step.vision_verification_prompt or step.instruction}\n\n"
            "Nilai apakah foto menunjukkan langkah ini sudah dikerjakan dengan benar. Jika foto buram, "
            "tidak relevan, atau bagian penting tidak terlihat, jawab is_correct=false dan jelaskan apa yang "
            "perlu difoto ulang. Beri umpan balik singkat (1-3 kalimat), ramah, dan spesifik "
            f"untuk jenjang {LEVEL_DESCRIPTIONS[req.age_adaptive_level]}. "
            f"Tulis dalam {output_language(req.region)}."
        )
        verdict = generate_structured(
            prompt, _StepVerdict, images=[image], temperature=0.1, model=settings.vision_model
        )
        return StepVisionVerifyResponse(
            step_number=step_number,
            is_verified_correct=verdict.is_correct,
            confidence=round(verdict.confidence, 2),
            feedback_message_local=verdict.feedback,
            can_proceed_to_next_step=verdict.is_correct,
            ar_overlay_simulation=step.default_ar_overlay,
        )


# ============================================================================
# Agent #6: LabReportSynthesizerAgent
# ============================================================================


class _ReportIdea(BaseModel):
    objective: str
    theoretical_summary: str
    variables_summary: str
    result_analysis_discussion: str
    conclusion: str


class GeminiLabReportAgent:
    agent_name = "LabReportSynthesizerAgent"

    def __init__(self, store: ExperimentSessionStore) -> None:
        self._store = store

    def synthesize_lab_report(
        self, experiment_slug: str, req: LabReportGenerateRequest
    ) -> LabReportGenerateResponse:
        record = _require_record(self._store, experiment_slug)
        module = record.module
        steps = [s.instruction for s in module.steps] if module else []
        rows = "\n".join(
            f"- Percobaan {r.trial_number}: x={r.x_value:g}, y={r.y_value:g}, catatan: {r.notes or '-'}"
            for r in req.observation_data_rows
        ) or "(tidak ada data pengamatan yang dicatat)"
        answers = "\n".join(f"- {a}" for a in req.reflection_answers) or "(tidak ada jawaban refleksi)"
        variables = (
            f"Variabel bebas: {module.scientific_variables_and_graph.independent_variable}; "
            f"terikat: {module.scientific_variables_and_graph.dependent_variable}; "
            f"kontrol: {', '.join(module.scientific_variables_and_graph.control_variables)}"
            if module and module.scientific_variables_and_graph
            else "(tidak ditentukan)"
        )
        image = decode_image(req.result_photo_base64, "image/jpeg")
        prompt = (
            "Susun bagian isi laporan praktikum siswa berdasarkan data berikut. Jangan mengarang data, "
            "angka, atau hasil yang tidak ada. Jika data pengamatan kosong atau tidak cukup, katakan terus "
            "terang di pembahasan dan kesimpulan.\n\n"
            f"Judul: {record.title}\nRingkasan: {record.summary}\n"
            f"Tujuan pembelajaran: {module.curriculum_alignment.learning_objective if module else '-'}\n"
            f"Konsep sains: {module.stem_concepts.science if module else '-'}\n{variables}\n"
            f"Langkah kerja:\n" + "\n".join(f"{i + 1}. {s}" for i, s in enumerate(steps)) + "\n\n"
            f"Data pengamatan:\n{rows}\n\nJawaban refleksi siswa:\n{answers}\n\n"
            + ("Foto hasil praktikum terlampir; gunakan sebagai bukti bila relevan.\n" if image else "")
            + f"Jenjang: {LEVEL_DESCRIPTIONS[req.age_adaptive_level]}. "
            f"Tulis dalam {output_language(req.region)} dengan gaya laporan praktikum sekolah/kampus. "
            "Pembahasan 1-3 paragraf; kesimpulan menjawab tujuan."
        )
        idea = generate_structured(prompt, _ReportIdea, images=[image] if image else None, temperature=0.3)
        return LabReportGenerateResponse(
            title_local=record.title,
            objective_local=idea.objective,
            theoretical_summary=idea.theoretical_summary,
            variables_summary=idea.variables_summary or None,
            materials_used_list=record.materials,
            procedure_summary=steps,
            result_analysis_discussion=idea.result_analysis_discussion,
            conclusion_local=idea.conclusion,
        )
