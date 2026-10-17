# Audit RekaSains & Rencana Revisi

> Tanggal: 2026-10-17 · Basis audit: commit `5c7afde` (HEAD). Frontend diaudit dari versi HEAD karena ada sesi AI lain (`.Artifacts/2026-10-17/12-40`) yang sedang mengedit `apps/web` saat audit berlangsung.
> Build/test **tidak dijalankan**: drive C: penuh (0 GB). Lihat bagian 4.5. Test yang ada memang tidak menguji perilaku nyata.

---

## 1. Ringkasan Satu Paragraf

Di atas kertas RekaSains adalah platform AI multi-agen (6 sub-agent Google ADK + Gemini). Kenyataannya **tidak ada satu pun panggilan ke Gemini/ADK di seluruh codebase**. Yang disebut "agent" adalah kelas Python biasa: isinya pencocokan kata kunci pada string base64 dan data hardcoded. Frontend juga punya salinan hardcoded dari semua respons. Jadi aplikasi selalu "berhasil" dan menampilkan hasil yang sama, apa pun foto yang diunggah. Bagian yang benar-benar bekerja hanya **matcher 3-tier deterministik di Go**, **aturan bahaya kimia deterministik**, dan **grafik regresi di frontend**. Dokumentasi menyatakan "Production Ready, 48/48 PASS, tidak ada tech debt", padahal test-nya kebanyakan hanya mengecek apakah string tertentu ada di file source.

---

## 2. Cara Kerja Aplikasi Saat Ini (Kenyataan, Bukan Klaim)

```
Browser (Next.js, 1 halaman: src/app/page.tsx)
  │  fetch() ke NEXT_PUBLIC_API_URL (default http://localhost:8080/v1)
  │  └─ gagal / server mati → pakai data HARDCODED di src/lib/api-client.ts (diam-diam)
  ▼
core-api (Go, net/http stdlib, BUKAN Gin)
  │  data: map in-memory (repository/seeded_store.go). Postgres TIDAK dipakai.
  │  POST ke ai-agent (timeout 3.5s)
  │  └─ gagal → fallback hardcoded di gateway/adk_gateway.go (diam-diam)
  ▼
ai-agent (Python FastAPI)
     "VisionInventoryAgent" = decode base64 → cari kata "baterai", "bleach", dst.
     Tidak ketemu → kembalikan 7 item default.
     "StepVisionAndARAgent" = selalu BENAR kecuali string berisi "wrong"/"salah".
     Tidak ada LLM, tidak ada computer vision.
```

Alur di UI:
1. Saat halaman dibuka, otomatis "scan" dengan string palsu `REKASAIN_INITIAL_SAFE_SCAN`, lalu muncul inventaris default.
2. Upload foto: base64 dikirim, tapi hasilnya tetap daftar default (tidak ada vision).
3. Tombol "Uji Bahaya" mengirim string berisi `HAZARD_BLEACH_ACID`, lalu pemutih + pembersih lantai ditambahkan dan banner merah muncul.
4. Rekomendasi 3-tier: kalau core-api hidup, hasilnya dari matcher Go yang nyata. Kalau mati, 3 kartu hardcoded.
5. Modul eksperimen, verifikasi langkah ("kamera AI"), dan laporan: semuanya template statis.
6. "PDF" = `window.open` + `window.print()` dari HTML.

---

## 3. Klaim 10 USP vs Realita

