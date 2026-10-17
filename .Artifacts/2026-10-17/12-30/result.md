# Result: Docker Layer Caching & Build Optimization for `apps/web`

> Session: `2026-10-17/12-30`
> Question: *"why is there run npm install when i docker compose up --build?"*

---

## 1. Executive Summary

When running `docker compose up --build`, Docker builds the client application (`apps/web`) inside a clean Alpine Linux container image (`node:22-alpine`). It executes `npm install` for two primary reasons:
1. **Container Isolation & Cross-Platform Binary Integrity:** The container operates in an isolated Linux environment that must not inherit the host machine's `node_modules` (avoiding host OS binary conflicts, such as Windows `.node` binaries running on Alpine Linux).
2. **Next.js Production Build Dependency:** The Next.js framework requires dependencies (`react`, `next`, `tailwindcss`, etc.) to compile TypeScript and bundle the PWA during the build stage (`npm run build`).

### The Optimization: Docker Layer Caching

Previously, `COPY apps/web ./apps/web` was placed **before** `RUN npm install`. Because source code changes invalidate subsequent Docker cache layers, `npm install` had to re-download all packages on every build.

We implemented **Docker Layer Caching**:
- `.dockerignore` was created to exclude host `node_modules`, `.next`, `.git`, `.venv`, and temporary files from the build context.
- `apps/web/Dockerfile` now copies **only** `package.json` manifests first, runs `npm install`, and **then** copies the source code.
- **Outcome:** `npm install` is now cached permanently by Docker. Code changes in `apps/web` now skip `npm install` completely and build in seconds.

---

## 2. Modified & Created Files

| File Path | Description |
|---|---|
| `.dockerignore` | Prevents local `node_modules`, `.next`, `.git`, `.venv`, `.Artifacts` from polluting the Docker build context. |
| `apps/web/Dockerfile` | Optimized multi-stage build with dependency manifest separation for Docker layer caching. |
| `package-lock.json` | Deterministic lockfile across Docker builds and local environments. |
| `.Artifacts/2026-10-17/12-30/*` | Audit trail artifacts (`plan.md` + `result.md`). |

---

## 3. Verification
- `docker compose config --quiet` passed (exit code 0).
- `make test` executed all 48 test suites with 100% pass rate.
