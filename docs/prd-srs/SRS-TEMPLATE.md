# SRS-XXX: [Service / Subsystem Name]

> **System Requirements Specification (SRS)**
> Target Service: `services/[service-name]`
> Status: [APPROVED | ACTIVE]

---

## 1. System Overview & Boundaries
Jelaskan batasan teknis dari service ini, database yang dimiliki, dan dependensi eksternal.

---

## 2. Functional Requirements
- **FR-01:** Menerima request HTTP pada endpoint `/v1/...`.
- **FR-02:** Menjalankan validasi input sesuai schema DTO.
- **FR-03:** Menerbitkan pesan event ke broker jika proses selesai.

---

## 3. Interface & Contract Requirements
- **REST APIs:** Didefinisikan di `contracts/api/[service-name].yaml`.
- **AMQP / Event Topics:** Didefinisikan di `contracts/events/PAYLOAD_CONTRACT.md`.