| # | Klaim | Realita | Status |
|---|---|---|---|
| 1 | Foto meja → inventaris otomatis (Vision AI) | Keyword match di base64, fallback ke daftar default. Foto asli tidak pernah dianalisis. | ❌ Palsu |
| 2 | Tier 1 STRICT_100 hanya muncul jika bahan 100% tersedia | Matcher Go nyata dan benar (`usecase/rekasains_usecases.go:178`). Tapi frontend offline/fallback selalu menampilkan kartu yang sama. | 🟡 Setengah |
| 3 | Substitusi bahan fungsional | Aturan substitusi statis di seed Go/Python. Bisa diterima sebagai data kurasi. | 🟡 Data statis |
| 4 | Toko lokal + harga Rp/RM + deep link | Harga hardcoded, link hanya pencarian Google Maps/Tokopedia generik. | 🟡 Kosmetik |
| 5 | 4 jenjang adaptif | Teks per jenjang ditulis manual untuk 1 eksperimen (frontend) / 3 eksperimen (backend). | 🟡 Statis |
| 6 | Modul sesuai Kurikulum Merdeka/KSSM | Kode kompetensi karangan (`STEM-SAINS- DASAR-01`, ada spasi typo). Tidak dipetakan ke CP/TP resmi. | ❌ Tidak tervalidasi |
| 7 | Deteksi bahaya ko-lokasi | Aturan deterministik bekerja, **tapi hanya untuk item yang sudah ada di inventaris**. Karena vision palsu, bahaya di foto asli tidak akan pernah terdeteksi. | 🟡 Logika OK, input palsu |
| 8 | AI Vision Step Checker | Frontend mengirim string `STEP_n_ASSEMBLY_SNAPSHOT`, bukan foto. Respons **selalu "Langkah benar!"**. | ❌ Palsu |
| 9 | AR overlay di atas benda nyata | Panah SVG di atas kotak gradien kosong, koordinat hardcoded. Tidak ada kamera atau anchoring. | ❌ Palsu (hanya animasi) |
| 10 | Laporan PDF + gamifikasi offline | Print HTML berjalan. Tapi foto hasil = placeholder, jawaban refleksi hardcoded, `quiz_score: 100` selalu, badge selalu sama, `client_mutation_id` dibuat dari panjang slug (`AcademicLabReportPDFGenerator.tsx:117`). | 🟡/❌ |

---

## 4. Daftar Gap & Kekurangan

### 4.1 Bug Kritis (fitur rusak meskipun semua service jalan)

| ID | Masalah | Lokasi |
|---|---|---|
| B1 | **Env var tidak cocok**: compose men-set `AI_AGENT_URL`, Go membaca `AI_AGENT_BASE_URL`. Di Docker, core-api memanggil `localhost:8081` di dalam containernya sendiri, sehingga ai-agent **tidak pernah terpanggil** dan selalu jatuh ke fallback. | `docker-compose.yml:71` vs `services/core-api/cmd/api/main.go:30` |
| B2 | **Slug eksperimen berbeda di 3 tempat**, hanya 1 dari 3 yang sama. Go: `roket-tekanan-fluida-pipa-air`, `reaksi-asam-basa-balon-soda-cuka`. Python: `roket-pneumatik-bernoulli-pipa-botol`, `reaksi-endoterm-eksoterm-asam-basa-dapur`. Frontend: `hidrodinamika-venturi-pipa-fluida`, `roket-pneumatik-reaksi-asam-basa`. Python diam-diam memakai blueprint "rangkaian listrik" kalau slug tidak dikenal. | `seeded_store.go:592,777`, `catalog_knowledge.py:804,1121`, `api-client.ts:263,301` |
| B3 | Fallback modul frontend **selalu berisi langkah rangkaian listrik**, apa pun slug-nya. Pilih "Venturi" maka judulnya Venturi, tapi langkahnya baterai & kaleng. | `api-client.ts:402-597` |
| B4 | `NEXT_PUBLIC_API_URL` di-set saat runtime di compose, padahal Next.js meng-inline-nya saat **build**. Image web tetap memakai `localhost:8080`. | `docker-compose.yml:106`, `next.config.mjs` |
| B5 | `apps/web/package.json` memakai `workspace:*`, tapi tidak ada `pnpm-workspace.yaml` atau root `package.json`. `npm install` lokal gagal. Dockerfile mengakalinya dengan menghapus dependensi lalu menyalin folder manual. | `apps/web/package.json`, `apps/web/Dockerfile` |
| B6 | Timeout gateway 3.5s. Begitu Gemini vision nyata dipasang (biasanya 3–15 s), request akan **selalu timeout dan jatuh ke data palsu**. | `adk_gateway.go:30` |
| B7 | Upload foto selalu dikirim sebagai `image/jpeg` (PNG/HEIC dari HP salah label). Foto juga tidak dikompres sebelum dikirim (bisa 5–10 MB base64) dan server tidak punya batas ukuran body. | `WorkspaceScannerAndHazardBanner.tsx`, `handlers.go` |

