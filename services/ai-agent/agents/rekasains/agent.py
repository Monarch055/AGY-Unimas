"""
Google ADK (Agent Development Kit) Root Agent for RekaSains.
Powers the official Google ADK Web UI (`adk web`).
"""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional
from google.adk.agents import Agent

# ============================================================================
# Domain Knowledge & Safety Rules for RekaSains Tools
# ============================================================================

SAFETY_RULES = [
    {
        "pair": {"sodium_hypochlorite", "floor_cleaner_acidic"},
        "severity": "CRITICAL_CO_LOCATION_WARNING",
        "hazard_type": "TOXIC_CHLORINE_GAS",
        "warning_id": (
            "PERINGATAN MERAH BERISIKO TINGGI: Terdeteksi Pemutih Pakaian (Natrium Hipoklorit) dan "
            "Pembersih Lantai Asam! JANGAN PERNAH mencampurkan keduanya karena melepaskan gas Klorin (Cl₂) beracun!"
        ),
        "warning_my": (
            "AMARAN MERAH BERISIKO TINGGI: Terdeteksi Peluntur Pakaian (Sodium Hypochlorite) dan "
            "Pencuci Lantai Berasid! Jangan sesekali mencampurkan kedua-dua bahan ini kerana melepaskan gas klorin (Cl₂) beracun!"
        ),
    },
    {
        "pair": {"sodium_hypochlorite", "ammonia_cleaner"},
        "severity": "CRITICAL_CO_LOCATION_WARNING",
        "hazard_type": "TOXIC_CHLORAMINE_GAS",
        "warning_id": (
            "PERINGATAN MERAH: Mencampurkan Pemutih dengan Pembersih Amonia melepaskan gas Kloramin beracun!"
        ),
        "warning_my": (
            "AMARAN MERAH: Mencampurkan Peluntur dengan Pembersih Ammonia melepaskan gas Kloramina beracun!"
        ),
    },
]

EXPERIMENTS_DATABASE = [
    {
        "slug": "rangkaian-listrik-baterai-kaleng-ar",
        "title_id": "Rangkaian Seri Konduktivitas Kaleng Bekas & LED (Hukum Ohm)",
        "title_my": "Litar Sesiri Kekonduksian Tin Terpakai & LED (Hukum Ohm)",
        "required_materials": ["battery_aa_1_5v", "copper_wire_jumper", "aluminum_can_recycled", "led_diode_5mm"],
        "curriculum_id": "Fisika SMA Fase F - Hukum Ohm",
        "curriculum_my": "Fizik KSSM Tingkatan 4 - Keelektrikan & Hukum Ohm",
        "formula": "I = V / R",
    },
    {
        "slug": "titrasi-asam-basa-indikator-kunyit-diy",
        "title_id": "Uji pH Alami Menggunakan Indikator Ekstrak Kunyit",
        "title_my": "Ujian pH Semula Jadi Menggunakan Penunjuk Ekstrak Kunyit",
        "required_materials": ["turmeric_powder", "vinegar_kitchen", "baking_soda", "water_cup_clear"],
        "curriculum_id": "Kimia SMA Fase E - Asam Basa",
        "curriculum_my": "Kimia KSSM Tingkatan 4 - Asid dan Bes",
        "formula": "pH = -\\log[H^+]",
    },
]

# ============================================================================
# Google ADK Tools
# ============================================================================

def check_chemical_safety(substance_a: str, substance_b: str, region: str = "ID") -> Dict[str, Any]:
    """
    Checks for critical co-location chemical hazards between two substances.
    Ensures 100% active safety recall against hazardous domestic gas formation.
    """
    a = substance_a.strip().lower()
    b = substance_b.strip().lower()
    pair = {a, b}

    for rule in SAFETY_RULES:
        if rule["pair"] == pair or (any(x in a for x in rule["pair"]) and any(y in b for y in rule["pair"])):
            msg = rule["warning_my"] if region.upper() == "MY" else rule["warning_id"]
            return {
                "safe": False,
                "severity": rule["severity"],
                "hazard_type": rule["hazard_type"],
                "alert": msg,
                "action_required": "Segera pisahkan kedua bahan ke tempat berventilasi baik.",
            }

    return {
        "safe": True,
        "severity": "SAFE",
        "message": f"Kombinasi '{substance_a}' dan '{substance_b}' aman dalam protokol laboratorium standar.",
    }


