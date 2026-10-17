"""
Layer 4 (Driver): Gemini multimodal call that turns a workspace photo into catalog inventory items.

`detect_inventory_with_gemini` returns None when it does not apply (no API key, or the payload is
not a real image such as the UI's sample payloads), so callers can use the rule-based path.
When it does apply and Gemini fails, it raises GeminiVisionError instead of inventing data.
"""

from __future__ import annotations

import logging
import re
from typing import List, Optional

from pydantic import BaseModel, Field

from app.domain.catalog_knowledge import CANONICAL_MATERIALS
from app.domain.models import InventoryItemDTO, InventoryScanRequest, MaterialCategoryEnum, RegionCode
from app.infrastructure.config import settings
from app.infrastructure.gemini_client import (
    GeminiError,
    decode_image,
    gemini_enabled,
    generate_structured,
    output_language,
)

logger = logging.getLogger("rekasains.gemini-vision")

OTHER_SLUG = "other"
MAX_IMAGE_BYTES = 8 * 1024 * 1024


class GeminiVisionError(GeminiError):
    """Gemini was asked to analyse a real photo and could not produce a usable answer."""


class _DetectedObject(BaseModel):
    material_slug: str = Field(description="Slug dari katalog, atau 'other' jika tidak ada yang cocok.")
    label: str = Field(description="Nama singkat benda dalam bahasa lokal pengguna.")
    quantity: int = Field(ge=1, description="Jumlah benda yang terlihat.")
    confidence: float = Field(ge=0.0, le=1.0)


class _DetectionResult(BaseModel):
    objects: List[_DetectedObject]


def _build_prompt(region: RegionCode) -> str:
    catalog = "\n".join(
        f"- {slug}: {spec.name_id} / {spec.name_my}" for slug, spec in CANONICAL_MATERIALS.items()
    )
    return (
        "Kamu adalah asisten lab sains sekolah. Identifikasi benda fisik yang terlihat jelas di foto "
        "meja kerja ini yang bisa dipakai untuk eksperimen sains sederhana.\n\n"
        "Petakan setiap benda ke salah satu slug katalog berikut bila fungsinya sama:\n"
        f"{catalog}\n\n"
        f"Jika benda tidak ada di katalog, pakai material_slug '{OTHER_SLUG}'. "
        "Jangan menebak benda yang tidak terlihat. Gabungkan benda sejenis dan hitung jumlahnya. "
        "Perhatikan khusus botol pemutih, pembersih lantai, atau amonia karena berbahaya. "
        f"Tulis label dalam {output_language(region)}. Jika tidak ada benda relevan, kembalikan daftar kosong."
    )


def _other_slug(label: str) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", "_", label.lower()).strip("_")[:40]
    return f"{OTHER_SLUG}_{cleaned or 'item'}"


def detect_inventory_with_gemini(req: InventoryScanRequest) -> Optional[List[InventoryItemDTO]]:
    if not gemini_enabled():
        return None
    image = decode_image(req.image_base64, req.mime_type)
    if image is None:
        return None
    if len(image.data) > MAX_IMAGE_BYTES:
        raise GeminiVisionError("Foto terlalu besar (maksimal 8 MB).")

    try:
        parsed = generate_structured(
            _build_prompt(req.region),
            _DetectionResult,
            images=[image],
            temperature=0.1,
            model=settings.vision_model,
        )
    except GeminiError as exc:
        raise GeminiVisionError(str(exc)) from exc

    merged: dict[str, InventoryItemDTO] = {}
    for obj in parsed.objects:
        spec = CANONICAL_MATERIALS.get(obj.material_slug)
        if spec:
            slug = spec.slug
            item = InventoryItemDTO(
                material_slug=slug,
                name_local=spec.local_name(req.region),
                category=spec.category,
                quantity=obj.quantity,
                unit=spec.default_unit,
                confidence=round(obj.confidence, 2),
            )
        else:
            slug = _other_slug(obj.label)
            item = InventoryItemDTO(
                material_slug=slug,
                name_local=obj.label.strip() or "Benda lain",
                category=MaterialCategoryEnum.HOUSEHOLD_TOOL,
                quantity=obj.quantity,
                unit="pcs",
                confidence=round(obj.confidence, 2),
            )
        if slug in merged:
            prev = merged[slug]
            merged[slug] = prev.model_copy(
                update={
                    "quantity": prev.quantity + item.quantity,
                    "confidence": max(prev.confidence, item.confidence),
                }
            )
        else:
            merged[slug] = item

    logger.info("Gemini detected %d inventory items", len(merged))
    return list(merged.values())
