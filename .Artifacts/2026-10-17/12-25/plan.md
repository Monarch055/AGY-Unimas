req:
make the docker please

initial_plan:
1. Audit existing Dockerfiles in `apps/web`, `services/core-api`, `services/ai-agent`, and reverse proxy config in `deployments/proxy/Caddyfile`.
2. Ensure Dockerfiles compile without missing dependencies, especially monorepo packages (`@rekasains/shared-types`, `@rekasains/shared-core`) referenced in `apps/web`.
3. Configure root npm workspaces in a root `package.json` so Docker contexts can resolve shared packages seamlessly.
4. Add non-root security principles and health checks to all service Dockerfiles.
5. Validate configuration using `docker compose config` and verify all tests continue to pass.

revision:
- Docker daemon in Windows requires Docker Desktop GUI to be running on the host desktop. Since headless background shells cannot launch GUI applications directly across Windows sessions, the container files must be verified via `docker compose config`, syntax validation, and automated test execution.
- Add clear instructions for starting Docker Desktop and executing `make dev` or `docker compose up --build`.

final_plan:
1. Add root `package.json` defining npm workspaces (`packages/*`, `apps/*`) and unified scripts.
2. Refactor `apps/web/Dockerfile` to multi-stage build using workspace packages and Next.js standalone runner.
3. Harden `services/core-api/Dockerfile` with Go 1.23+ Alpine multi-stage builder, unprivileged `appuser`, and `/v1/health` check.
4. Harden `services/ai-agent/Dockerfile` with Python 3.12-slim, non-root user, `curl`, and `/health` check.
5. Fix route ordering in `deployments/proxy/Caddyfile` so `/healthz` is evaluated before the wildcard `/*` reverse proxy to `web:3000`.
6. Validate with `docker compose config` (Zero-RabbitMQ compliance verified).
7. Re-run all 48 automated test suites across the monorepo to guarantee zero regressions.
8. Update `AGENTS.md`, `docs/context/06-CURRENT-STATE.md`, record session artifacts, and push to `origin/main`.