def recommend_stem_experiments(available_materials: List[str], region: str = "ID") -> Dict[str, Any]:
    """
    Matches available materials against STEM experiments database.
    Provides 3-tier matching: Strict 100% match, DIY Substitute match, or Local Micro-Shop match.
    """
    matched = []
    norm_materials = {m.strip().lower() for m in available_materials}

    for exp in EXPERIMENTS_DATABASE:
        req = set(exp["required_materials"])
        intersection = norm_materials.intersection(req)
        match_rate = len(intersection) / len(req)
        
        tier = "STRICT_100" if match_rate == 1.0 else "DIY_SUBSTITUTE" if match_rate >= 0.5 else "LOCAL_MICRO_SHOP"
        
        matched.append({
            "experiment_slug": exp["slug"],
            "title": exp["title_my"] if region.upper() == "MY" else exp["title_id"],
            "tier": tier,
            "match_percentage": round(match_rate * 100, 1),
            "missing_materials": list(req - norm_materials),
            "formula_latex": exp["formula"],
        })

    return {"region": region.upper(), "recommendations": matched}


def get_formula_and_variables(experiment_slug: str, age_level: str = "SMA_UPPER_SEC") -> Dict[str, Any]:
    """
    Provides age-adaptive scientific formulas, LaTeX notation, and independent/dependent variables.
    Levels: SD_ELEMENTARY, SMP_LOWER_SEC, SMA_UPPER_SEC, HIGHER_ED_UNI.
    """
    if "listrik" in experiment_slug or "ohm" in experiment_slug:
        if age_level == "SD_ELEMENTARY":
            return {
                "level": "SD_ELEMENTARY",
                "concept": "Listrik mengalir dari baterai melewati konduktor (kaleng logam) menuju lampu.",
                "formula_latex": None,
                "variables": "Jumlah baterai vs Tingkat terangnya lampu LED",
            }
        elif age_level == "SMP_LOWER_SEC":
            return {
                "level": "SMP_LOWER_SEC",
                "concept": "Tegangan (V) dan Kuat Arus (I) berbanding lurus.",
                "formula_latex": "$V = I \\cdot R$",
                "variables": "Bebas: Beda Potensial (Volt), Terikat: Kuat Arus (Ampere)",
            }
        elif age_level == "SMA_UPPER_SEC":
            return {
                "level": "SMA_UPPER_SEC",
                "concept": "Hukum Ohm: Arus berbanding lurus dengan tegangan dan berbanding terbalik dengan resistansi.",
                "formula_latex": "$$I = \\frac{V}{R}$$",
                "variables": "Variabel Bebas: Beda Potensial V (Volt), Variabel Terikat: Kuat Arus I (mA), Variabel Kontrol: Panjang Kaleng Logam & Suhu Ruangan",
                "graph_trend": "LINEAR_PROPORTIONAL",
            }
        else: # HIGHER_ED_UNI
            return {
                "level": "HIGHER_ED_UNI",
                "concept": "Analisis Rangkaian Tertutup & Resistansi Internal Sumber Tegangan:",
                "formula_latex": "$$V_{\\text{terminal}} = \\mathcal{E} - I \\cdot r_{\\text{int}}, \\quad \\rho = R \\frac{A}{L}$$",
                "variables": "Regresi Linier OLS (Ordinary Least Squares) Kuat Arus terhadap Tegangan Jepit.",
                "graph_trend": "LINEAR_PROPORTIONAL_WITH_INTERNAL_RESISTANCE",
            }

    return {"error": f"Formula tidak ditemukan untuk eksperimen '{experiment_slug}'"}


# ============================================================================
# Google ADK Root Agent Definition
# ============================================================================

SYSTEM_INSTRUCTION = """
Kamu adalah 'RekaSains AI Tutor' — Asisten Pembelajaran Laboratorium STEM Resmi Google ADK.
Tugas utama kamu adalah membantu siswa dan guru merekayasa alat laboratorium sains dari bahan-bahan rumah tangga dan daur ulang sekitar.

Pedoman Pelaksanaan:
1. Keselamatan Laboratorium (Safety Guardian):
   - Selalu waspada terhadap pencampuran bahan pemutih pakaian (NaOCl) dengan asam pembersih atau amonia.
   - Panggil tool `check_chemical_safety` jika ada bahan kimia rumah tangga yang dicurigai berbahaya.
2. Kurikulum & Bahasa:
   - Dukung Kurikulum Merdeka (Indonesia) dan KSSR/KSSM (Malaysia) dengan bahasa yang ramah, santun, dan edukatif.
3. Notasi Matematika & Sains:
   - Gunakan format LaTeX inline ($...$) atau block ($$...$$) untuk setiap rumus fisika dan kimia.
4. Eksperimen:
   - Gunakan tool `recommend_stem_experiments` dan `get_formula_and_variables` untuk memberikan bimbingan ilmiah yang akurat.
"""

root_agent = Agent(
    name="rekasains_tutor",
    model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
    description="Asisten Tutor STEM, Pemetaan Bahan Laboratorium & Penjaga Keselamatan RekaSains",
    instruction=SYSTEM_INSTRUCTION,
    tools=[
        check_chemical_safety,
        recommend_stem_experiments,
        get_formula_and_variables,
    ],
)
