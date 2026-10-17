"""
Layer 4 (Infrastructure Config & Structured Logging):
Zero secret leakage & structured JSON logging.
Provides both `settings` singleton and `AgentServiceConfig`.
"""

from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass(frozen=True)
class AgentServiceConfig:
    port: int = int(os.getenv("AI_AGENT_PORT", os.getenv("PORT", "8081")))
    core_api_url: str = os.getenv("CORE_API_URL", "http://localhost:8080/v1")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    vision_model: str = os.getenv("GEMINI_VISION_MODEL", "gemini-2.5-flash")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")


settings = AgentServiceConfig()


def get_structured_logger(name: str = "rekasains.ai-agent") -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    return logger


def log_agent_event(event_type: str, **fields: object) -> None:
    logger = get_structured_logger()
    record = {
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "service": "services/ai-agent",
        "event_type": event_type,
        **fields,
    }
    logger.info(json.dumps(record))