### 4.2 "AI Slop": Kode yang Berpura-pura

- **Nol panggilan LLM.** `google.adk.agents.LlmAgent` di-import tapi tidak pernah diinstansiasi (`adk_orchestrator.py:58`). `google-genai` ada di requirements tapi tidak dipakai.
- **Manifest berbohong**: `execution_mode` menjadi `"LIVE_GOOGLE_ADK_GEMINI"` hanya karena `GEMINI_API_KEY` terisi, padahal tidak ada panggilan (`adk_orchestrator.py:657`).
- **Perilaku "AI" dikendalikan string ajaib** di base64: `HAZARD`, `BLEACH`, `WRONG`, `INCOMPLETE`, `salah`, `belum`. Base64 foto asli berisi huruf A–Z acak, jadi secara teori bisa memicu hasil secara kebetulan.
- **Tiga implementasi paralel dari logika yang sama** (matcher, aturan bahaya, katalog): Go, Python, dan TypeScript hardcoded. Ketiganya sudah saling menyimpang (lihat B2).
- **Duplikasi di dalam ai-agent**: dua modul agent (`adk_orchestrator.py` dan `google_adk_engine.py`), dua router (`router.py` dan `api.py`) yang di-mount masing-masing di 2 prefix, dua lapis use case (`usecase/*.py` dan `workflows.py`). Ada juga subclass `CompatFastAPI` yang menulis ulang middleware stack Starlette (rapuh, tidak perlu).
- **Fallback diam-diam di semua lapisan.** User tidak pernah tahu sedang melihat data palsu. Error disembunyikan dengan `catch {}` kosong.
- **Konten penuh jargon internal di UI**: label "USP #1 & USP #7 • VisionInventoryAgent", "6-AGENT GOOGLE ADK", "10 Core USPs Active", nama severity mentah `CRITICAL_CO_LOCATION_WARNING`.
- **Data contoh personal hardcoded** di form laporan ("Budi Santoso", "ITB", "NIM 13522001").

### 4.3 Data & Backend

- **Postgres & Valkey dijalankan tapi tidak dipakai.** Migrasi SQL `001–003` ada tapi tidak pernah dieksekusi atau dibaca. Semua data hilang saat restart.
- **Tidak ada autentikasi.** User ID diambil dari header `X-User-ID` yang tidak pernah dikirim frontend, jadi semua orang adalah `student-default-001` (`handlers.go:63`).
- CORS `*` di kedua service. Python juga memakai `allow_credentials=True` + `*` (kombinasi yang tidak valid menurut spesifikasi).
- Error handler Python mengembalikan `str(exc)` ke client (bocor detail internal).
- Hanya 3 eksperimen di katalog, terlalu sedikit untuk "rekomendasi".
- `go.mod` menyatakan `go 1.23`, docs bilang 1.25+. Docs bilang Gin/pgx/sqlc, kenyataannya stdlib dan in-memory.

### 4.4 Frontend

- Satu halaman raksasa. Semua state di `page.tsx`, tanpa routing atau alur langkah. Re-scan otomatis setiap kali region/jenjang/peran berubah (menimpa inventaris yang sudah diedit user).
- Tombol "Mode Offline" hanya mengubah tampilan, tidak benar-benar memutus fetch.
- LaTeX ditampilkan sebagai teks mentah `I = \frac{V}{R}` di dalam `<code>`.
- AR viewport tidak menampilkan foto user sama sekali.
- Kuis refleksi tidak tersambung ke laporan (jawaban laporan hardcoded).
- Tambah item manual tidak ada di versi HEAD. Item yang tidak ada di taksonomi tidak bisa ditangani.
- Service worker: cache network-first untuk semua GET tanpa batas, termasuk respons API. Tidak ada precache asset Next (`/_next/static`), jadi offline sebenarnya tidak berjalan setelah build. Docs bilang Workbox & Dexie, kenyataannya tulisan tangan dan IndexedDB mentah.
- `listPendingOfflineCompletions` ada tapi tidak ada mekanisme retry sync saat online kembali.
- Ikon PWA SVG (Android/iOS butuh PNG untuk install prompt yang benar).
- Tidak ada aksesibilitas yang serius (kontras teks `text-slate-400` kecil di atas latar gelap, emoji sebagai ikon fungsional).

