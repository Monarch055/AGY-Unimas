"""
Layer 4 (Driver): structured (Pydantic) JSON output from an OpenAI-compatible chat completions API
(configured by LLM_BASE_URL / LLM_API_KEY / LLM_MODEL).
"""

from __future__ import annotations

import base64
import binascii
import json
import logging
import re
from typing import Any, Dict, List, Optional, Type, TypeVar

import httpx
from pydantic import BaseModel, ValidationError

from app.domain.models import RegionCode
from app.infrastructure.config import settings

logger = logging.getLogger("rekasains.llm")

T = TypeVar("T", bound=BaseModel)
REQUEST_TIMEOUT_S = 90.0


class GeminiError(RuntimeError):
    """The LLM was asked for an answer and could not produce a usable one."""


class ImageInput(BaseModel):
    data: bytes
    mime_type: str


def gemini_enabled() -> bool:
    return bool(settings.llm_api_key)


def output_language(region: RegionCode) -> str:
    return "Bahasa Melayu (Malaysia)" if region == RegionCode.MY else "Bahasa Indonesia"


def decode_image(image_base64: str, mime_type: str) -> Optional[ImageInput]:
    """Returns the image only when the payload is a real JPEG/PNG/WebP (not a sample marker string)."""
    if not image_base64:
        return None
    payload = image_base64.split(",", 1)[1] if image_base64.startswith("data:") else image_base64
    try:
        raw = base64.b64decode(payload, validate=True)
    except (binascii.Error, ValueError):
        return None
    is_jpeg = raw[:3] == b"\xff\xd8\xff"
    is_png = raw[:8] == b"\x89PNG\r\n\x1a\n"
    is_webp = raw[:4] == b"RIFF" and raw[8:12] == b"WEBP"
    if not (is_jpeg or is_png or is_webp):
        return None
    return ImageInput(data=raw, mime_type=mime_type)


def _extract_json(text: str) -> str:
    """Strips markdown fences or surrounding prose some models add around the JSON object."""
    fenced = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    if fenced:
        return fenced.group(1).strip()
    start, end = text.find("{"), text.rfind("}")
    return text[start : end + 1] if start != -1 and end > start else text


def _join_stream_chunks(raw: str) -> str:
    """Some OpenAI-compatible routers always stream (SSE); concatenate the delta contents."""
    parts: List[str] = []
    for line in raw.splitlines():
        line = line.strip()
        if not line.startswith("data:"):
            continue
        data = line[len("data:") :].strip()
        if not data or data == "[DONE]":
            continue
        chunk = json.loads(data)
        for choice in chunk.get("choices", []):
            piece = (choice.get("delta") or choice.get("message") or {}).get("content")
            if piece:
                parts.append(piece)
    return "".join(parts)


def generate_structured(
    prompt: str,
    schema: Type[T],
    images: Optional[List[ImageInput]] = None,
    temperature: float = 0.4,
    model: Optional[str] = None,
) -> T:
    if not settings.llm_api_key:
        raise GeminiError("LLM_API_KEY belum diatur.")

    instructions = (
        "Jawab HANYA dengan satu objek JSON yang valid sesuai JSON Schema berikut, tanpa teks lain:\n"
        + json.dumps(schema.model_json_schema(), ensure_ascii=False)
    )
    content: List[Dict[str, Any]] = [
        {
            "type": "image_url",
            "image_url": {"url": f"data:{img.mime_type};base64,{base64.b64encode(img.data).decode()}"},
        }
        for img in images or []
    ]
    content.append({"type": "text", "text": f"{prompt}\n\n{instructions}"})

    body = {
        "model": model or settings.llm_model,
        "messages": [{"role": "user", "content": content}],
        "temperature": temperature,
        "stream": False,
        "response_format": {"type": "json_object"},
    }
    try:
        res = httpx.post(
            f"{settings.llm_base_url.rstrip('/')}/chat/completions",
            headers={"Authorization": f"Bearer {settings.llm_api_key}"},
            json=body,
            timeout=REQUEST_TIMEOUT_S,
        )
    except httpx.HTTPError as exc:
        logger.warning("LLM request failed: %s", exc)
        raise GeminiError(f"Layanan AI tidak terjangkau: {exc}") from exc

    if res.status_code >= 400:
        logger.warning("LLM HTTP %s: %s", res.status_code, res.text[:500])
        raise GeminiError(f"Layanan AI menolak permintaan (HTTP {res.status_code}).")

    try:
        if "text/event-stream" in res.headers.get("content-type", ""):
            text = _join_stream_chunks(res.text)
        else:
            text = res.json()["choices"][0]["message"]["content"] or ""
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        raise GeminiError("Respons layanan AI tidak dikenali.") from exc
    if not text.strip():
        raise GeminiError("Layanan AI mengembalikan jawaban kosong. Coba lagi.")

    try:
        return schema.model_validate_json(_extract_json(text))
    except ValidationError as exc:
        logger.warning("LLM JSON did not match schema: %s", exc)
        raise GeminiError("Jawaban AI tidak sesuai format yang diminta. Coba lagi.") from exc
