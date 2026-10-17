"""
Layer 3 (Google ADK Sub-Agent #7): ConversationalTutorAgent.
Powers 'Tanya Lab AI' — Conversational Multimodal STEM Tutor (FEAT-003).
Uses pure Google GenAI / ADK (`from google import genai`).
"""

from __future__ import annotations

import base64
import json
import logging
from typing import AsyncGenerator, List, Optional

from app.domain.models import (
    AgeAdaptiveLevelEnum,
    ChatStreamChunkDTO,
    ChatStreamRequest,
    CurriculumCodeEnum,
    RegionCode,
)
from app.infrastructure.config import settings

logger = logging.getLogger("rekasains.ai-agent.tutor")

try:
    from google import genai
    from google.genai import types
    HAS_GOOGLE_GENAI_SDK = True
except ImportError:
    HAS_GOOGLE_GENAI_SDK = False


def build_stem_tutor_system_prompt(
    region: RegionCode,
    age_adaptive_level: AgeAdaptiveLevelEnum,
    curriculum_code: CurriculumCodeEnum,
) -> str:
    """Constructs age-adaptive pedagogical system prompt for STEM Chat Tutor."""
    region_label = "Indonesia (Kurikulum Merdeka)" if region == RegionCode.ID else "Malaysia (KSSR/KSSM)"

    if age_adaptive_level == AgeAdaptiveLevelEnum.SD_ELEMENTARY:
        tone_instruction = (
            "Audiens kamu adalah murid Sekolah Dasar (SD/Rendah). Gunakan bahasa yang ramah, antusias, "
            "dan hangat seperti guru sains yang menyenangkan. Jelaskan fenomena menggunakan analogi benda "
            "sehari-hari yang mudah dibayangkan. JANGAN gunakan rumus kalkulus diferensial atau simbol matematika "
            "yang rumit. Tekankan keselamatan dan ajak mereka mengamati dengan panca indera."
        )
    elif age_adaptive_level == AgeAdaptiveLevelEnum.SMP_LOWER_SEC:
        tone_instruction = (
            "Audiens kamu adalah siswa SMP/Menengah Rendah. Gunakan penjelasan ilmiah yang terstruktur, "
            "kenalkan konsep dasar seperti gaya, energi, dan materi. Sertakan rumus fisika/kimia dasar sederhana "
            "jika relevan menggunakan notasi LaTeX inline ($...$) dan jelaskan makna fisisnya."
        )
    elif age_adaptive_level == AgeAdaptiveLevelEnum.SMA_UPPER_SEC:
        tone_instruction = (
            "Audiens kamu adalah siswa SMA/Menengah Atas (Fase E/F atau Tingkatan 4/5). Berikan analisis kuantitatif "
            "yang mendalam. Sertakan formulasi matematis lengkap menggunakan notasi LaTeX ($...$ untuk inline dan "
            "$$...$$ untuk persamaan blok terpisah). Definisikan variabel bebas, terikat, dan kontrol eksperimen."
        )
    else:  # HIGHER_ED_UNI
        tone_instruction = (
            "Audiens kamu adalah mahasiswa universitas atau praktisi sains tinggi. Gunakan standar akademis tinggi, "
            "turunan diferensial/integral, analisis galat eksperimental, dan formulasi matematis ketat dalam LaTeX ($$...$$)."
        )

    safety_mandate = (
        "ATURAN KESELAMATAN MUTLAK (SAFETY GUARDIAN):\n"
        "Jika siswa menanyakan atau menyarankan mencampur bahan pemutih (Sodium Hypochlorite / NaOCl) dengan "
        "pembersih lantai asam (HCl) atau pembersih amonia (NH3), KAMU WAJIB MENOLAK dan memberikan PERINGATAN "
        "MERAH TEGAS bahwa reaksi tersebut menghasilkan gas beracun (Klorin Cl2 atau Kloramin NH2Cl) yang sangat berbahaya."
    )

    return (
        f"Kamu adalah 'Tanya Lab AI', Asisten Tutor Sains Interaktif dari platform RekaSains untuk {region_label}.\n\n"
        f"Pedoman Pedagogis:\n{tone_instruction}\n\n"
        f"{safety_mandate}\n\n"
        "Format teks dalam Markdown rapi. Setiap rumus fisika/kimia WAJIB ditulis dengan KaTeX/LaTeX ($ atau $$)."
    )


