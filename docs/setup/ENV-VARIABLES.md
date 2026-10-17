# Environment Variables Master Dictionary — RekaSains

> **Configuration Guide:** Reference for all required environment variables across `apps/web`, `services/core-api`, and `services/ai-agent`.
> Copy this file to `.env` in the project root.

---

```ini
# ==============================================================================
# Environment Configuration for RekaSains
# ==============================================================================

# Application Environment
APP_ENV=development
APP_PORT=8080
AI_AGENT_PORT=8081
LOG_LEVEL=debug
DEFAULT_REGION=ID

# Frontend Public Config (`apps/web`)
NEXT_PUBLIC_API_URL=http://localhost:8080/v1
NEXT_PUBLIC_APP_NAME=RekaSains

# Internal Service-to-Service Discovery (Direct REST & SSE)
AI_AGENT_INTERNAL_URL=http://127.0.0.1:8081/ai/v1
CORE_API_INTERNAL_URL=http://127.0.0.1:8080/v1
INTERNAL_SERVICE_TIMEOUT_SEC=30

# Google ADK & Gemini Configuration (`services/ai-agent`)
GOOGLE_GENAI_USE_VERTEXAI=FALSE
GEMINI_API_KEY=your-gemini-api-key-here
ADK_VISION_MODEL=gemini-2.5-flash
ADK_REASONING_MODEL=gemini-2.5-flash

# Database (PostgreSQL 16 - Owned by `services/core-api`)
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=rekasains
DB_SSLMODE=disable

# Cache (Valkey / Redis 7.2)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT / Security Secrets
JWT_SECRET=super-secret-development-key-change-me-in-production
JWT_EXPIRY_HOURS=24
```