### 4.5 Testing

- **"E2E test" bukan E2E.** `tests/*.test.mjs` dan `apps/web/tests/e2e-workflow.test.mjs` membaca file source lalu `assert(code.includes('...'))`. Contoh: test lulus selama string `'gas Klorin (Cl₂) beracun'` ada di file.
- `web-offline-and-graph.test.mjs` **menyalin ulang fungsi** ke dalam file test ("test their mirrors"), lalu menguji salinannya. Kalau kode asli rusak, test tetap hijau.
- `make test` **tidak menjalankan `go test`** dan tidak menjalankan `tsc`/`next build`. Baris terakhirnya mencetak "ALL 48 PASSED" secara statis.
- Test Python hanya menguji perilaku keyword-matching palsu.
- Tidak ada CI.
- Test tidak bisa dijalankan saat audit ini karena drive C: penuh (0 GB free). Hasil test saat ini tidak bisa dijadikan bukti apa pun.

### 4.6 Infra & Dokumentasi

- Terraform hanya membuat 1 network + 2 volume docker, tidak ada fungsi nyata.
- `README` Quick Start: `cp docs/setup/ENV-VARIABLES.md .env` (menyalin file markdown jadi .env).
- Docs kontradiktif dan berlebihan: dua `RUNBOOK-001-*`, dua `SRS-001-*`. `06-CURRENT-STATE.md` mengklaim "Production, tidak ada tech debt". Docs menyebut Prometheus, Playwright, Dexie, Workbox, Gin, pgx, sqlc, padahal tidak ada satu pun.
- Seremoni proses (5-Gate, Work Locks, `.Artifacts` per menit, `AI-NATIVE-ENGINEER-PLAYBOOK.md`) sangat besar dibanding kode yang benar-benar berfungsi. Ini memperbanyak dokumen tanpa memperbaiki produk.
- Ada sesi AI lain yang sedang mengedit `apps/web` tanpa koordinasi (sesi `12-40`). Revisi besar harus menunggu sesi itu berhenti atau di-commit dulu.

### 4.7 Yang Sebenarnya Bagus (Pertahankan)

- Matcher 3-tier Go (`MatchThreeTierExperiments`): logika set-based yang jelas dan ada unit test-nya.
- Aturan bahaya kimia deterministik: pendekatan yang benar untuk safety, jangan diganti LLM.
- Struktur kontrak (`contracts/api/openapi.yaml`, JSON schemas) sebagai pondasi.
- Konsep produk (inventaris dari barang bekas → eksperimen + substitusi + safety + laporan) memang menarik dan relevan untuk ID/MY.
- Utilitas `computeAnalyticalGraphSeries` (regresi OLS) dan formatter mata uang integer.

---

## 5. Rencana Revisi

Prinsip: **lebih sedikit fitur, tapi semuanya nyata.** Satu alur ujung-ke-ujung yang benar-benar bekerja dengan foto asli jauh lebih kuat (untuk demo, penilaian, maupun user) daripada 10 USP yang dipalsukan.

### Fase 0: Stabilkan & Jujur (±1–2 hari)

