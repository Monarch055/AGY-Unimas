# .Artifacts: AI Session Audit & Memory Persistence

> Direktori ini menyimpan rekaman audit dan rencana kerja lossless untuk setiap sesi kerja AI.
> AI WAJIB mengekspor catatan tracking ke direktori:
> `.Artifacts/YYYY-MM-DD/HH-MM/`

---

## Standar 2-Berkas (Lossless 2-File Standard):
1. `plan.md` — Rekaman evolusi pemikiran & rencana kerja:
   - `req:` Prompt atau instruksi user
   - `initial_plan:` Rencana awal perancangan solusi sebelum review
   - `revision:` Catatan revisi / feedback / self-correction saat Gate 3 Review
   - `final_plan:` Rencana final yang dieksekusi di Gate 4
2. `result.md` — Laporan komprehensif tunggal:
   - Ringkasan Eksekutif & Berkas yang dimodifikasi
   - Technical Walkthrough & Hasil verifikasi perintah
   - Checklist Audit 4-Kategori lengkap (Docs/Artifacts, 3-Layer Alignment, Edge Case Audit, Build Verification)
