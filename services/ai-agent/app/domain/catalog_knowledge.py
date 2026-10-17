"""
Layer 1 (Domain Knowledge Base):
Canonical Materials (ID & MY), Functional Physics/Chemistry Substitutes,
Active Co-Location Hazard Rules, and 4-Level Age-Adaptive STEM Experiment Blueprints.
Synchronized 1:1 with `services/core-api/migrations/003_seed_id_my_catalog_substitutes_and_experiments.sql`.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional
from urllib.parse import quote_plus

from app.domain.models import (
    ARAnimationStyleEnum,
    AROverlaySimulationDTO,
    AROverlayTypeEnum,
    ARVectorPathDTO,
    AgeAdaptiveLevelEnum,
    CurrencyCodeEnum,
    ExpectedGraphTrendEnum,
    MaterialCategoryEnum,
    RegionCode,
    SafetySeverityEnum,
    ScientificVariablesAndGraphSchemaDTO,
    STEMConceptsBreakdownDTO,
)


@dataclass(frozen=True)
class CanonicalMaterialSpec:
    slug: str
    category: MaterialCategoryEnum
    name_id: str
    name_my: str
    default_unit: str
    est_price_idr: int
    est_price_myr_sen: int
    store_types_id: List[str]
    store_types_my: List[str]
    functional_tags: List[str] = field(default_factory=list)

    def local_name(self, region: RegionCode) -> str:
        return self.name_id if region == RegionCode.ID else self.name_my

    def store_types(self, region: RegionCode) -> List[str]:
        return self.store_types_id if region == RegionCode.ID else self.store_types_my

    def currency(self, region: RegionCode) -> CurrencyCodeEnum:
        return CurrencyCodeEnum.IDR if region == RegionCode.ID else CurrencyCodeEnum.MYR_SEN

    def price_int(self, region: RegionCode) -> int:
        return int(self.est_price_idr) if region == RegionCode.ID else int(self.est_price_myr_sen)

    def display_price(self, region: RegionCode, quantity: float = 1.0) -> str:
        qty_int = max(1, int(round(quantity)))
        if region == RegionCode.ID:
            total_idr = int(self.est_price_idr) * qty_int
            formatted = f"{total_idr:,}".replace(",", ".")
            return f"Rp {formatted}"
        total_sen = int(self.est_price_myr_sen) * qty_int
        ringgit = total_sen // 100
        sen = total_sen % 100
        return f"RM {ringgit}.{sen:02d}"

    def maps_url(self, region: RegionCode) -> str:
        stores = self.store_types(region)
        primary_store = stores[0] if stores else ("Warung" if region == RegionCode.ID else "Kedai Runcit")
        suffix = "terdekat" if region == RegionCode.ID else "berdekatan"
        q = quote_plus(f"{primary_store} {suffix}")
        return f"https://www.google.com/maps/search/?api=1&query={q}"

    def marketplace_url(self, region: RegionCode) -> str:
        q = quote_plus(self.local_name(region).split("(")[0].strip())
        if region == RegionCode.ID:
            return f"https://www.tokopedia.com/search?q={q}"
        return f"https://shopee.com.my/search?keyword={q}"


@dataclass(frozen=True)
class FunctionalSubstituteSpec:
    missing_material_slug: str
    substitute_material_slug: str
    shared_principle_id: str
    shared_principle_my: str
    adaptation_steps_id: List[str]
    adaptation_steps_my: List[str]


@dataclass(frozen=True)
class SafetyHazardRuleSpec:
    rule_code: str
    material_slug_a: str
    material_slug_b: str
    severity: SafetySeverityEnum
    warning_id: str
    warning_my: str


CANONICAL_MATERIALS: Dict[str, CanonicalMaterialSpec] = {
    "battery_aa_1_5v": CanonicalMaterialSpec(
        slug="battery_aa_1_5v",
        category=MaterialCategoryEnum.ELECTRONICS,
        name_id="Baterai AA 1.5V",
        name_my="Bateri AA 1.5V",
        default_unit="pcs",
        est_price_idr=3500,
        est_price_myr_sen=220,
        store_types_id=["Warung Kelontong", "Indomaret/Alfamart", "Toko Listrik"],
        store_types_my=["Kedai Runcit", "99 Speedmart", "MR.DIY"],
        functional_tags=["DC_VOLTAGE_SOURCE"],
    ),
    "copper_wire_jumper": CanonicalMaterialSpec(
        slug="copper_wire_jumper",
        category=MaterialCategoryEnum.ELECTRONICS,
        name_id="Kabel Tembaga / Jumper",
        name_my="Wayar Tembaga / Pelompat",
        default_unit="pcs",
        est_price_idr=2000,
        est_price_myr_sen=150,
        store_types_id=["Toko Listrik", "Toko Bangunan"],
        store_types_my=["MR.DIY", "Kedai Elektronik"],
        functional_tags=["ELECTRICAL_CONDUCTOR"],
    ),
    "aluminum_foil_strip": CanonicalMaterialSpec(
        slug="aluminum_foil_strip",
        category=MaterialCategoryEnum.HOUSEHOLD_TOOL,
        name_id="Strip Aluminium Foil Dapur",
        name_my="Jalur Kerajang Aluminium Dapur",
        default_unit="pcs",
        est_price_idr=1500,
        est_price_myr_sen=100,
        store_types_id=["Warung Kelontong", "Indomaret/Alfamart"],
        store_types_my=["Kedai Runcit", "99 Speedmart", "Eco-Shop"],
        functional_tags=["ELECTRICAL_CONDUCTOR", "HEAT_REFLECTOR"],
    ),
    "aluminum_can_recycled": CanonicalMaterialSpec(
        slug="aluminum_can_recycled",
        category=MaterialCategoryEnum.RECYCLED,
        name_id="Kaleng Minuman Aluminium Bekas (Amplas)",
        name_my="Tin Minuman Aluminium Terpakai",
        default_unit="pcs",
        est_price_idr=0,
        est_price_myr_sen=0,
        store_types_id=["Barang Bekas Rumah"],
        store_types_my=["Barangan Kitar Semula Rumah"],
        functional_tags=["ELECTRICAL_CONDUCTOR", "THERMAL_VESSEL"],
    ),
    "led_diode_5mm": CanonicalMaterialSpec(
        slug="led_diode_5mm",
        category=MaterialCategoryEnum.ELECTRONICS,
        name_id="Lampu LED Kecil 5mm",
        name_my="Lampu LED Kecil 5mm",
        default_unit="pcs",
        est_price_idr=1000,
        est_price_myr_sen=80,
        store_types_id=["Toko Listrik", "Tokopedia/Shopee"],
        store_types_my=["MR.DIY", "Kedai Elektronik", "Shopee MY"],
        functional_tags=["LIGHT_INDICATOR_LOAD"],
    ),
    "pvc_pipe_half_inch": CanonicalMaterialSpec(
        slug="pvc_pipe_half_inch",
        category=MaterialCategoryEnum.HOUSEHOLD_TOOL,
        name_id="Pipa PVC 1/2 Inci (30 cm)",
        name_my="Paip PVC 1/2 Inci (30 cm)",
        default_unit="pcs",
        est_price_idr=5000,
        est_price_myr_sen=300,
        store_types_id=["Toko Bangunan", "Mitra10"],
        store_types_my=["MR.DIY", "Kedai Perkakas Hardware"],
        functional_tags=["FLUID_AIR_CONDUIT"],
    ),
    "thick_plastic_straw": CanonicalMaterialSpec(
        slug="thick_plastic_straw",
        category=MaterialCategoryEnum.RECYCLED,
        name_id="Sedotan Plastik Tebal (Boba)",
        name_my="Straw Plastik Tebal",
        default_unit="pcs",
        est_price_idr=500,
        est_price_myr_sen=30,
        store_types_id=["Warung Kelontong", "Barang Bekas Rumah"],
        store_types_my=["Kedai Runcit", "Eco-Shop"],
        functional_tags=["FLUID_AIR_CONDUIT"],
    ),
    "cardboard_roll_core": CanonicalMaterialSpec(
        slug="cardboard_roll_core",
        category=MaterialCategoryEnum.RECYCLED,
        name_id="Gulungan Karton Bekas Tisu",
        name_my="Gulungan Kadbod Tisu Terpakai",
        default_unit="pcs",
        est_price_idr=0,
        est_price_myr_sen=0,
        store_types_id=["Barang Bekas Rumah"],
        store_types_my=["Barangan Kitar Semula Rumah"],
        functional_tags=["FLUID_AIR_CONDUIT"],
    ),
    "plastic_bottle_pet_600ml": CanonicalMaterialSpec(
        slug="plastic_bottle_pet_600ml",
        category=MaterialCategoryEnum.RECYCLED,
        name_id="Botol Plastik Air Mineral 600ml Bekas",
        name_my="Botol Plastik Air Mineral 600ml Terpakai",
        default_unit="pcs",
        est_price_idr=0,
        est_price_myr_sen=0,
        store_types_id=["Barang Bekas Rumah", "Warung Kelontong"],
        store_types_my=["Barangan Kitar Semula Rumah", "Kedai Runcit"],
        functional_tags=["PRESSURE_VESSEL", "GRADUATED_CONTAINER"],
    ),
    "balloon_latex": CanonicalMaterialSpec(
        slug="balloon_latex",
        category=MaterialCategoryEnum.HOUSEHOLD_TOOL,
        name_id="Balon Karet",
        name_my="Belon Getah",
        default_unit="pcs",
        est_price_idr=1500,
        est_price_myr_sen=100,
        store_types_id=["Warung Kelontong", "Toko Alat Tulis", "Indomaret/Alfamart"],
        store_types_my=["Kedai Runcit", "Eco-Shop", "MR.DIY"],
        functional_tags=["ELASTIC_MEMBRANE", "GAS_COLLECTOR"],
    ),
    "vinegar_kitchen": CanonicalMaterialSpec(
        slug="vinegar_kitchen",
        category=MaterialCategoryEnum.KITCHEN_CHEMICAL,
        name_id="Cuka Dapur (Asam Asetat CH3COOH 5%)",
        name_my="Cuka Makan (Asid Asetik CH3COOH 5%)",
        default_unit="bottle",
        est_price_idr=4000,
        est_price_myr_sen=250,
        store_types_id=["Warung Kelontong", "Indomaret/Alfamart", "Pasar"],
        store_types_my=["Kedai Runcit", "99 Speedmart", "Pasar Raya"],
        functional_tags=["WEAK_ACID_REAGENT"],
    ),
    "sodium_bicarbonate": CanonicalMaterialSpec(
        slug="sodium_bicarbonate",
        category=MaterialCategoryEnum.KITCHEN_CHEMICAL,
        name_id="Soda Kue (Natrium Bikarbonat NaHCO3)",
        name_my="Serbuk Penaik (Natrium Bikarbonat NaHCO3)",
        default_unit="pack",
        est_price_idr=5000,
        est_price_myr_sen=280,
        store_types_id=["Warung Kelontong", "Toko Bahan Kue", "Indomaret/Alfamart"],
        store_types_my=["Kedai Runcit", "99 Speedmart", "Kedai Bakeri"],
        functional_tags=["CARBONATE_BASE_REAGENT"],
    ),
    "sodium_hypochlorite": CanonicalMaterialSpec(
        slug="sodium_hypochlorite",
        category=MaterialCategoryEnum.KITCHEN_CHEMICAL,
        name_id="Pemutih Pakaian (Natrium Hipoklorit NaOCl)",
        name_my="Peluntur Pakaian (Natrium Hipoklorit NaOCl)",
        default_unit="bottle",
        est_price_idr=6000,
        est_price_myr_sen=350,
        store_types_id=["Warung Kelontong", "Indomaret/Alfamart"],
        store_types_my=["Kedai Runcit", "99 Speedmart"],
        functional_tags=["STRONG_OXIDIZER_BLEACH"],
    ),
    "floor_cleaner_acidic": CanonicalMaterialSpec(
        slug="floor_cleaner_acidic",
        category=MaterialCategoryEnum.KITCHEN_CHEMICAL,
        name_id="Pembersih Lantai/Porselen Asam Kuat (HCl)",
        name_my="Pencuci Lantai/Tandas Berasid (HCl)",
        default_unit="bottle",
        est_price_idr=12000,
        est_price_myr_sen=650,
        store_types_id=["Indomaret/Alfamart", "Supermarket"],
        store_types_my=["99 Speedmart", "MR.DIY"],
        functional_tags=["STRONG_ACID_CLEANER"],
    ),
    "ammonia_cleaner": CanonicalMaterialSpec(
        slug="ammonia_cleaner",
        category=MaterialCategoryEnum.KITCHEN_CHEMICAL,
        name_id="Pembersih Kaca Amonia (NH3)",
        name_my="Pencuci Cermin Amonia (NH3)",
        default_unit="bottle",
        est_price_idr=10000,
        est_price_myr_sen=550,
        store_types_id=["Supermarket", "Toko Bangunan"],
        store_types_my=["99 Speedmart", "MR.DIY"],
        functional_tags=["AMMONIA_BASE_CLEANER"],
    ),
}


FUNCTIONAL_SUBSTITUTE_RULES: List[FunctionalSubstituteSpec] = [
    FunctionalSubstituteSpec(
        missing_material_slug="pvc_pipe_half_inch",
        substitute_material_slug="thick_plastic_straw",
        shared_principle_id="Prinsip Konduksi Aliran Udara & Tekanan Fluida Silindris (Hukum Bernoulli & Kontinuitas A1*v1 = A2*v2)",
        shared_principle_my="Prinsip Konduksi Aliran Udara & Tekanan Bendalir Silinder (Hukum Bernoulli & Keselanjaran A1*v1 = A2*v2)",
        adaptation_steps_id=[
            "Gabungkan 2 sedotan plastik tebal sejajar atau rekatkan ujungnya dengan selotip agar kedap udara.",
            "Pastikan ujung sedotan yang masuk ke mulut botol dilapisi plastisin/selotip agar tidak ada kebocoran tekanan.",
        ],
        adaptation_steps_my=[
            "Gabungkan 2 straw plastik tebal atau lekatkan hujungnya dengan pita pelekat supaya kedap udara.",
            "Pastikan sambungan straw pada mulut botol ditutup rapat supaya tiada kebocoran tekanan.",
        ],
    ),
    FunctionalSubstituteSpec(
        missing_material_slug="pvc_pipe_half_inch",
        substitute_material_slug="cardboard_roll_core",
        shared_principle_id="Prinsip Tabung Pengarah Aliran Udara & Peluncur Aerodinamis Silindris",
        shared_principle_my="Prinsip Tiub Pengarah Aliran Udara & Pelancar Aerodinamik Silinder",
        adaptation_steps_id=[
            "Lapisi bagian dalam dan luar gulungan karton bekas tisu menggunakan selotip bening agar tahan lembap dan kaku.",
            "Pasangkan secara presisi sebagai selongsong pengarah tekanan udara pengganti pipa PVC.",
        ],
        adaptation_steps_my=[
            "Balut bahagian luar gulungan kadbod tisu dengan pita pelekat lutsinar supaya kalis lembap dan kukuh.",
            "Pasangkan sebagai tiub pengarah tekanan udara menggantikan paip PVC.",
        ],
    ),
    FunctionalSubstituteSpec(
        missing_material_slug="copper_wire_jumper",
        substitute_material_slug="aluminum_foil_strip",
        shared_principle_id="Prinsip Konduktivitas Elektron Logam (Ikatan Logam & Elektron Bebas pada Aluminium)",
        shared_principle_my="Prinsip Kekonduksian Elektron Logam (Ikatan Logam & Elektron Bebas pada Aluminium)",
        adaptation_steps_id=[
            "Gunting lembaran aluminium foil dapur dengan ukuran lebar 2 cm dan panjang 20 cm.",
            "Lipat memanjang 4 kali hingga membentuk pita konduktor padat pengganti kabel tembaga.",
        ],
        adaptation_steps_my=[
            "Gunting kerajang aluminium dapur dengan lebar 2 cm dan panjang 20 cm.",
            "Lipat memanjang 4 kali sehingga membentuk jalur konduktor padat menggantikan wayar tembaga.",
        ],
    ),
]

FUNCTIONAL_SUBSTITUTES: Dict[Tuple[str, str], FunctionalSubstituteSpec] = {
    (r.missing_material_slug, r.substitute_material_slug): r for r in FUNCTIONAL_SUBSTITUTE_RULES
}


FUNCTIONAL_SUBSTITUTES: Dict[tuple[str, str], FunctionalSubstituteSpec] = {
    (r.missing_material_slug, r.substitute_material_slug): r
    for r in FUNCTIONAL_SUBSTITUTE_RULES
}


class _HazardRulesRegistry(dict):
    """Supports both `for rule in SAFETY_HAZARD_RULES:` and `for rule in SAFETY_HAZARD_RULES.values():`."""

    def __iter__(self):  # type: ignore[override]
        return iter(self.values())


SAFETY_HAZARD_RULES = _HazardRulesRegistry(
    {
        "HAZ_CO_LOCATED_BLEACH_AND_ACID_CLEANER": SafetyHazardRuleSpec(
            rule_code="HAZ_CO_LOCATED_BLEACH_AND_ACID_CLEANER",
            material_slug_a="sodium_hypochlorite",
            material_slug_b="floor_cleaner_acidic",
            severity=SafetySeverityEnum.CRITICAL_CO_LOCATION_WARNING,
            warning_id=(
                "PERINGATAN MERAH AKTIF: Terdeteksi Pemutih Pakaian (NaOCl) dan Pembersih Lantai Asam (HCl) "
                "berada di meja yang sama! Segera pisahkan salah satu bahan dari area kerja sebelum memulai eksperimen. "
                "Pencampuran keduanya menghasilkan Gas Klorin (Cl2) mematikan!"
            ),
            warning_my=(
                "AMARAN MERAH AKTIF: Dikesan Peluntur Pakaian (NaOCl) dan Pencuci Lantai Berasid (HCl) "
                "berada di kawasan meja yang sama! Sila asingkan segera sebelum memulakan eksperimen. "
                "Campuran kedua-duanya menghasilkan Gas Klorin (Cl2) beracun!"
            ),
        ),
        "HAZ_NAOCL_VINEGAR_CHLORINE_GAS": SafetyHazardRuleSpec(
            rule_code="HAZ_NAOCL_VINEGAR_CHLORINE_GAS",
            material_slug_a="sodium_hypochlorite",
            material_slug_b="vinegar_kitchen",
            severity=SafetySeverityEnum.CRITICAL_HAZARD_BLOCKED,
            warning_id=(
                "BAHAYA KRITIS DIBLOKIR: Dilarang keras mencampur Pemutih Pakaian (NaOCl) dengan Cuka Dapur "
                "(Asam Asetat) karena melepaskan uap gas klorin beracun yang merusak saluran pernapasan!"
            ),
            warning_my=(
                "BAHAYA KRITIKAL DISEKAT: Dilarang sama sekali mencampurkan Peluntur Pakaian (NaOCl) dengan "
                "Cuka Makan (Asid Asetik) kerana membebaskan gas klorin beracun!"
            ),
        ),
        "HAZ_NAOCL_AMMONIA_CHLORAMINE": SafetyHazardRuleSpec(
            rule_code="HAZ_NAOCL_AMMONIA_CHLORAMINE",
            material_slug_a="sodium_hypochlorite",
            material_slug_b="ammonia_cleaner",
            severity=SafetySeverityEnum.CRITICAL_HAZARD_BLOCKED,
            warning_id=(
                "BAHAYA KRITIS DIBLOKIR: Dilarang mencampur Pemutih Pakaian (NaOCl) dengan Pembersih Kaca Amonia (NH3) "
                "karena menghasilkan gas Kloramin beracun!"
            ),
            warning_my=(
                "BAHAYA KRITIKAL DISEKAT: Dilarang mencampurkan Peluntur Pakaian (NaOCl) dengan Pencuci Amonia (NH3) "
                "kerana menghasilkan gas Kloramin beracun!"
            ),
        ),
    }
)


@dataclass(frozen=True)
class ExperimentMaterialReq:
    material_slug: str
    min_quantity: float
    unit: str


@dataclass(frozen=True)
class ExperimentBlueprintSpec:
    slug: str
    title_id: str
    title_my: str
    safety_severity: str  # "SAFE" or "ADULT_SUPERVISION"
    required_materials: List[ExperimentMaterialReq]
    curriculum_badges_id: Dict[AgeAdaptiveLevelEnum, str]
    curriculum_badges_my: Dict[AgeAdaptiveLevelEnum, str]
    competency_codes_id: Dict[AgeAdaptiveLevelEnum, str]
    competency_codes_my: Dict[AgeAdaptiveLevelEnum, str]
    learning_objectives_id: Dict[AgeAdaptiveLevelEnum, str]
    learning_objectives_my: Dict[AgeAdaptiveLevelEnum, str]
    stem_concepts_id: Dict[AgeAdaptiveLevelEnum, STEMConceptsBreakdownDTO]
    stem_concepts_my: Dict[AgeAdaptiveLevelEnum, STEMConceptsBreakdownDTO]
    variables_and_graph_id: Dict[AgeAdaptiveLevelEnum, Optional[ScientificVariablesAndGraphSchemaDTO]]
    variables_and_graph_my: Dict[AgeAdaptiveLevelEnum, Optional[ScientificVariablesAndGraphSchemaDTO]]
    steps_id: List[Dict[str, object]]
    steps_my: List[Dict[str, object]]
    reflection_questions_id: List[Dict[str, object]]
    reflection_questions_my: List[Dict[str, object]]

    def curriculum_badge(self, level: AgeAdaptiveLevelEnum, region: RegionCode) -> str:
        badges = self.curriculum_badges_id if region == RegionCode.ID else self.curriculum_badges_my
        return badges.get(level) or badges.get(AgeAdaptiveLevelEnum.SMA_UPPER_SEC, "")

    def variables_and_graph(
        self, level: AgeAdaptiveLevelEnum, region: RegionCode
    ) -> Optional[ScientificVariablesAndGraphSchemaDTO]:
        vg = self.variables_and_graph_id if region == RegionCode.ID else self.variables_and_graph_my
        return vg.get(level)


EXPERIMENT_BLUEPRINTS: Dict[str, ExperimentBlueprintSpec] = {
    "rangkaian-listrik-baterai-kaleng-ar": ExperimentBlueprintSpec(
        slug="rangkaian-listrik-baterai-kaleng-ar",
        title_id="Rangkaian Listrik Sederhana & Simulasi AR Arus Elektron",
        title_my="Litar Elektrik Mudah & Simulasi AR Aliran Elektron",
        safety_severity="SAFE",
        required_materials=[
            ExperimentMaterialReq("battery_aa_1_5v", 2, "pcs"),
            ExperimentMaterialReq("copper_wire_jumper", 2, "pcs"),
            ExperimentMaterialReq("aluminum_can_recycled", 1, "pcs"),
            ExperimentMaterialReq("led_diode_5mm", 1, "pcs"),
        ],
        curriculum_badges_id={
            AgeAdaptiveLevelEnum.SD_ELEMENTARY: "Kurikulum Merdeka SD Fase C: Energi Listrik & Rangkaian Menyala",
            AgeAdaptiveLevelEnum.SMP_LOWER_SEC: "Kurikulum Merdeka SMP Fase D: Arus Listrik Searah (DC) & Konduktor",
            AgeAdaptiveLevelEnum.SMA_UPPER_SEC: "Kurikulum Merdeka SMA Fase E/F: Hukum Ohm, Hambatan & Rangkaian Listrik DC",
            AgeAdaptiveLevelEnum.HIGHER_ED_UNI: "DIKTI Fisika Dasar II: Kerapatan Arus, Konduktivitas Logam & Hukum Kirchoff",
        },
        curriculum_badges_my={
            AgeAdaptiveLevelEnum.SD_ELEMENTARY: "KSSR Sains Tahun 5: Litar Elektrik Lengkap & Konduktor",
            AgeAdaptiveLevelEnum.SMP_LOWER_SEC: "KSSM Sains Tingkatan 2: Keelektrikan & Hukum Ohm Asas",
            AgeAdaptiveLevelEnum.SMA_UPPER_SEC: "KSSM Fizik Tingkatan 5: Daya Gerak Elektrik (d.g.e.) & Rintangan Dalam",
            AgeAdaptiveLevelEnum.HIGHER_ED_UNI: "Matrikulasi / Universiti Fizik: Ketumpatan Arus, Kekonduksian & Analisis Litar",
        },
        competency_codes_id={
            AgeAdaptiveLevelEnum.SD_ELEMENTARY: "KM-IPAS-SD-C-4.1",
            AgeAdaptiveLevelEnum.SMP_LOWER_SEC: "KM-IPA-SMP-D-9.2",
            AgeAdaptiveLevelEnum.SMA_UPPER_SEC: "KM-FIS-SMA-E-10.3",
            AgeAdaptiveLevelEnum.HIGHER_ED_UNI: "DIKTI-FIS-102-EL",
        },
        competency_codes_my={
            AgeAdaptiveLevelEnum.SD_ELEMENTARY: "KSSR-SN-T5-5.2",
            AgeAdaptiveLevelEnum.SMP_LOWER_SEC: "KSSM-SN-T2-7.1",
            AgeAdaptiveLevelEnum.SMA_UPPER_SEC: "KSSM-FIZ-T5-3.2",
            AgeAdaptiveLevelEnum.HIGHER_ED_UNI: "UNI-PHYS-201-EM",
        },
        learning_objectives_id={
            AgeAdaptiveLevelEnum.SD_ELEMENTARY: "Menyalakan lampu LED menggunakan baterai dan kaleng minuman bekas serta melihat animasi jalannya listrik.",
            AgeAdaptiveLevelEnum.SMP_LOWER_SEC: "Membedakan sifat konduktor aluminium teramplas vs isolator lapisan cat serta memahami arah aliran elektron.",
            AgeAdaptiveLevelEnum.SMA_UPPER_SEC: "Menganalisis hubungan linier antara Tegangan (V), Kuat Arus (I), dan Hambatan (R) berdasarkan Hukum Ohm serta memetakan grafik I-V.",
            AgeAdaptiveLevelEnum.HIGHER_ED_UNI: "Menentukan konduktivitas listrik logam daur ulang, menghitung hambatan dalam baterai, serta mengevaluasi regresi linier kurva karakteristik beban LED.",
        },
        learning_objectives_my={
            AgeAdaptiveLevelEnum.SD_ELEMENTARY: "Menyalakan mentol LED menggunakan bateri dan tin minuman terpakai serta memerhati animasi aliran elektrik.",
            AgeAdaptiveLevelEnum.SMP_LOWER_SEC: "Membezakan sifat konduktor aluminium berbanding penebat cat serta memahami arah aliran elektron.",
            AgeAdaptiveLevelEnum.SMA_UPPER_SEC: "Menganalisis hubungan linear antara Voltan (V), Arus (I), dan Rintangan (R) mengikut Hukum Ohm serta memplot graf I-V.",
            AgeAdaptiveLevelEnum.HIGHER_ED_UNI: "Menentukan kekonduksian elektrik logam kitar semula, mengira rintangan dalam bateri, dan menilai regresi linear lengkung I-V.",
        },
        stem_concepts_id={
            AgeAdaptiveLevelEnum.SD_ELEMENTARY: STEMConceptsBreakdownDTO(
                science="Listrik mengalir seperti air di dalam pipa tertutup! Kaleng aluminium yang diamplas mengizinkan elektron lewat sehingga lampu LED menyala terang.",
                technology="Lampu LED mengubah energi listrik dari baterai menjadi cahaya hemat energi.",
                engineering="Merakit sakelar sentuh sederhana dari kaleng bekas dan kabel/aluminium foil.",
                mathematics="Menghitung jumlah baterai (1 baterai = 1,5 Volt; 2 baterai = 3,0 Volt).",
            ),
            AgeAdaptiveLevelEnum.SMP_LOWER_SEC: STEMConceptsBreakdownDTO(
                science="Elektron bermuatan negatif mengalir dari kutub negatif (-) ke kutub positif (+), sedangkan arah arus konvensional didefinisikan dari (+) ke (-).",
                technology="Dioda pemancar cahaya (LED) hanya menyala jika dipasang dengan polaritas maju (anoda ke positif, katoda ke negatif).",
                engineering="Mengupas lapisan oksida/epoksi pada permukaan kaleng aluminium agar menjadi konduktor kontak yang baik.",
                mathematics="Perbandingan tegangan seri: V_total = V1 + V2 = 1,5V + 1,5V = 3,0V.",
            ),
            AgeAdaptiveLevelEnum.SMA_UPPER_SEC: STEMConceptsBreakdownDTO(
                science="Hukum Ohm menyatakan kuat arus listrik (I) berbanding lurus dengan beda potensial (V) dan berbanding terbalik dengan hambatan total (R): I = V / R.",
                technology="Penggunaan semikonduktor p-n junction pada LED dengan tegangan ambang (forward voltage) sekitar 1,8V - 2,2V.",
                engineering="Optimasi kontak konduktor logam daur ulang untuk meminimalkan resistansi kontak pada rangkaian DC.",
                mathematics="Persamaan Hukum Ohm I = V/R dan daya disipasi P = V * I dalam satuan miliwatt (mW).",
            ),
            AgeAdaptiveLevelEnum.HIGHER_ED_UNI: STEMConceptsBreakdownDTO(
                science="Konduktivitas mikroskopis logam memenuhi hukum J = sigma * E, sedangkan karakteristik dioda memenuhi persamaan Shockley I = I_s * (exp(qV / nKT) - 1).",
                technology="Instrumentasi rangkaian DC dan karakterisasi hambatan kontak permukaan logam teroksidasi vs teramplas.",
                engineering="Rekayasa material daur ulang sebagai komponen sakelar dan konduktor darurat pada laboratorium berbiaya rendah.",
                mathematics="Regresi linier kuadrat terkecil (Least Squares) untuk menentukan resistansi efektif R_eff dan analisis ketidakpastian pengukuran (Error Propagation).",
            ),
        },
        stem_concepts_my={
            AgeAdaptiveLevelEnum.SD_ELEMENTARY: STEMConceptsBreakdownDTO(
                science="Elektrik mengalir dalam laluan tertutup! Tin aluminium yang digosok kertas pasir membenarkan arus mengalir supaya LED menyala.",
                technology="Mentol LED menukarkan tenaga elektrik bateri kepada cahaya.",
                engineering="Membina suis sentuh mudah daripada tin minuman terpakai.",
                mathematics="Mengira jumlah voltan bateri (1 bateri = 1.5V, 2 bateri = 3.0V).",
            ),
            AgeAdaptiveLevelEnum.SMP_LOWER_SEC: STEMConceptsBreakdownDTO(
                science="Elektron bergerak dari terminal negatif (-) ke positif (+), manakala arus konvensional mengalir dari (+) ke (-).",
                technology="Diod Pemancar Cahaya (LED) memerlukan pemasangan kutub anoda (+) dan katoda (-) yang betul.",
                engineering="Menanggalkan lapisan cat penebat pada tin aluminium untuk membentuk sambungan konduktor.",
                mathematics="Voltan bersiri: V_jumlah = V1 + V2 = 1.5V + 1.5V = 3.0V.",
            ),
            AgeAdaptiveLevelEnum.SMA_UPPER_SEC: STEMConceptsBreakdownDTO(
                science="Hukum Ohm menyatakan arus (I) berkadar terus dengan beza keupayaan (V) dan berkadar songsang dengan rintangan (R): I = V / R.",
                technology="Simpang semikonduktor p-n dalam LED dengan voltan pincang depan sekitar 2.0V.",
                engineering="Mengurangkan rintangan sentuhan pada permukaan konduktor kitar semula.",
                mathematics="Persamaan I = V/R dan kuasa elektrik P = V * I.",
            ),
            AgeAdaptiveLevelEnum.HIGHER_ED_UNI: STEMConceptsBreakdownDTO(
                science="Ketumpatan arus mikroskopik J = sigma * E dan persamaan diod Shockley I = I_s * (exp(qV / nKT) - 1).",
                technology="Pencirian rintangan dalam sel kering dan rintangan sentuhan logam aluminium.",
                engineering="Reka bentuk litar ujian kos rendah dengan bahan kitar semula.",
                mathematics="Analisis regresi linear lengkung I-V dan pengiraan ralat piawai (Standard Error).",
            ),
        },
        variables_and_graph_id={
            AgeAdaptiveLevelEnum.SD_ELEMENTARY: None,
            AgeAdaptiveLevelEnum.SMP_LOWER_SEC: None,
            AgeAdaptiveLevelEnum.SMA_UPPER_SEC: ScientificVariablesAndGraphSchemaDTO(
                formulas_latex=[
                    r"I = \frac{V}{R}",
                    r"V_{\text{total}} = \sum_{i=1}^{n} V_i",
                    r"P = V \cdot I = I^2 \cdot R",
                ],
                independent_variable="Tegangan Sumber Baterai Seri V (Volt)",
                dependent_variable="Kuat Arus Listrik I (mA) / Intensitas Nyala LED",
                control_variables=[
                    "Panjang dan luas penampang konduktor (kabel / pita aluminium foil)",
                    "Jenis lampu beban LED 5mm",
                    "Luas bidang kontak kaleng aluminium yang diamplas",
                ],
                x_axis_label="Tegangan Baterai V (Volt)",
                y_axis_label="Kuat Arus Listrik I (mA)",
                expected_trend=ExpectedGraphTrendEnum.LINEAR_PROPORTIONAL,
            ),
            AgeAdaptiveLevelEnum.HIGHER_ED_UNI: ScientificVariablesAndGraphSchemaDTO(
                formulas_latex=[
                    r"V_{\text{terminal}} = \mathcal{E} - I \cdot r_{\text{int}}",
                    r"R_{\text{konduktor}} = \rho \frac{L}{A}",
                    r"I_D = I_S \left( e^{\frac{q V_D}{n k_B T}} - 1 \right)",
                ],
                independent_variable="Beda Potensial Input V (Volt) & Panjang Konduktor L (cm)",
                dependent_variable="Arus Rangkaian I (mA) & Tegangan Jatuh Kontak V_drop (mV)",
                control_variables=[
                    "Suhu ruang laboratorium T (Kelvin)",
                    "Tekanan kontak mekanik elektroda pada permukaan kaleng aluminium",
                    "Tipe sel baterai AA Alkaline 1.5V",
                ],
                x_axis_label="Tegangan Input V (Volt)",
                y_axis_label="Kuat Arus Terukur I (mA)",
                expected_trend=ExpectedGraphTrendEnum.LINEAR_PROPORTIONAL,
            ),
        },
        variables_and_graph_my={
            AgeAdaptiveLevelEnum.SD_ELEMENTARY: None,
            AgeAdaptiveLevelEnum.SMP_LOWER_SEC: None,
            AgeAdaptiveLevelEnum.SMA_UPPER_SEC: ScientificVariablesAndGraphSchemaDTO(
                formulas_latex=[
                    r"I = \frac{V}{R}",
                    r"V_{\text{jumlah}} = \sum_{i=1}^{n} V_i",
                    r"P = V \cdot I = I^2 \cdot R",
                ],
                independent_variable="Voltan Bateri Bersiri V (Volt)",
                dependent_variable="Arus Elektrik I (mA) / Kecerahan Nyalaan LED",
                control_variables=[
                    "Panjang dan keratan rentas konduktor",
                    "Jenis beban diod LED 5mm",
                    "Permukaan tin aluminium yang telah digosok kertas pasir",
                ],
                x_axis_label="Voltan V (Volt)",
                y_axis_label="Arus Elektrik I (mA)",
                expected_trend=ExpectedGraphTrendEnum.LINEAR_PROPORTIONAL,
            ),
            AgeAdaptiveLevelEnum.HIGHER_ED_UNI: ScientificVariablesAndGraphSchemaDTO(
                formulas_latex=[
                    r"V_{\text{terminal}} = \mathcal{E} - I \cdot r_{\text{dalam}}",
                    r"R_{\text{konduktor}} = \rho \frac{L}{A}",
                    r"I_D = I_S \left( e^{\frac{q V_D}{n k_B T}} - 1 \right)",
                ],
                independent_variable="Beza Keupayaan Input V (Volt) & Panjang Konduktor L (cm)",
                dependent_variable="Arus Litar I (mA) & Susutan Voltan Sentuhan V_drop (mV)",
                control_variables=[
                    "Suhu bilik makmal T (Kelvin)",
                    "Tekanan sentuhan elektrod pada permukaan tin aluminium",
                ],
                x_axis_label="Voltan Input V (Volt)",
                y_axis_label="Arus Terukur I (mA)",
                expected_trend=ExpectedGraphTrendEnum.LINEAR_PROPORTIONAL,
            ),
        },
        steps_id=[
            {
                "step_number": 1,
                "instruction": "Susun 2 baterai AA 1.5V secara seri (kutub positif bertemu kutub negatif) lalu hubungkan kabel pertama (atau pita aluminium foil) ke kutub positif (+) baterai.",
                "requires_vision_verification": True,
                "vision_verification_prompt": "Pastikan 2 baterai AA tersusun seri dan kabel merah/konduktor terhubung rapat pada kutub positif (+) baterai.",
                "default_ar_overlay": AROverlaySimulationDTO(
                    overlay_type=AROverlayTypeEnum.ELECTRON_FLOW,
                    caption_local="Simulasi AR: Beda potensial 3.0V terbentuk pada susunan seri baterai AA (+3.0V ke 0V).",
                    vector_paths=[
                        ARVectorPathDTO(
                            label="Medan Potensial Seri Baterai (3.0V)",
                            start_x_norm=0.22,
                            start_y_norm=0.50,
                            end_x_norm=0.52,
                            end_y_norm=0.50,
                            color_hex="#00E5FF",
                            animation_style=ARAnimationStyleEnum.PULSING_ARROW,
                        )
                    ],
                ),
            },
            {
                "step_number": 2,
                "instruction": "Amplas sedikit permukaan samping kaleng minuman aluminium bekas untuk menghilangkan lapisan cat isolator, lalu tempelkan ujung kabel dari kutub positif (+) dan kaki panjang LED (anoda) melalui badan kaleng sebagai sakelar konduktor.",
                "requires_vision_verification": True,
                "vision_verification_prompt": "Pastikan kabel/konduktor menyentuh bagian logam kaleng aluminium yang sudah diamplas dan kaki LED terhubung ke kutub negatif (-) baterai.",
                "default_ar_overlay": AROverlaySimulationDTO(
                    overlay_type=AROverlayTypeEnum.ELECTRON_FLOW,
                    caption_local="Simulasi AR: Elektron bebas (e-) mengalir dari kutub negatif (-) baterai melewati badan kaleng aluminium menuju LED, sedangkan arus konvensional (I) mengalir dari (+) ke (-).",
                    vector_paths=[
                        ARVectorPathDTO(
                            label="Aliran Elektron (e-)",
                            start_x_norm=0.78,
                            start_y_norm=0.55,
                            end_x_norm=0.48,
                            end_y_norm=0.35,
                            color_hex="#38BDF8",
                            animation_style=ARAnimationStyleEnum.FLOWING_PARTICLES,
                        ),
                        ARVectorPathDTO(
                            label="Arus Konvensional (I = V/R)",
                            start_x_norm=0.25,
                            start_y_norm=0.45,
                            end_x_norm=0.68,
                            end_y_norm=0.35,
                            color_hex="#FACC15",
                            animation_style=ARAnimationStyleEnum.PULSING_ARROW,
                        ),
                    ],
                ),
            },
            {
                "step_number": 3,
                "instruction": "Amati nyala lampu LED saat kabel disentuhkan pada bagian kaleng yang diamplas dibanding bagian kaleng yang masih tertutup cat, lalu catat hasil pengamatan pada tabel variabel.",
                "requires_vision_verification": False,
                "vision_verification_prompt": "Verifikasi lampu LED menyala terang pada rangkaian tertutup.",
                "default_ar_overlay": AROverlaySimulationDTO(
                    overlay_type=AROverlayTypeEnum.ELECTRON_FLOW,
                    caption_local="Simulasi AR: Pancaran foton cahaya LED saat rangkaian tertutup mencapai tegangan maju (Forward Bias >= 2.0V).",
                    vector_paths=[
                        ARVectorPathDTO(
                            label="Emisi Foton LED",
                            start_x_norm=0.50,
                            start_y_norm=0.35,
                            end_x_norm=0.50,
                            end_y_norm=0.15,
                            color_hex="#4ADE80",
                            animation_style=ARAnimationStyleEnum.PRESSURE_WAVE,
                        )
                    ],
                ),
            },
        ],
        steps_my=[
            {
                "step_number": 1,
                "instruction": "Susun 2 bateri AA 1.5V secara bersiri dan sambungkan wayar pertama (atau jalur kerajang aluminium) ke terminal positif (+) bateri.",
                "requires_vision_verification": True,
                "vision_verification_prompt": "Pastikan 2 bateri AA disusun bersiri dan wayar merah bersambung pada kutub positif (+) bateri.",
                "default_ar_overlay": AROverlaySimulationDTO(
                    overlay_type=AROverlayTypeEnum.ELECTRON_FLOW,
                    caption_local="Simulasi AR: Beza keupayaan 3.0V terhasil merentasi dua sel kering bersiri.",
                    vector_paths=[
                        ARVectorPathDTO(
                            label="Beza Keupayaan Bateri Bersiri (3.0V)",
                            start_x_norm=0.22,
                            start_y_norm=0.50,
                            end_x_norm=0.52,
                            end_y_norm=0.50,
                            color_hex="#00E5FF",
                            animation_style=ARAnimationStyleEnum.PULSING_ARROW,
                        )
                    ],
                ),
            },
            {
                "step_number": 2,
                "instruction": "Gosok permukaan tin aluminium dengan kertas pasir untuk menanggalkan lapisan cat penebat, kemudian sambungkan litar melalui badan tin ke kaki panjang LED (anoda).",
                "requires_vision_verification": True,
                "vision_verification_prompt": "Pastikan konduktor menyentuh bahagian logam tin aluminium yang telah digosok dan LED bersambung ke kutub negatif (-) bateri.",
                "default_ar_overlay": AROverlaySimulationDTO(
                    overlay_type=AROverlayTypeEnum.ELECTRON_FLOW,
                    caption_local="Simulasi AR: Aliran elektron (e-) bergerak dari terminal (-) ke (+), manakala arus konvensional (I) mengalir dari (+) ke (-).",
                    vector_paths=[
                        ARVectorPathDTO(
                            label="Aliran Elektron (e-)",
                            start_x_norm=0.78,
                            start_y_norm=0.55,
                            end_x_norm=0.48,
                            end_y_norm=0.35,
                            color_hex="#38BDF8",
                            animation_style=ARAnimationStyleEnum.FLOWING_PARTICLES,
                        ),
                        ARVectorPathDTO(
                            label="Arus Konvensional (I = V/R)",
                            start_x_norm=0.25,
                            start_y_norm=0.45,
                            end_x_norm=0.68,
                            end_y_norm=0.35,
                            color_hex="#FACC15",
                            animation_style=ARAnimationStyleEnum.PULSING_ARROW,
                        ),
                    ],
                ),
            },
            {
                "step_number": 3,
                "instruction": "Perhatikan kecerahan nyalaan LED apabila disentuh pada bahagian tin yang digosok berbanding bahagian bercat, dan rekodkan data ke dalam jadual pemerhatian.",
                "requires_vision_verification": False,
                "vision_verification_prompt": "Sahkan LED menyala dengan terang dalam litar lengkap.",
                "default_ar_overlay": AROverlaySimulationDTO(
                    overlay_type=AROverlayTypeEnum.ELECTRON_FLOW,
                    caption_local="Simulasi AR: Tenaga elektrik ditukarkan kepada tenaga cahaya pada simpang p-n LED.",
                    vector_paths=[
                        ARVectorPathDTO(
                            label="Pancaran Foton LED",
                            start_x_norm=0.50,
                            start_y_norm=0.35,
                            end_x_norm=0.50,
                            end_y_norm=0.15,
                            color_hex="#4ADE80",
                            animation_style=ARAnimationStyleEnum.PRESSURE_WAVE,
                        )
                    ],
                ),
            },
        ],
        reflection_questions_id=[
            {
                "question_id": "q-elec-1",
                "prompt": "Mengapa bagian luar kaleng minuman aluminium harus diamplas terlebih dahulu agar lampu LED dapat menyala?",
                "options": [
                    "Karena cat dan lapisan pelindung pada kaleng bersifat isolator yang menghambat aliran elektron",
                    "Agar kaleng menjadi lebih ringan saat dialiri listrik",
                    "Untuk mengubah aluminium menjadi magnet permanen",
                    "Karena amplas memberikan muatan listrik tambahan ke baterai",
                ],
                "correct_index": 0,
                "explanation": "Kaleng minuman dilapisi cat polimer dan oksida tipis yang bersifat isolator. Mengamplas permukaan membuka akses langsung ke logam aluminium yang memiliki elektron bebas sebagai konduktor.",
            },
            {
                "question_id": "q-elec-2",
                "prompt": "Bagaimana arah aliran elektron sebenarnya dibandingkan dengan arah arus listrik konvensional pada rangkaian yang kamu rakit?",
                "options": [
                    "Elektron mengalir dari kutub negatif (-) ke positif (+), sedangkan arus konvensional dari (+) ke (-)",
                    "Keduanya mengalir dari kutub positif (+) ke negatif (-)",
                    "Elektron berhenti di dalam lampu LED dan tidak kembali ke baterai",
                    "Arus konvensional hanya mengalir jika tidak ada hambatan",
                ],
                "correct_index": 0,
                "explanation": "Elektron bermuatan negatif sehingga ditolak oleh kutub negatif (-) dan ditarik ke kutub positif (+), berlawanan dengan kesepakatan arah arus konvensional.",
            },
        ],
        reflection_questions_my=[
            {
                "question_id": "q-elec-1",
                "prompt": "Mengapakah bahagian luar tin minuman aluminium perlu digosok dengan kertas pasir terlebih dahulu supaya lampu LED menyala?",
                "options": [
                    "Kerana lapisan cat dan polimer pada tin bersifat penebat yang menghalang aliran elektron",
                    "Supaya tin menjadi lebih ringan apabila arus mengalir",
                    "Untuk menukarkan aluminium menjadi magnet kekal",
                    "Kerana kertas pasir membekalkan voltan tambahan",
                ],
                "correct_index": 0,
                "explanation": "Lapisan cat pada tin adalah penebat elektrik. Menggosok permukaan mendedahkan logam aluminium tulen yang mempunyai elektron bebas untuk mengalirkan arus.",
            },
        ],
    ),
    "roket-pneumatik-bernoulli-pipa-botol": ExperimentBlueprintSpec(
        slug="roket-pneumatik-bernoulli-pipa-botol",
        title_id="Peluncur Roket Tekanan Udara & Fluida Silindris (Bernoulli & Hukum III Newton)",
        title_my="Pelancar Roket Tekanan Udara & Bendalir Silinder (Bernoulli & Hukum III Newton)",
        safety_severity="SAFE",
        required_materials=[
            ExperimentMaterialReq("plastic_bottle_pet_600ml", 1, "pcs"),
            ExperimentMaterialReq("pvc_pipe_half_inch", 1, "pcs"),
            ExperimentMaterialReq("balloon_latex", 1, "pcs"),
        ],
        curriculum_badges_id={
            AgeAdaptiveLevelEnum.SD_ELEMENTARY: "Kurikulum Merdeka SD Fase B/C: Gaya Dorong Udara & Benda Bergerak",
            AgeAdaptiveLevelEnum.SMP_LOWER_SEC: "Kurikulum Merdeka SMP Fase D: Tekanan Gas & Hukum III Newton (Aksi-Reaksi)",
            AgeAdaptiveLevelEnum.SMA_UPPER_SEC: "Kurikulum Merdeka SMA Fase F: Dinamika Fluida, Hukum Bernoulli & Impuls-Momentum",
            AgeAdaptiveLevelEnum.HIGHER_ED_UNI: "DIKTI Mekanika Fluida: Persamaan Kontinuitas, Aliran Kompresibel & Balistik Eksternal",
        },
        curriculum_badges_my={
            AgeAdaptiveLevelEnum.SD_ELEMENTARY: "KSSR Sains Tahun 4: Daya Tolakan Udara & Pergerakan",
            AgeAdaptiveLevelEnum.SMP_LOWER_SEC: "KSSM Sains Tingkatan 3: Tekanan Udara & Prinsip Aksi-Reaksi",
            AgeAdaptiveLevelEnum.SMA_UPPER_SEC: "KSSM Fizik Tingkatan 4 & 5: Prinsip Bernoulli, Keabadian Momentum & Impuls",
            AgeAdaptiveLevelEnum.HIGHER_ED_UNI: "Universiti Mekanik Bendalir: Persamaan Keselanjaran & Dinamik Pelancaran Pneumatik",
        },
        competency_codes_id={
            AgeAdaptiveLevelEnum.SD_ELEMENTARY: "KM-IPAS-SD-B-3.2",
            AgeAdaptiveLevelEnum.SMP_LOWER_SEC: "KM-IPA-SMP-D-8.1",
            AgeAdaptiveLevelEnum.SMA_UPPER_SEC: "KM-FIS-SMA-F-11.4",
            AgeAdaptiveLevelEnum.HIGHER_ED_UNI: "DIKTI-MECH-204-FL",
        },
        competency_codes_my={
            AgeAdaptiveLevelEnum.SD_ELEMENTARY: "KSSR-SN-T4-6.1",
            AgeAdaptiveLevelEnum.SMP_LOWER_SEC: "KSSM-SN-T3-8.2",
            AgeAdaptiveLevelEnum.SMA_UPPER_SEC: "KSSM-FIZ-T4-2.5",
            AgeAdaptiveLevelEnum.HIGHER_ED_UNI: "UNI-MECH-210-FL",
        },
        learning_objectives_id={
            AgeAdaptiveLevelEnum.SD_ELEMENTARY: "Membuat peluncur roket dari botol plastik bekas dan saluran pipa/sedotan serta mengamati seberapa jauh roket meluncur.",
            AgeAdaptiveLevelEnum.SMP_LOWER_SEC: "Menjelaskan hubungan tekanan udara saat botol ditekan dengan gaya dorong roket berdasarkan Hukum III Newton.",
            AgeAdaptiveLevelEnum.SMA_UPPER_SEC: "Menghitung kecepatan semburan udara menggunakan persamaan kontinuitas (A1*v1 = A2*v2) dan memetakan grafik jarak tempuh terhadap tekanan/volume kompresi.",
            AgeAdaptiveLevelEnum.HIGHER_ED_UNI: "Memodelkan konversi energi kompresi adiabatik gas ideal menjadi energi kinetik translasi proyektil serta mengevaluasi rugi-rugi gesekan pipa (Poiseuille/Darcy-Weisbach).",
        },
        learning_objectives_my={
            AgeAdaptiveLevelEnum.SD_ELEMENTARY: "Membina pelancar roket daripada botol plastik terpakai dan memerhatikan jarak penerbangan roket.",
            AgeAdaptiveLevelEnum.SMP_LOWER_SEC: "Menerangkan hubungan tekanan udara apabila botol ditekan dengan daya tujahan mengikut Hukum Ketiga Newton.",
            AgeAdaptiveLevelEnum.SMA_UPPER_SEC: "Mengira halaju aliran udara menggunakan persamaan keselanjaran (A1*v1 = A2*v2) dan memplot graf jarak lawan tekanan.",
            AgeAdaptiveLevelEnum.HIGHER_ED_UNI: "Memodelkan penukaran tenaga mampatan adiabatik gas kepada tenaga kinetik projektil dan menganalisis kehilangan geseran paip.",
        },
        stem_concepts_id={
            AgeAdaptiveLevelEnum.SD_ELEMENTARY: STEMConceptsBreakdownDTO(
                science="Saat botol plastik ditekan, udara di dalamnya terdorong keluar lewat saluran pipa/sedotan dan mendorong roket melesat ke depan!",
                technology="Saluran silinder mengarahkan udara agar tidak bocor ke samping.",
                engineering="Menggunakan sedotan tebal atau gulungan karton bekas sebagai pengganti pipa PVC jika pipa tidak tersedia.",
                mathematics="Mengukur jarak terbang roket menggunakan penggaris atau meteran (dalam cm).",
            ),
            AgeAdaptiveLevelEnum.SMP_LOWER_SEC: STEMConceptsBreakdownDTO(
                science="Penyempitan luas penampang dari botol ke saluran silinder meningkatkan kelajuan aliran udara dan menghasilkan gaya aksi-reaksi ($F_{\\text{aksi}} = -F_{\\text{reaksi}}$).",
                technology="Sistem pneumatik memanfaatkan udara bertekanan untuk mentransfer gaya mekanik.",
                engineering="Substitusi fungsional: pipa PVC dapat digantikan oleh sedotan plastik tebal atau gulungan karton yang dilapisi selotip karena sama-sama berfungsi sebagai konduit fluida silindris.",
                mathematics="Perbandingan luas penampang lingkaran $A = \\pi r^2$.",
            ),
            AgeAdaptiveLevelEnum.SMA_UPPER_SEC: STEMConceptsBreakdownDTO(
                science="Persamaan Kontinuitas ($A_1 v_1 = A_2 v_2$) dan Hukum Bernoulli ($P + \\frac{1}{2}\\rho v^2 + \\rho g h = \\text{konstan}$) menjelaskan peningkatan kecepatan aliran saat udara melewati konduit berdiameter kecil.",
                technology="Transmisi impuls pneumatik $\\Delta p = F \\cdot \\Delta t$ pada peluncur tekanan udara.",
                engineering="Desain sambungan kedap udara dan pemilihan material konduit pengganti (sedotan boba / gulungan karton) dengan kekakuan radial memadai.",
                mathematics="Persamaan gerak parabola jarak maksimum $X_{\\max} = \\frac{v_0^2 \\sin(2\\theta)}{g}$.",
            ),
            AgeAdaptiveLevelEnum.HIGHER_ED_UNI: STEMConceptsBreakdownDTO(
                science="Ekspansi politropik gas ($P V^\\gamma = \\text{konstan}$) dalam ruang botol menghasilkan beda tekanan $\\Delta P(t)$ yang mempercepat massa proyektil sepanjang tabung peluncur.",
                technology="Pemodelan dinamika fluida internal dan aerodinamika hambatan udara ($F_d = \\frac{1}{2} C_d \\rho A v^2$).",
                engineering="Analisis ekuivalensi hidraulik diameter dalam ($D_h$) saat melakukan substitusi material pipa PVC dengan sedotan polimer atau komposit karton.",
                mathematics="Integrasi numerik persamaan diferensial gerak peluncuran dan regresi kurva jarak jangkauan terhadap sudut elevasi $\\theta$.",
            ),
        },
        stem_concepts_my={
            AgeAdaptiveLevelEnum.SD_ELEMENTARY: STEMConceptsBreakdownDTO(
                science="Apabila botol plastik ditekan, udara di dalamnya ditolak keluar melalui paip/straw dan menolak roket terbang ke hadapan!",
                technology="Tiub silinder mengarahkan aliran udara supaya fokus ke satu arah.",
                engineering="Menggunakan straw plastik tebal atau gulungan kadbod tisu sebagai pengganti paip PVC.",
                mathematics="Mengukur jarak penerbangan roket dalam unit sentimeter (cm).",
            ),
            AgeAdaptiveLevelEnum.SMP_LOWER_SEC: STEMConceptsBreakdownDTO(
                science="Mampatan botol meningkatkan tekanan udara dalaman dan menghasilkan daya tujahan mengikut Hukum Ketiga Newton.",
                technology="Aplikasi sistem pneumatik mudah.",
                engineering="Penggantian bahan berfungsi serupa: paip PVC boleh digantikan dengan straw tebal atau gulungan kadbod.",
                mathematics="Pengiraan luas keratan rentas bulatan $A = \\pi r^2$.",
            ),
            AgeAdaptiveLevelEnum.SMA_UPPER_SEC: STEMConceptsBreakdownDTO(
                science="Persamaan Keselanjaran ($A_1 v_1 = A_2 v_2$) dan Prinsip Bernoulli menjelaskan pertambahan halaju udara di dalam tiub sempit.",
                technology="Pemindahan impuls pneumatik $\\Delta p = F \\cdot \\Delta t$.",
                engineering="Rekaan sambungan kedap udara antara muncung botol dan tiub pelancar.",
                mathematics="Persamaan julat projektil $X_{\\max} = \\frac{v_0^2 \\sin(2\\theta)}{g}$.",
            ),
            AgeAdaptiveLevelEnum.HIGHER_ED_UNI: STEMConceptsBreakdownDTO(
                science="Pengembangan adiabatik gas ($P V^\\gamma = \\text{malar}$) dan analisis aliran bendalir dalam paip.",
                technology="Pencirian kecekapan pelancar pneumatik.",
                engineering="Analisis kesetaraan diameter hidraulik ($D_h$) bagi bahan gantian.",
                mathematics="Regresi bukan linear dan analisis ralat eksperimen.",
            ),
        },
        variables_and_graph_id={
            AgeAdaptiveLevelEnum.SD_ELEMENTARY: None,
            AgeAdaptiveLevelEnum.SMP_LOWER_SEC: None,
            AgeAdaptiveLevelEnum.SMA_UPPER_SEC: ScientificVariablesAndGraphSchemaDTO(
                formulas_latex=[
                    r"A_1 v_1 = A_2 v_2",
                    r"P_1 + \frac{1}{2}\rho v_1^2 = P_2 + \frac{1}{2}\rho v_2^2",
                    r"X = \frac{v_0^2 \sin(2\theta)}{g}",
                ],
                independent_variable="Sudut Elevasi Peluncuran (derajat) / Kedalaman Kompresi Botol",
                dependent_variable="Jarak Tempuh Horizontal Roket X (cm)",
                control_variables=[
                    "Volume botol plastik PET 600ml",
                    "Diameter dan panjang saluran peluncur (pipa PVC / sedotan tebal)",
                    "Massa selongsong roket",
                ],
                x_axis_label="Sudut Elevasi Peluncuran (derajat)",
                y_axis_label="Jarak Tempuh Horizontal X (cm)",
                expected_trend=ExpectedGraphTrendEnum.POLYNOMIAL,
            ),
            AgeAdaptiveLevelEnum.HIGHER_ED_UNI: ScientificVariablesAndGraphSchemaDTO(
                formulas_latex=[
                    r"A_1 v_1 = A_2 v_2",
                    r"\Delta P = \frac{8 \mu L Q}{\pi R^4}",
                    r"v_0 = \sqrt{\frac{2 \Delta P \cdot V_{\text{kompresi}}}{m_{\text{roket}}}}",
                ],
                independent_variable="Beda Tekanan Kompresi Delta P (kPa) & Diameter Dalam Konduit D (mm)",
                dependent_variable="Kecepatan Awal Peluncuran v_0 (m/s) & Jarak Jangkauan X (m)",
                control_variables=[
                    "Massa proyektil roket m (gram)",
                    "Sudut peluncuran tetap 45 derajat",
                    "Volume awal ruang tekan botol 600 ml",
                ],
                x_axis_label="Volume Kompresi Delta V (ml)",
                y_axis_label="Kecepatan Awal v_0 (m/s)",
                expected_trend=ExpectedGraphTrendEnum.LINEAR_PROPORTIONAL,
            ),
        },
        variables_and_graph_my={
            AgeAdaptiveLevelEnum.SD_ELEMENTARY: None,
            AgeAdaptiveLevelEnum.SMP_LOWER_SEC: None,
            AgeAdaptiveLevelEnum.SMA_UPPER_SEC: ScientificVariablesAndGraphSchemaDTO(
                formulas_latex=[
                    r"A_1 v_1 = A_2 v_2",
                    r"P_1 + \frac{1}{2}\rho v_1^2 = P_2 + \frac{1}{2}\rho v_2^2",
                    r"X = \frac{v_0^2 \sin(2\theta)}{g}",
                ],
                independent_variable="Sudut Dongakan Pelancaran (darjah)",
                dependent_variable="Jarak Mengufuk Roket X (cm)",
                control_variables=[
                    "Isipadu botol plastik 600ml",
                    "Diameter dan panjang tiub pelancar",
                    "Jisim roket",
                ],
                x_axis_label="Sudut Pelancaran (darjah)",
                y_axis_label="Jarak Mengufuk X (cm)",
                expected_trend=ExpectedGraphTrendEnum.POLYNOMIAL,
            ),
            AgeAdaptiveLevelEnum.HIGHER_ED_UNI: ScientificVariablesAndGraphSchemaDTO(
                formulas_latex=[
                    r"A_1 v_1 = A_2 v_2",
                    r"\Delta P = \frac{8 \mu L Q}{\pi R^4}",
                    r"v_0 = \sqrt{\frac{2 \Delta P \cdot V_{\text{mampatan}}}{m_{\text{roket}}}}",
                ],
                independent_variable="Isipadu Mampatan Delta V (ml)",
                dependent_variable="Halaju Awal Pelancaran v_0 (m/s)",
                control_variables=[
                    "Jisim projektil m (gram)",
                    "Sudut pelancaran tetap 45 darjah",
                ],
                x_axis_label="Isipadu Mampatan Delta V (ml)",
                y_axis_label="Halaju Awal v_0 (m/s)",
                expected_trend=ExpectedGraphTrendEnum.LINEAR_PROPORTIONAL,
            ),
        },
        steps_id=[
            {
                "step_number": 1,
                "instruction": "Pasangkan pipa PVC 1/2 inci (atau bahan substitusi: sedotan plastik tebal / gulungan karton yang dilapisi selotip) ke mulut botol plastik 600ml hingga rapat dan kedap udara.",
                "requires_vision_verification": True,
                "vision_verification_prompt": "Pastikan saluran silinder (pipa PVC / sedotan tebal / gulungan karton) terpasang lurus dan rapat pada mulut botol plastik 600ml.",
                "default_ar_overlay": AROverlaySimulationDTO(
                    overlay_type=AROverlayTypeEnum.FLUID_PRESSURE,
                    caption_local="Simulasi AR: Penyempitan penampang dari badan botol (A1) ke saluran peluncur (A2) meningkatkan kecepatan aliran udara (v2 > v1).",
                    vector_paths=[
                        ARVectorPathDTO(
                            label="Tekanan Kompresi Udara (P1)",
                            start_x_norm=0.25,
                            start_y_norm=0.60,
                            end_x_norm=0.50,
                            end_y_norm=0.50,
                            color_hex="#F97316",
                            animation_style=ARAnimationStyleEnum.PRESSURE_WAVE,
                        ),
                        ARVectorPathDTO(
                            label="Aliran Jet Udara Cepat (v2)",
                            start_x_norm=0.50,
                            start_y_norm=0.50,
                            end_x_norm=0.82,
                            end_y_norm=0.35,
                            color_hex="#00E5FF",
                            animation_style=ARAnimationStyleEnum.FLOWING_PARTICLES,
                        ),
                    ],
                ),
            },
            {
                "step_number": 2,
                "instruction": "Pasang selongsong roket/balon indikator pada ujung saluran peluncur, atur sudut kemiringan (misal 30°, 45°, 60°), lalu tekan botol plastik dengan cepat dan ukur jarak tempuhnya.",
                "requires_vision_verification": True,
                "vision_verification_prompt": "Pastikan proyektil berada di ujung saluran peluncur dengan sudut kemiringan siap luncur.",
                "default_ar_overlay": AROverlaySimulationDTO(
                    overlay_type=AROverlayTypeEnum.FORCE_VECTOR,
                    caption_local="Simulasi AR: Gaya dorong aksi udara bertekanan (F_aksi) menghasilkan gaya reaksi dorong roket (F_reaksi) sesuai Hukum III Newton.",
                    vector_paths=[
                        ARVectorPathDTO(
                            label="Gaya Aksi Semburan Udara (-F)",
                            start_x_norm=0.62,
                            start_y_norm=0.45,
                            end_x_norm=0.38,
                            end_y_norm=0.55,
                            color_hex="#EF4444",
                            animation_style=ARAnimationStyleEnum.PULSING_ARROW,
                        ),
                        ARVectorPathDTO(
                            label="Gaya Reaksi Dorong Roket (+F)",
                            start_x_norm=0.62,
                            start_y_norm=0.45,
                            end_x_norm=0.88,
                            end_y_norm=0.25,
                            color_hex="#22C55E",
                            animation_style=ARAnimationStyleEnum.PULSING_ARROW,
                        ),
                    ],
                ),
            },
        ],
        steps_my=[
            {
                "step_number": 1,
                "instruction": "Pasangkan paip PVC 1/2 inci (atau bahan gantian: straw plastik tebal / gulungan kadbod) pada muncung botol plastik 600ml sehingga kedap udara.",
                "requires_vision_verification": True,
                "vision_verification_prompt": "Pastikan tiub silinder terpasang rapat pada muncung botol plastik 600ml.",
                "default_ar_overlay": AROverlaySimulationDTO(
                    overlay_type=AROverlayTypeEnum.FLUID_PRESSURE,
                    caption_local="Simulasi AR: Pengurangan luas keratan rentas daripada botol (A1) ke tiub (A2) meningkatkan halaju aliran udara (v2 > v1).",
                    vector_paths=[
                        ARVectorPathDTO(
                            label="Tekanan Mampatan Udara (P1)",
                            start_x_norm=0.25,
                            start_y_norm=0.60,
                            end_x_norm=0.50,
                            end_y_norm=0.50,
                            color_hex="#F97316",
                            animation_style=ARAnimationStyleEnum.PRESSURE_WAVE,
                        ),
                        ARVectorPathDTO(
                            label="Aliran Jet Udara Laju (v2)",
                            start_x_norm=0.50,
                            start_y_norm=0.50,
                            end_x_norm=0.82,
                            end_y_norm=0.35,
                            color_hex="#00E5FF",
                            animation_style=ARAnimationStyleEnum.FLOWING_PARTICLES,
                        ),
                    ],
                ),
            },
            {
                "step_number": 2,
                "instruction": "Letakkan roket pada hujung tiub pelancar, laraskan sudut dongakan (30°, 45°, 60°), tekan botol dengan pantas dan ukur jarak penerbangan.",
                "requires_vision_verification": True,
                "vision_verification_prompt": "Pastikan roket berada di hujung tiub pelancar pada sudut yang betul.",
                "default_ar_overlay": AROverlaySimulationDTO(
                    overlay_type=AROverlayTypeEnum.FORCE_VECTOR,
                    caption_local="Simulasi AR: Vektor Daya Tujahan (+F) dan Daya Aksi Udara (-F) mengikut Hukum Ketiga Newton.",
                    vector_paths=[
                        ARVectorPathDTO(
                            label="Daya Tujahan Roket (+F)",
                            start_x_norm=0.62,
                            start_y_norm=0.45,
                            end_x_norm=0.88,
                            end_y_norm=0.25,
                            color_hex="#22C55E",
                            animation_style=ARAnimationStyleEnum.PULSING_ARROW,
                        )
                    ],
                ),
            },
        ],
        reflection_questions_id=[
            {
                "question_id": "q-pneu-1",
                "prompt": "Mengapa sedotan plastik tebal atau gulungan karton bekas dapat menggantikan pipa PVC pada eksperimen peluncur tekanan udara ini?",
                "options": [
                    "Karena keduanya memiliki bentuk geometri tabung silindris yang sama-sama berfungsi menyalurkan aliran udara dan menjaga tekanan fluida (Prinsip Kontinuitas & Bernoulli)",
                    "Karena sedotan plastik memiliki berat jenis yang sama persis dengan logam",
                    "Karena karton dapat menghasilkan reaksi kimia pembakaran sendiri",
                    "Karena pipa PVC tidak bisa dilewati udara sama sekali",
                ],
                "correct_index": 0,
                "explanation": "Dalam mekanika fluida, fungsi utama pipa pada peluncur pneumatik adalah sebagai konduit silindris kedap udara yang memfokuskan debit aliran Q = A * v. Sedotan tebal atau gulungan karton berlapis selotip memenuhi fungsi fisika tersebut.",
            }
        ],
        reflection_questions_my=[
            {
                "question_id": "q-pneu-1",
                "prompt": "Mengapakah straw plastik tebal atau gulungan kadbod boleh menggantikan paip PVC dalam eksperimen ini?",
                "options": [
                    "Kerana kedua-duanya mempunyai geometri silinder yang berfungsi menyalurkan aliran udara mengikut Prinsip Keselanjaran & Bernoulli",
                    "Kerana straw mempunyai ketumpatan yang sama dengan besi",
                    "Kerana kadbod menghasilkan tindak balas kimia",
                    "Kerana paip PVC menghalang udara",
                ],
                "correct_index": 0,
                "explanation": "Fungsi fizikal utama paip di sini adalah sebagai konduit silinder bagi mengarahkan aliran udara bertekanan (Q = A * v).",
            }
        ],
    ),
    "reaksi-endoterm-eksoterm-asam-basa-dapur": ExperimentBlueprintSpec(
        slug="reaksi-endoterm-eksoterm-asam-basa-dapur",
        title_id="Stoikiometri Gas CO2 & Inflasi Balon dari Reaksi Cuka Dapur & Soda Kue",
        title_my="Stoikiometri Gas CO2 & Pengembangan Belon daripada Cuka & Serbuk Penaik",
        safety_severity="SAFE",
        required_materials=[
            ExperimentMaterialReq("plastic_bottle_pet_600ml", 2, "pcs"),
            ExperimentMaterialReq("vinegar_kitchen", 1, "bottle"),
            ExperimentMaterialReq("sodium_bicarbonate", 1, "pack"),
            ExperimentMaterialReq("balloon_latex", 1, "pcs"),
        ],
        curriculum_badges_id={
            AgeAdaptiveLevelEnum.SD_ELEMENTARY: "Kurikulum Merdeka SD Fase C: Perubahan Wujud & Gas yang Mengembangkan Balon",
            AgeAdaptiveLevelEnum.SMP_LOWER_SEC: "Kurikulum Merdeka SMP Fase D: Reaksi Kimia Asam-Basa & Pembentukan Gas CO2",
            AgeAdaptiveLevelEnum.SMA_UPPER_SEC: "Kurikulum Merdeka SMA Fase E/F: Stoikiometri Reaksi, Pereaksi Pembatas & Hukum Gas Ideal",
            AgeAdaptiveLevelEnum.HIGHER_ED_UNI: "DIKTI Kimia Dasar I: Kinetika Pelepasan CO2, Termokimia Endotermik & Persamaan Gas Nyata",
        },
        curriculum_badges_my={
            AgeAdaptiveLevelEnum.SD_ELEMENTARY: "KSSR Sains Tahun 5: Jirim & Pengembangan Gas di dalam Belon",
            AgeAdaptiveLevelEnum.SMP_LOWER_SEC: "KSSM Sains Tingkatan 2: Asid dan Alkali di Dapur",
            AgeAdaptiveLevelEnum.SMA_UPPER_SEC: "KSSM Kimia Tingkatan 4: Konsep Mol, Formula & Persamaan Kimia",
            AgeAdaptiveLevelEnum.HIGHER_ED_UNI: "Universiti Kimia Fizikal: Kinetik Tindak Balas & Termodinamik Endotermik",
        },
        competency_codes_id={
            AgeAdaptiveLevelEnum.SD_ELEMENTARY: "KM-IPAS-SD-C-3.4",
            AgeAdaptiveLevelEnum.SMP_LOWER_SEC: "KM-IPA-SMP-D-7.3",
            AgeAdaptiveLevelEnum.SMA_UPPER_SEC: "KM-KIM-SMA-E-10.2",
            AgeAdaptiveLevelEnum.HIGHER_ED_UNI: "DIKTI-CHEM-101-ST",
        },
        competency_codes_my={
            AgeAdaptiveLevelEnum.SD_ELEMENTARY: "KSSR-SN-T5-8.1",
            AgeAdaptiveLevelEnum.SMP_LOWER_SEC: "KSSM-SN-T2-6.1",
            AgeAdaptiveLevelEnum.SMA_UPPER_SEC: "KSSM-KIM-T4-3.4",
            AgeAdaptiveLevelEnum.HIGHER_ED_UNI: "UNI-CHEM-105-TH",
        },
        learning_objectives_id={
            AgeAdaptiveLevelEnum.SD_ELEMENTARY: "Meniup balon secara otomatis menggunakan gelembung gas hasil percampuran cuka dapur dan soda kue.",
            AgeAdaptiveLevelEnum.SMP_LOWER_SEC: "Mengidentifikasi tanda-tanda reaksi kimia (pembentukan gelembung gas CO2 dan penurunan suhu dinding botol).",
            AgeAdaptiveLevelEnum.SMA_UPPER_SEC: "Menghitung volume gas CO2 teoritis berdasarkan stoikiometri mol NaHCO3 + CH3COOH serta memplot grafik diameter balon terhadap massa soda kue.",
            AgeAdaptiveLevelEnum.HIGHER_ED_UNI: "Menentukan pereaksi pembatas (limiting reactant), menghitung perubahan entalpi reaksi endotermik, dan membandingkan volume gas eksperimental terhadap persamaan gas ideal PV = nRT.",
        },
        learning_objectives_my={
            AgeAdaptiveLevelEnum.SD_ELEMENTARY: "Mengembangkan belon secara automatik menggunakan buih gas hasil campuran cuka makan dan serbuk penaik.",
            AgeAdaptiveLevelEnum.SMP_LOWER_SEC: "Mengenal pasti ciri tindak balas kimia melalui pembentukan gas CO2 dan perubahan suhu.",
            AgeAdaptiveLevelEnum.SMA_UPPER_SEC: "Mengira isipadu gas CO2 secara stoikiometri dan memplot graf lilitan belon lawan jisim serbuk penaik.",
            AgeAdaptiveLevelEnum.HIGHER_ED_UNI: "Menentukan bahan tindak balasoad pengehad dan membandingkan isipadu eksperimen dengan persamaan gas unggul PV = nRT.",
        },
        stem_concepts_id={
            AgeAdaptiveLevelEnum.SD_ELEMENTARY: STEMConceptsBreakdownDTO(
                science="Saat soda kue bertemu cuka dapur, muncul ribuan gelembung gas karbon dioksida (CO2) yang naik ke atas dan meniup balon!",
                technology="Balon karet berfungsi sebagai penampung gas elastis.",
                engineering="Memasukkan soda kue ke dalam balon terlebih dahulu agar gas tidak bocor sebelum balon terpasang di mulut botol.",
                mathematics="Membandingkan besar balon dengan 1 sendok vs 2 sendok soda kue.",
            ),
            AgeAdaptiveLevelEnum.SMP_LOWER_SEC: STEMConceptsBreakdownDTO(
                science="Reaksi asam asetat (cuka) dan natrium bikarbonat (soda kue) menghasilkan natrium asetat, air, dan gas karbon dioksida serta menyerap kalor (endoterm).",
                technology="Indikasi tekanan gas dalam wadah tertutup menggunakan membran lateks.",
                engineering="Teknik pencampuran sistem tertutup menggunakan leher botol PET.",
                mathematics="Mengukur keliling balon (cm) menggunakan tali dan penggaris.",
            ),
            AgeAdaptiveLevelEnum.SMA_UPPER_SEC: STEMConceptsBreakdownDTO(
                science="Persamaan reaksi: $\\text{NaHCO}_3(s) + \\text{CH}_3\\text{COOH}(aq) \\rightarrow \\text{CH}_3\\text{COONa}(aq) + \\text{H}_2\\text{O}(l) + \\text{CO}_2(g)\\uparrow$.",
                technology="Pengukuran kuantitatif volume gas hasil reaksi kimia menggunakan aproksimasi geometri bola balon.",
                engineering="Kontrol variabel volume asam asetat untuk mengamati titik jenuh (pereaksi pembatas).",
                mathematics="Hukum Gas Ideal $P V = n R T$ dan perhitungan volume bola $V = \\frac{4}{3}\\pi r^3$.",
            ),
            AgeAdaptiveLevelEnum.HIGHER_ED_UNI: STEMConceptsBreakdownDTO(
                science="Termodinamika reaksi dekomposisi bikarbonat berair ($\\Delta H^\\circ > 0$) dan kesetimbangan kelarutan $\\text{CO}_2(aq) \\rightleftharpoons \\text{CO}_2(g)$ menurut Hukum Henry.",
                technology="Kalorimetri sederhana dan manometri membran elastis (persamaan tegangan permukaan balon Young-Laplace).",
                engineering="Koreksi tekanan internal balon $\\Delta P_{\\text{elastis}}$ terhadap perhitungan mol gas hasil reaksi.",
                mathematics="Regresi kurva saturasi Michaelis/pereaksi pembatas dan perhitungan persen rendemen (% yield).",
            ),
        },
        stem_concepts_my={
            AgeAdaptiveLevelEnum.SD_ELEMENTARY: STEMConceptsBreakdownDTO(
                science="Campuran serbuk penaik dan cuka menghasilkan buih gas karbon dioksida (CO2) yang mengembangkan belon!",
                technology="Belon getah memerangkap gas yang terbebas.",
                engineering="Memasukkan serbuk penaik ke dalam belon sebelum dipasang pada muncung botol.",
                mathematics="Membandingkan saiz belon mengikut bilangan sudu serbuk penaik.",
            ),
            AgeAdaptiveLevelEnum.SMP_LOWER_SEC: STEMConceptsBreakdownDTO(
                science="Tindak balas asid asetik dan natrium bikarbonat membebaskan gas CO2 dan menyerap haba (endotermik).",
                technology="Pengukuran pengembangan gas dalam sistem tertutup.",
                engineering="Reka bentuk penyambungan kedap gas pada mulut botol.",
                mathematics="Mengukur lilitan belon dalam unit cm.",
            ),
            AgeAdaptiveLevelEnum.SMA_UPPER_SEC: STEMConceptsBreakdownDTO(
                science="Persamaan kimia: $\\text{NaHCO}_3(p) + \\text{CH}_3\\text{COOH}(ak) \\rightarrow \\text{CH}_3\\text{COONa}(ak) + \\text{H}_2\\text{O}(ce) + \\text{CO}_2(g)\\uparrow$.",
                technology="Anggaran isipadu gas menggunakan geometri sfera.",
                engineering="Kawalan pemboleh ubah dimalarkan (isipadu cuka) untuk mengesan bahan pengehad.",
                mathematics="Persamaan Gas Unggul $P V = n R T$.",
            ),
            AgeAdaptiveLevelEnum.HIGHER_ED_UNI: STEMConceptsBreakdownDTO(
                science="Termodinamik tindak balas endotermik dan keterlarutan $\\text{CO}_2$ mengikut Hukum Henry.",
                technology="Analisis tekanan membran elastik.",
                engineering="Pembetulan tekanan dalaman belon terhadap pengiraan hasil teori.",
                mathematics="Pengiraan peratus hasil (% yield) dan analisis regresi.",
            ),
        },
        variables_and_graph_id={
            AgeAdaptiveLevelEnum.SD_ELEMENTARY: None,
            AgeAdaptiveLevelEnum.SMP_LOWER_SEC: None,
            AgeAdaptiveLevelEnum.SMA_UPPER_SEC: ScientificVariablesAndGraphSchemaDTO(
                formulas_latex=[
                    r"\text{NaHCO}_3(s) + \text{CH}_3\text{COOH}(aq) \rightarrow \text{CH}_3\text{COONa}(aq) + \text{H}_2\text{O}(l) + \text{CO}_2(g)",
                    r"n_{\text{CO}_2} = \frac{m_{\text{NaHCO}_3}}{M_r(\text{NaHCO}_3)}",
                    r"V_{\text{CO}_2} = \frac{n \cdot R \cdot T}{P}",
                ],
                independent_variable="Massa Soda Kue NaHCO3 (gram / sendok takar)",
                dependent_variable="Volume / Keliling Balon Gas CO2 (cm)",
                control_variables=[
                    "Volume Cuka Dapur CH3COOH 5% (100 ml)",
                    "Ukuran botol plastik PET 600ml",
                    "Suhu awal larutan pada suhu ruang",
                ],
                x_axis_label="Massa Soda Kue NaHCO3 (gram)",
                y_axis_label="Keliling Balon CO2 (cm)",
                expected_trend=ExpectedGraphTrendEnum.LINEAR_PROPORTIONAL,
            ),
            AgeAdaptiveLevelEnum.HIGHER_ED_UNI: ScientificVariablesAndGraphSchemaDTO(
                formulas_latex=[
                    r"\text{NaHCO}_3(s) + \text{CH}_3\text{COOH}(aq) \rightarrow \text{CH}_3\text{COONa}(aq) + \text{H}_2\text{O}(l) + \text{CO}_2(g)",
                    r"\left(P_{\text{atm}} + \Delta P_{\text{lateks}}\right) V = n_{\text{CO}_2} R T",
                    r"\%\text{Yield} = \frac{V_{\text{eksperimen}}}{V_{\text{teoritis}}} \times 100\%",
                ],
                independent_variable="Mol Natrium Bikarbonat n_NaHCO3 (mol)",
                dependent_variable="Volume Gas CO2 Terukur V (liter) & Perubahan Suhu Delta T (C)",
                control_variables=[
                    "Konsentrasi dan volume asam asetat CH3COOH 5% (100 ml)",
                    "Tekanan atmosfer ruang praktikum P_atm",
                ],
                x_axis_label="Massa NaHCO3 (gram)",
                y_axis_label="Volume Gas CO2 (mL)",
                expected_trend=ExpectedGraphTrendEnum.LINEAR_PROPORTIONAL,
            ),
        },
        variables_and_graph_my={
            AgeAdaptiveLevelEnum.SD_ELEMENTARY: None,
            AgeAdaptiveLevelEnum.SMP_LOWER_SEC: None,
            AgeAdaptiveLevelEnum.SMA_UPPER_SEC: ScientificVariablesAndGraphSchemaDTO(
                formulas_latex=[
                    r"\text{NaHCO}_3(p) + \text{CH}_3\text{COOH}(ak) \rightarrow \text{CH}_3\text{COONa}(ak) + \text{H}_2\text{O}(ce) + \text{CO}_2(g)",
                    r"n_{\text{CO}_2} = \frac{m_{\text{NaHCO}_3}}{JMR(\text{NaHCO}_3)}",
                    r"V_{\text{CO}_2} = \frac{n \cdot R \cdot T}{P}",
                ],
                independent_variable="Jisim Serbuk Penaik NaHCO3 (gram)",
                dependent_variable="Lilitan Belon Gas CO2 (cm)",
                control_variables=[
                    "Isipadu Cuka Makan CH3COOH 5% (100 ml)",
                    "Saiz botol plastik 600ml",
                ],
                x_axis_label="Jisim NaHCO3 (gram)",
                y_axis_label="Lilitan Belon CO2 (cm)",
                expected_trend=ExpectedGraphTrendEnum.LINEAR_PROPORTIONAL,
            ),
            AgeAdaptiveLevelEnum.HIGHER_ED_UNI: ScientificVariablesAndGraphSchemaDTO(
                formulas_latex=[
                    r"\left(P_{\text{atm}} + \Delta P_{\text{elastik}}\right) V = n_{\text{CO}_2} R T",
                    r"\%\text{Hasil} = \frac{V_{\text{eksperimen}}}{V_{\text{teori}}} \times 100\%",
                ],
                independent_variable="Jisim NaHCO3 (gram)",
                dependent_variable="Isipadu Gas CO2 (mL)",
                control_variables=[
                    "Isipadu dan kepekatan asid asetik 5%",
                ],
                x_axis_label="Jisim NaHCO3 (gram)",
                y_axis_label="Isipadu Gas CO2 (mL)",
                expected_trend=ExpectedGraphTrendEnum.LINEAR_PROPORTIONAL,
            ),
        },
        steps_id=[
            {
                "step_number": 1,
                "instruction": "Tuangkan 100 ml cuka dapur ke dalam botol plastik 600ml, lalu masukkan 2 sendok teh soda kue ke dalam balon karet yang masih kempis.",
                "requires_vision_verification": True,
                "vision_verification_prompt": "Pastikan cuka berada di dasar botol plastik dan mulut balon sudah terpasang rapat menutup leher botol.",
                "default_ar_overlay": AROverlaySimulationDTO(
                    overlay_type=AROverlayTypeEnum.MOLECULAR_REACTION,
                    caption_local="Simulasi AR: Ion H+ dari asam asetat bersiap bereaksi dengan gugus bikarbonat HCO3- membentuk asam karbonat yang terurai menjadi H2O dan gas CO2.",
                    vector_paths=[
                        ARVectorPathDTO(
                            label="Pencampuran Reaktan NaHCO3 -> CH3COOH",
                            start_x_norm=0.50,
                            start_y_norm=0.28,
                            end_x_norm=0.50,
                            end_y_norm=0.68,
                            color_hex="#A855F7",
                            animation_style=ARAnimationStyleEnum.FLOWING_PARTICLES,
                        )
                    ],
                ),
            },
            {
                "step_number": 2,
                "instruction": "Angkat bagian perut balon sehingga bubuk soda kue jatuh ke dalam cuka di dasar botol, amati pembentukan gelembung gas CO2 yang memompa balon, dan ukur keliling balon.",
                "requires_vision_verification": True,
                "vision_verification_prompt": "Pastikan balon mengembang oleh gas CO2 di atas mulut botol.",
                "default_ar_overlay": AROverlaySimulationDTO(
                    overlay_type=AROverlayTypeEnum.FLUID_PRESSURE,
                    caption_local="Simulasi AR: Molekul gas CO2 bergerak naik meningkatkan tekanan internal (P = nRT/V) dan mendorong dinding elastis balon ke segala arah.",
                    vector_paths=[
                        ARVectorPathDTO(
                            label="Aliran Molekul Gas CO2 Naik",
                            start_x_norm=0.50,
                            start_y_norm=0.70,
                            end_x_norm=0.50,
                            end_y_norm=0.22,
                            color_hex="#00E5FF",
                            animation_style=ARAnimationStyleEnum.FLOWING_PARTICLES,
                        ),
                        ARVectorPathDTO(
                            label="Tekanan Ekspansi Membran Balon",
                            start_x_norm=0.50,
                            start_y_norm=0.22,
                            end_x_norm=0.72,
                            end_y_norm=0.18,
                            color_hex="#22C55E",
                            animation_style=ARAnimationStyleEnum.PRESSURE_WAVE,
                        ),
                    ],
                ),
            },
        ],
        steps_my=[
            {
                "step_number": 1,
                "instruction": "Tuangkan 100 ml cuka makan ke dalam botol plastik 600ml, dan masukkan 2 sudu kecil serbuk penaik ke dalam belon getah.",
                "requires_vision_verification": True,
                "vision_verification_prompt": "Pastikan cuka berada di dalam botol dan mulut belon dipasang rapat pada leher botol.",
                "default_ar_overlay": AROverlaySimulationDTO(
                    overlay_type=AROverlayTypeEnum.MOLECULAR_REACTION,
                    caption_local="Simulasi AR: Tindak balas antara ion H+ (asid asetik) dan HCO3- (natrium bikarbonat).",
                    vector_paths=[
                        ARVectorPathDTO(
                            label="Aliran Reaktan NaHCO3 -> CH3COOH",
                            start_x_norm=0.50,
                            start_y_norm=0.28,
                            end_x_norm=0.50,
                            end_y_norm=0.68,
                            color_hex="#A855F7",
                            animation_style=ARAnimationStyleEnum.FLOWING_PARTICLES,
                        )
                    ],
                ),
            },
            {
                "step_number": 2,
                "instruction": "Angkat belon supaya serbuk penaik jatuh ke dalam cuka, perhatikan pengembangan belon oleh gas CO2 dan ukur lilitan belon.",
                "requires_vision_verification": True,
                "vision_verification_prompt": "Pastikan belon mengembang di atas botol plastik.",
                "default_ar_overlay": AROverlaySimulationDTO(
                    overlay_type=AROverlayTypeEnum.FLUID_PRESSURE,
                    caption_local="Simulasi AR: Gas CO2 terbebas meningkatkan tekanan dalaman belon mengikut persamaan PV = nRT.",
                    vector_paths=[
                        ARVectorPathDTO(
                            label="Aliran Gas CO2 Naik",
                            start_x_norm=0.50,
                            start_y_norm=0.70,
                            end_x_norm=0.50,
                            end_y_norm=0.22,
                            color_hex="#00E5FF",
                            animation_style=ARAnimationStyleEnum.FLOWING_PARTICLES,
                        )
                    ],
                ),
            },
        ],
        reflection_questions_id=[
            {
                "question_id": "q-chem-1",
                "prompt": "Gas apakah yang terbentuk dari reaksi antara cuka dapur (CH3COOH) dan soda kue (NaHCO3) sehingga mampu mengembangkan balon?",
                "options": [
                    "Gas Karbon Dioksida (CO2)",
                    "Gas Klorin (Cl2)",
                    "Gas Helium (He)",
                    "Gas Nitrogen Dioksida (NO2)",
                ],
                "correct_index": 0,
                "explanation": "Reaksi asam asetat dengan natrium bikarbonat menghasilkan asam karbonat yang langsung terurai menjadi air (H2O) dan gas karbon dioksida (CO2).",
            }
        ],
        reflection_questions_my=[
            {
                "question_id": "q-chem-1",
                "prompt": "Apakah gas yang terbebas hasil tindak balas antara cuka makan dan serbuk penaik yang mengembangkan belon?",
                "options": [
                    "Gas Karbon Dioksida (CO2)",
                    "Gas Klorin (Cl2)",
                    "Gas Helium (He)",
                    "Gas Hidrogen (H2)",
                ],
                "correct_index": 0,
                "explanation": "Tindak balas asid asetik dan natrium bikarbonat membebaskan gas karbon dioksida (CO2).",
            }
        ],
    ),
}
