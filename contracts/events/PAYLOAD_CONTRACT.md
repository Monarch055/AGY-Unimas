# Internal SSE Stream & Background Event Payload Contracts — RekaSains

> **Single Source of Truth:** Seluruh pertukaran event internal, Server-Sent Events (SSE) streaming, dan background webhook callback antara `services/core-api` dan `services/ai-agent` mematuhi skema amplop JSON di bawah ini (**Tanpa Message Broker Eksternal**).

---

## 1. Standard Internal Event / SSE Envelope

Seluruh event streaming maupun callback latar belakang dibungkus dalam format amplop standar JSON:

```json
{
  "event_id": "c1f7b094-1a93-4a1e-b7d1-0f47bc566d21",
  "event_type": "experiment.module.synthesized",
  "source": "services/ai-agent",
  "timestamp": "2026-10-17T04:38:00Z",
  "version": "1.1",
  "data": {
    "request_id": "8e84a912-40a1-4b22-91e8-99b0a1234567",
    "user_id": "u-1001",
    "region": "ID",
    "curriculum_code": "ID_KURIKULUM_MERDEKA",
    "age_adaptive_level": "SMA_UPPER_SEC",
    "grade_level": "SMA_FASE_E",
    "experiment_slug": "rangkaian-listrik-baterai-kaleng-ar"
  }
}
```

---

## 2. Internal Event Types & Transport Channels

| Event Type | Transport Channel | Producer | Consumer | Description |
|------------|-------------------|----------|----------|-------------|
| `inventory.scan.completed` | Direct Internal REST (`/ai/v1/vision/scan`) | `ai-agent` | `core-api` | Hasil ekstraksi bahan & pengecekan bahaya ko-lokasi meja kerja dari `VisionInventoryAgent` + `SafetyGuardianAgent` |
| `experiment.module.synthesized` | Direct Internal REST / SSE (`/ai/v1/curriculum/scaffold`) | `ai-agent` | `core-api` | Paket modul 4-Jenjang Adaptif + preset koordinat AR untuk disimpan ke katalog & `OfflineLabPack` |
| `experiment.step.verified` | Direct Internal REST (`/ai/v1/vision/verify-step`) | `ai-agent` | `core-api` | Hasil verifikasi langkah perakitan pengguna & ekstraksi koordinat AR dari `StepVisionAndARAgent` |
| `lab_report.synthesized` | Direct Internal REST (`/ai/v1/lab-report/synthesize`) | `ai-agent` | `core-api` | Draf Laporan Praktikum PDF dari `LabReportSynthesizerAgent` |
