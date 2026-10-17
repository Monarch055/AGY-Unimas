# FEAT-003: Tanya Lab AI — Conversational Multimodal STEM Tutor

> **Feature Specification ID:** `FEAT-003`
> **Status:** APPROVED & SPECIFIED
> **Curriculum Scope:** Indonesia (Kurikulum Merdeka & DIKTI) & Malaysia (KSSR, KSSM & Universiti)
> **Level Scope:** `SD_ELEMENTARY`, `SMP_LOWER_SEC`, `SMA_UPPER_SEC`, `HIGHER_ED_UNI`
> **Architecture Directive:** Zero-RabbitMQ (Direct HTTP/REST + Server-Sent Events Streaming)

---

## 1. Scope & Business Value

**Tanya Lab AI** adalah fitur asisten tutor percakapan interaktif berbasis AI (*Conversational STEM Tutor*) yang ditempatkan pada halaman/tab khusus di aplikasi web PWA RekaSains. Asisten ini memungkinkan siswa dan guru untuk:
1. Melakukan tanya jawab konsep sains secara bebas (Fisika, Kimia, Biologi, Rekayasa Teknik).
2. Mengunggah atau mengambil foto bahan/alat sekitar dari kamera secara multimodal untuk menanyakan potensi eksperimen atau bahaya keamanannya.
3. Menerima respon penjelasan secara *streaming real-time* via Server-Sent Events (SSE).
4. Menikmati penjelasan sains adaptif sesuai jenjang pendidikan (bahasa sederhana dan analogi ramah untuk SD, hingga formulasi kalkulus/LaTeX matematis untuk SMA dan Universitas).
5. Membaca arsip riwayat percakapan sebelumnya secara *offline* melalui IndexedDB lokal perangkat.
6. Memperoleh peringatan ramah *"Koneksi Internet Diperlukan"* apabila perangkat berada dalam mode offline atau kunci `GEMINI_API_KEY` belum terkonfigurasi.

---

## 2. 4-Layer Clean Architecture Mapping

### Layer 1: Domain & Entities
- Model `ChatMessageDTO`: ID pesan, peran (`user` atau `assistant`), konten teks markdown, lampiran gambar opsional (`image_base64`, `mime_type`), timestamp ISO8601.
- Model `ChatSessionDTO`: ID sesi, judul percakapan, region (`ID` / `MY`), level adaptif (`SD`, `SMP`, `SMA`, `HIGHER_ED`), kurikulum, daftar pesan.
- Model `ChatStreamChunkDTO`: Bagian potongan teks streaming yang dikirimkan melalui protokol SSE (`text/event-stream`).

### Layer 2: Application Use Cases
- `StreamChatCompletionUseCase`: Mengelola sesi tanya jawab, menyusun *prompt system* yang mengadopsi identitas tutor sains Kurikulum Merdeka / KSSR / KSSM sesuai jenjang usia, menghubungkan multimodal image jika ada, dan mengalirkan token balasan via *generator*.
- `SyncChatSessionUseCase`: Menyimpan dan mengambil riwayat percakapan antara penyimpanan lokal IndexedDB dengan database PostgreSQL.

### Layer 3: Interface Adapters
- `ChatStreamHandler` (`services/ai-agent`): Endpoint HTTP POST `/ai/v1/chat/stream` dan `/v1/chat/stream` yang merespon dengan `StreamingResponse(media_type="text/event-stream")`.
- `ChatSessionController` (`services/core-api`): Endpoint `/v1/chat/sessions` untuk persistensi riwayat.
- `IndexedDBChatStore` (`apps/web`): Adapter browser untuk menyimpan riwayat sesi dan pesan secara lokal.

### Layer 4: Frameworks & Drivers
- FastAPI & Google ADK / Gemini 2.5 Flash SDK (`services/ai-agent`).
- Gin Router & PostgreSQL 16 Driver `pgx` (`services/core-api`).
- Next.js React PWA + KaTeX & Markdown parser (`apps/web`).

---

## 3. REST API & SSE Contracts

### 3.1 Streaming Chat Completion Endpoint
- **Method:** `POST`
- **Path:** `/v1/chat/stream` (Alias: `/ai/v1/chat/stream`)
- **Headers:** `Content-Type: application/json`, `Accept: text/event-stream`
- **Request Body:**
```json
{
  "session_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "region": "ID",
  "age_adaptive_level": "SMA_UPPER_SEC",
  "curriculum_code": "ID_KURIKULUM_MERDEKA",
  "message": "Mengapa kaleng aluminium bisa menghantarkan listrik pada percobaan baterai?",
  "image_base64": null,
  "mime_type": null
}
```
- **Response Stream (`text/event-stream`):**
```text
data: {"chunk": "Kaleng ", "is_final": false}

data: {"chunk": "aluminium memiliki ", "is_final": false}

data: {"chunk": "elektron bebas...", "is_final": false}

data: {"chunk": "", "is_final": true, "session_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"}
```

---

## 4. Database & Storage Changes

### PostgreSQL Migration (`004_create_chat_sessions_and_messages.sql`)
```sql
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    region VARCHAR(10) NOT NULL DEFAULT 'ID',
    age_adaptive_level VARCHAR(50) NOT NULL,
    curriculum_code VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    has_image BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id, created_at ASC);
```

### IndexedDB Store (`apps/web`)
Store baru: `chat_history_sessions` dan `chat_history_messages`.

---

## 5. Edge Cases & Safety Scenarios

1. **Perangkat Offline / Tanpa Koneksi:**
   - Klien mendeteksi `navigator.onLine === false` atau error koneksi SSE.
   - Menampilkan peringatan: *"Koneksi Internet Diperlukan untuk Tanya Lab AI. Riwayat pesan sebelumnya tetap dapat dibaca."*
2. **Kunci API Gemini Belum Dikonfigurasi:**
   - `services/ai-agent` mengembalikan status HTTP 503 dengan pesan instruksi konfigurasi `GEMINI_API_KEY`.
3. **Pertanyaan Mengenai Bahan Kimia Berbahaya:**
   - Sistem prompt mewajibkan tutor menyertakan peringatan keselamatan tegas jika pengguna menyebutkan pencampuran zat berbahaya (seperti Pemutih + Asam atau Pemutih + Amonia).
4. **Rendering Formula LaTeX:**
   - KaTeX merender notasi inline `$...$` dan display `$$...$$` dengan fallback teks jika ekspresi tidak valid.

---

## 6. Verification & Test Scenarios

1. **Unit Test API:** Endpoint `/ai/v1/chat/stream` mengembalikan header `text/event-stream` dan chunk data yang valid.
2. **Pedagogical Contrast Test:** Memastikan respon untuk `SD_ELEMENTARY` tidak memuat rumus kalkulus rumit, sedangkan `SMA_UPPER_SEC`/`HIGHER_ED_UNI` menyertakan variabel dan formula LaTeX.
3. **Contract Conformance Test:** Memastikan skema `ChatMessage` dan `ChatSession` terdaftar di OpenAPI v1.1.0 dan `@rekasains/shared-types`.