class ConversationalTutorAgent:
    """Google ADK Sub-Agent #7: Conversational Multimodal STEM Tutor."""

    agent_name = "ConversationalTutorAgent"
    model_name = "gemini-2.5-flash"

    async def stream_chat_response(
        self, req: ChatStreamRequest
    ) -> AsyncGenerator[str, None]:
        """
        Streams chat chunks formatted as Server-Sent Events (SSE).
        Yields strings formatted as: `data: {"chunk": "...", "is_final": bool}\n\n`
        """
        user_msg = req.message.strip()
        lower_msg = user_msg.lower()

        # 1. Proactive Safety Guardian Interception
        if ("pemutih" in lower_msg or "peluntur" in lower_msg or "bleach" in lower_msg) and (
            "asam" in lower_msg or "acid" in lower_msg or "amonia" in lower_msg or "porstex" in lower_msg
        ):
            warning_msg = (
                "⚠️ **PERINGATAN BAHAYA KESELAMATAN (KONTAMINASI GAS BERACUN):**\n\n"
                "Dilarang keras mencampurkan **Pemutih Pakaian (NaOCl)** dengan **Pembersih Asam/Amonia**! "
                "Reaksi kimia tersebut akan melepaskan gas beracun ($Cl_2$ atau $NH_2Cl$) yang dapat merusak "
                "saluran pernapasan. Segera jauhkan kedua bahan dan pastikan ventilasi ruangan terbuka."
            )
            yield f"data: {json.dumps({'chunk': warning_msg, 'is_final': False})}\n\n"
            yield f"data: {json.dumps({'chunk': '', 'is_final': True, 'session_id': req.session_id})}\n\n"
            return

        # 2. Test Simulation Mode (when api_key == "test-key" or test prefix used)
        api_key = settings.gemini_api_key.strip()
        if api_key == "test-key" or user_msg.lower().startswith("test:"):
            simulated_response = self._generate_simulated_pedagogical_response(req)
            words = simulated_response.split(" ")
            for w in words:
                yield f"data: {json.dumps({'chunk': w + ' ', 'is_final': False})}\n\n"
            yield f"data: {json.dumps({'chunk': '', 'is_final': True, 'session_id': req.session_id})}\n\n"
            return

        # 3. Check Online API Key Configuration (User constraint: Only active when online/configured)
        if not api_key:
            notice = (
                "Koneksi Internet dan konfigurasi `GEMINI_API_KEY` Diperlukan untuk mengakses layanan langsung "
                "Tanya Lab AI. Riwayat pesan sebelumnya tetap tersimpan secara aman di perangkat lokal Anda."
            )
            yield f"data: {json.dumps({'chunk': notice, 'is_final': False})}\n\n"
            yield f"data: {json.dumps({'chunk': '', 'is_final': True, 'session_id': req.session_id, 'error': 'ONLINE_API_KEY_REQUIRED'})}\n\n"
            return

        # 4. Pure Google GenAI / ADK Streaming
        if HAS_GOOGLE_GENAI_SDK:
            try:
                system_prompt = build_stem_tutor_system_prompt(
                    req.region, req.age_adaptive_level, req.curriculum_code
                )
                client = genai.Client(api_key=api_key)

                contents: list[object] = []
                if req.image_base64 and req.mime_type:
                    clean_b64 = req.image_base64.split(",")[-1]
                    raw_bytes = base64.b64decode(clean_b64)
                    contents.append(types.Part.from_bytes(data=raw_bytes, mime_type=req.mime_type))
                contents.append(user_msg)

                response = client.models.generate_content_stream(
                    model=settings.gemini_model,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        temperature=0.7,
                    ),
                )
                for chunk in response:
                    text_chunk = getattr(chunk, "text", "") or ""
                    if text_chunk:
                        yield f"data: {json.dumps({'chunk': text_chunk, 'is_final': False})}\n\n"

                yield f"data: {json.dumps({'chunk': '', 'is_final': True, 'session_id': req.session_id})}\n\n"
                return
            except Exception as e:
                logger.error(f"Google GenAI SDK streaming error: {e}", exc_info=True)
                yield f"data: {json.dumps({'chunk': f'Terjadi kendala koneksi AI: {str(e)}', 'is_final': False})}\n\n"
                yield f"data: {json.dumps({'chunk': '', 'is_final': True, 'session_id': req.session_id, 'error': str(e)})}\n\n"
                return

        # Fallback message if SDK is somehow missing
        yield f"data: {json.dumps({'chunk': 'Layanan Google GenAI SDK tidak tersedia di runtime.', 'is_final': False})}\n\n"
        yield f"data: {json.dumps({'chunk': '', 'is_final': True, 'session_id': req.session_id, 'error': 'SDK_UNAVAILABLE'})}\n\n"

    def _generate_simulated_pedagogical_response(self, req: ChatStreamRequest) -> str:
        """Generates deterministic responses for unit testing and offline demo verification."""
        is_my = req.region == RegionCode.MY
        if req.age_adaptive_level == AgeAdaptiveLevelEnum.SD_ELEMENTARY:
            return (
                "Halo Adik Peneliti Hebat! Kaleng minuman aluminium itu seperti jalan raya bebas hambatan untuk listrik. "
                "Baterai mendorong aliran listrik kecil melewati kaleng sampai ke lampu LED, sehingga lampu bisa menyala gembira!"
            )
        elif req.age_adaptive_level == AgeAdaptiveLevelEnum.SMP_LOWER_SEC:
            return (
                "Kaleng aluminium berfungsi sebagai konduktor karena memiliki elektron valensi bebas. Hubungan beda potensial ($V$) "
                "dan arus ($I$) berbanding lurus, sesuai rumus dasar listrik: $V = I \\cdot R$."
            )
        else:
            eq = "I = \\frac{V}{R}"
            return (
                f"Berdasarkan analisis Hukum Ohm kuantitatif, kuat arus listrik berbanding lurus dengan beda potensial:\n\n"
                f"$$\\begin{{aligned}} {eq} \\end{{aligned}}$$\n\n"
                "Aluminium memiliki resistivitas $\\rho \\approx 2.65 \\times 10^{-8}\\,\\Omega\\cdot\\text{m}$, "
                "menjadikannya konduktor yang efisien dalam rangkaian DC."
            )


conversational_tutor_agent = ConversationalTutorAgent()