1. Hentikan/commit sesi AI paralel di `apps/web`. Kosongkan ruang di drive C:.
2. Perbaiki B1 (env var), B4 (build arg `NEXT_PUBLIC_API_URL`), B5 (tambah `pnpm-workspace.yaml` + root `package.json`, hapus hack di Dockerfile).
3. Satukan slug eksperimen (B2) dengan satu sumber: katalog Go.
4. **Hapus fallback diam-diam.** Kalau backend/AI gagal, tampilkan error yang jelas atau badge "Mode Demo" yang eksplisit.
5. Tulis ulang `docs/context/06-CURRENT-STATE.md` sesuai kenyataan. Hapus dokumen duplikat (RUNBOOK-001 ganda, SRS-001 ganda).
6. Buang jargon internal dari UI (USP #, nama agent, kode severity mentah).

### Fase 1: Tentukan Scope MVP (keputusan, bukan kode)

Rekomendasi alur inti:

> **Foto meja → daftar bahan (Gemini Vision nyata) → user koreksi/tambah manual → cek bahaya (deterministik) → rekomendasi 3-tier (matcher Go) → modul langkah kerja per jenjang → laporan praktikum (PDF via print CSS) dengan foto hasil & jawaban user asli.**

Ditunda (tandai "Segera Hadir" atau hapus dari UI):
- Step Vision Checker per langkah (#8): ganti sementara dengan checklist manual + upload foto opsional.
- AR overlay anchoring (#9): ganti dengan diagram/animasi SVG penjelas konsep, **tanpa** klaim "AR di atas benda nyata".
- Gamifikasi/badge/XP & offline sync (#10 bagian gamifikasi).
- Valkey, Terraform, SSE event stream.

### Fase 2: AI yang Nyata (±3–5 hari)

1. Satu modul agent di ai-agent memakai `google-genai` (Gemini 2.5 Flash) dengan **structured output** (`response_schema` = Pydantic `InventoryItemDTO`).
   - Prompt berisi taksonomi canonical material (dikirim dari katalog), sehingga output dipetakan ke `material_slug` yang valid.
   - Item di luar taksonomi dikembalikan sebagai `unknown` dengan nama bebas agar user bisa memetakan manual.
   - Confidence diambil dari model, bukan konstanta.
2. Pakai ADK hanya jika memang dibutuhkan orkestrasi multi-langkah. Untuk MVP, satu panggilan Gemini + validasi Pydantic sudah cukup dan jauh lebih mudah diuji. (Kalau ADK wajib karena syarat lomba/tugas, bungkus panggilan yang sama dalam satu `LlmAgent` saja, bukan 6.)
3. Pembuatan teks modul/laporan per jenjang: opsional via Gemini, dengan template sebagai kerangka (bukan teks hardcoded penuh).
4. Safety **tetap deterministik** setelah output vision. Tambahkan juga deteksi kata kunci pada `unknown` items (misal "pemutih", "Bayclin").
5. Timeout gateway dinaikkan (20–30 s), plus indikator loading di UI. Client mengompres foto (resize ~1280 px, JPEG 0.8) sebelum upload. Server membatasi body (misal 5 MB) dan memakai mime type yang benar.
6. Hapus `adk_orchestrator.py`/`google_adk_engine.py` ganda, `api.py`/`router.py` ganda, `CompatFastAPI`, dan semua logika "string ajaib".

### Fase 3: Satu Sumber Data (±2–3 hari)

1. core-api memakai Postgres sungguhan (`pgx`, jalankan migrasi `001–003` saat start). Katalog, inventaris, dan laporan disimpan.
2. ai-agent **tidak punya katalog sendiri**. Hapus/ciutkan `catalog_knowledge.py` (1.416 baris). Taksonomi yang dibutuhkan dikirim core-api di request.
3. Frontend **tidak punya katalog hardcoded**. Hapus ±500 baris fallback di `api-client.ts`. Offline = cache dari respons nyata terakhir di IndexedDB.
4. Tambah eksperimen ke seed (target 10–15 eksperimen nyata yang diverifikasi guru/sumber) supaya rekomendasi bermakna.
5. Auth minimal: identitas anonim per device (UUID di localStorage, dikirim sebagai header) atau login sederhana bila perlu peran guru.

### Fase 4: Frontend yang Bisa Dipakai (±4–6 hari)

1. Ganti satu halaman raksasa dengan alur 4 langkah (Scan → Pilih Eksperimen → Praktikum → Laporan), state per langkah, tanpa re-scan otomatis.
2. Kamera nyata (`getUserMedia`) + fallback upload, preview foto, edit/tambah/hapus item manual dengan pencarian dari taksonomi.
3. Render rumus dengan KaTeX.
4. Laporan memakai data asli: foto hasil, tabel pengamatan, jawaban kuis user, nama/kelas yang diisi user (default kosong, bukan "Budi Santoso").
5. PDF: print stylesheet A4 di halaman yang sama (`@media print`), bukan `window.open` + `document.write`.
6. PWA: precache asset build (Serwist/next-pwa), ikon PNG 192/512, retry sync saat `online`.
7. Bersihkan visual: kurangi badge/emoji, kontras teks memadai, mobile-first sungguhan.

### Fase 5: Test yang Bermakna (paralel dengan fase 2–4)

1. **Hapus** semua test yang membaca source sebagai string dan test "mirror".
2. Go: `go test ./...` untuk matcher, safety, handler (httptest). Masukkan ke `make test`.
3. Python: `pytest` dengan Gemini di-mock (fixture respons JSON), plus 1 test integrasi opsional yang memanggil Gemini asli jika `GEMINI_API_KEY` ada.
4. TS: Vitest yang **meng-import** `ar-and-pdf-engine.ts`/`shared-core` asli. `tsc --noEmit` dan `next build` wajib lulus.
5. Satu Playwright happy-path: upload foto contoh → inventaris muncul → pilih eksperimen → laporan bisa dicetak.
6. GitHub Actions menjalankan semua di atas. `make test` tidak boleh lagi mencetak "PASSED" secara statis.

### Fase 6: Infra & Dokumentasi Ramping

1. Compose: env var benar, healthcheck untuk core-api & ai-agent, `depends_on` dengan `service_healthy`, hapus Valkey jika tidak dipakai.
2. `.env.example` sungguhan. Perbaiki Quick Start di README.
3. Hapus atau sederhanakan Terraform (tidak punya fungsi saat ini).
4. Ciutkan dokumen: satu README per service yang jujur, `02-ARCHITECTURE.md` sesuai kode, ADR hanya untuk keputusan nyata. Kurangi seremoni `.Artifacts`/work-lock yang tidak membantu.

### Urutan & Estimasi Kasar

| Fase | Estimasi | Bisa paralel? |
|---|---|---|
| 0 Stabilkan | 1–2 hari | Tidak, harus duluan |
| 1 Scope MVP | 0.5 hari (diskusi) | Tidak |
| 2 AI nyata | 3–5 hari | Ya, dengan 3 |
| 3 Satu sumber data | 2–3 hari | Ya, dengan 2 |
| 4 Frontend | 4–6 hari | Setelah kontrak 2–3 stabil |
| 5 Test | berjalan terus | Ya |
| 6 Infra & docs | 1–2 hari | Akhir |

Total: ±2–3 minggu kerja satu orang untuk MVP yang jujur dan berfungsi.

---

## 6. Keputusan yang Perlu Diambil

1. **Scope MVP**: setuju dengan alur inti di Fase 1, dan menunda Step Vision, AR, dan gamifikasi?
2. **Arsitektur**: tetap Go + Python (dua service), atau disederhanakan menjadi Next.js + FastAPI saja? Rekomendasi: **tetap dua service hanya jika diwajibkan** (tugas/lomba). Kalau tidak, satu backend Python (FastAPI + Gemini + Postgres) memangkas duplikasi terbesar. Matcher Go yang bagus bisa di-port (±200 baris).
3. **Google ADK wajib?** Kalau ya, pakai minimal (1 `LlmAgent`). Kalau tidak, `google-genai` langsung lebih sederhana.
4. **Konteks & tenggat**: ini untuk tugas kuliah/lomba (UNIMAS)? Tenggat menentukan berapa fase yang realistis.
