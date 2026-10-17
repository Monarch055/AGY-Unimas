req:
/grill-me bikin kayak model chat (Fitur 'Tanya Lab AI' — Conversational Multimodal STEM Tutor)

initial_plan:
1. Penempatan Antarmuka: Menyediakan halaman/tab navigasi khusus 'Tanya Lab AI' di `apps/web`.
2. Kemampuan Input: Multimodal (Teks pesan + Lampiran foto kamera bahan laboratorium/lingkungan sekitar) + streaming respon langsung via SSE (`text/event-stream`).
3. Penyimpanan Riwayat Percakapan: Hybrid Offline-First (riwayat chat tersimpan di IndexedDB browser untuk dibaca offline, dan disinkronkan ke PostgreSQL/Redis via `services/core-api` saat online).
4. Tone & Scaffolding: Adaptif otomatis berdasarkan Level Usia (`SD_ELEMENTARY`, `SMP_LOWER_SEC`, `SMA_UPPER_SEC`, `HIGHER_ED_UNI`) dan Kurikulum (`ID_KURIKULUM_MERDEKA` vs `MY_KSSR`/`MY_KSSM`).
5. Format Rendering: Markdown terstruktur dengan formula matematika/fisika LaTeX (KaTeX).
6. Offline / No API Key Handling: Tampilkan peringatan 'Koneksi Internet Diperlukan' jika perangkat offline atau GEMINI_API_KEY belum dikonfigurasi.
7. Docs-First Covenant:
   - Buat `docs/features/FEAT-003-tanya-lab-ai-conversational-tutor.md` dan daftarkan di `docs/features/README.md`.
   - Update `contracts/api/openapi.yaml` dan `packages/shared-types`.
   - Implementasi di `services/ai-agent`, `services/core-api`, dan `apps/web`.
   - Verifikasi melalui `make test` dan push ke `origin/main`.

revision:
- Review Gate 3: User explicitly directed: "CUMAN PAKAI ADK, PAKAI UINYA ADK BUKAN BIKIN UI SENDIRI, setelah itu lempar ke docker".
- Do NOT build a custom chat UI in React/Next.js (`ChatSTEMAssistant.tsx` removed).
- Use the official Google ADK built-in Web UI (`google.adk.cli web` serving `/dev-ui/`).
- Define the official Google ADK root agent `agents/rekasains/agent.py` exposing STEM tools (`check_chemical_safety`, `recommend_stem_experiments`, `get_formula_and_variables`).
- Link directly to the official Google ADK Web UI from the web app header (`http://localhost:8081/dev-ui/`).
- Proxy Google ADK Dev UI routes in Caddy reverse proxy (`/dev-ui/*`, `/apps/*`, `/dev/*`, `/run*`, `/list-apps*`).
- Containerize and deploy the full stack to Docker via `docker compose up --build -d`.

final_plan:
- Step 1: Remove custom React chat component `ChatSTEMAssistant.tsx` and restore clean 4-layer STEM Lab UI in `apps/web/src/app/page.tsx` with top link to Google ADK Web UI.
- Step 2: Create official Google ADK agent definition `services/ai-agent/agents/rekasains/agent.py` exporting `root_agent` with RekaSains STEM tools and safety guardrails.
- Step 3: Configure `services/ai-agent/requirements.txt` (`google-adk>=2.12.0`) and `services/ai-agent/Dockerfile` (copy `agents`, update healthcheck, set CMD to `["python", "-m", "google.adk.cli", "web", "--host", "0.0.0.0", "--port", "8081", "agents"]`).
- Step 4: Configure `deployments/proxy/Caddyfile` to reverse proxy `/dev-ui*`, `/list-apps*`, `/apps/*`, `/dev/*`, `/run*` to `ai-agent:8081`.
- Step 5: Update automated tests in `apps/web/tests/web-engine.test.mjs` to assert Google ADK Web UI integration and `root_agent`.
- Step 6: Verify all monorepo test suites (36 Node tests + 15 Python tests — 100% PASS).
- Step 7: Build and deploy containers to Docker via `docker compose up --build -d` and verify all containers are running and healthy.
- Step 8: Update audit artifacts (`plan.md`, `result.md`), `AGENTS.md`, `docs/context/06-CURRENT-STATE.md`, commit and push to `origin/main`.
