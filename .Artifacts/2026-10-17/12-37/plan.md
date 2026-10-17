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
- Review Gate 3: Pastikan endpoint SSE streaming mematuhi Zero-RabbitMQ Directive (Direct HTTP/REST + `text/event-stream`).
- Pastikan rendering LaTeX menggunakan parser markdown yang aman dari XSS sanitization.
- Pastikan input gambar dioptimasi ke base64 kompresi sebelum dikirim ke endpoint `/ai/v1/chat/stream`.

final_plan:
- Step 1: Tulis spesifikasi `docs/features/FEAT-003-tanya-lab-ai-conversational-tutor.md` & update `docs/features/README.md`.
- Step 2: Perbarui `contracts/api/openapi.yaml` dan tipe TypeScript di `packages/shared-types`.
- Step 3: Implementasi endpoint streaming `/ai/v1/chat/stream` di `services/ai-agent` dengan Google ADK / Gemini 2.5 Flash.
- Step 4: Implementasi migration database `004_create_chat_sessions_and_messages.sql` & sinkronisasi di `services/core-api`.
- Step 5: Implementasi komponen antarmuka 'Tanya Lab AI' di `apps/web` (`ChatSTEMAssistant.tsx`, tab navigasi, IndexedDB storage, LaTeX parser).
- Step 6: Tulis automated unit & integration test untuk endpoint chat dan rendering.
- Step 7: Jalankan `make test`, ekspor `.Artifacts/.../result.md`, update `06-CURRENT-STATE.md` & `AGENTS.md`, lalu git commit dan push ke `origin/main`.
