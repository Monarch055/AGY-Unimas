# FEAT-XXX: [Feature Name]

> **Feature Specification Document (FEAT) — RekaSains**
> Location: `docs/features/FEAT-XXX-[kebab-case-name].md`
> Status: [DRAFT | IN REVIEW | APPROVED | IMPLEMENTED | DEPRECATED]
> Created: YYYY-MM-DD
> Author: [Developer / AI Session]
> Target Service: [services/... | apps/... | multiple]
> Priority: [P0-Critical | P1-High | P2-Medium | P3-Low]
> Breaking Change: [YES / NO]

---

## 1. Background & Motivation
[Jelaskan latar belakang dan masalah yang diselesaikan fitur ini. Berikan konteks mengapa fitur ini penting untuk sistem dan pengguna.]

---

## 2. Scope & Cross-Service Impact Matrix

### 2.1 In-Scope
- [Fitur atau komponen yang masuk dalam implementasi sesi ini]
- [Perubahan pada layer tertentu (Layer 1 Domain, Layer 2 Use Case, Layer 3 Adapter, Layer 4 Driver)]

### 2.2 Out-of-Scope
- [Hal-hal yang secara eksplisit TIDAK dikerjakan sekarang untuk mencegah scope creep]

### 2.3 Cross-Service Impact Matrix

| Service / Package | Impact Type | Description of Required Changes |
|-------------------|-------------|----------------------------------|
| `services/core-api` | [Endpoint / Publisher / None] | [Detail perubahan] |
| `apps/web` | [UI Component / DTO Update / None] | [Detail perubahan] |
| `packages/shared-types` | [New Interface / None] | [Detail perubahan] |

---

## 3. API & Event Changes

### 3.1 REST API Specification (`contracts/api/`)
- **Endpoint:** `POST /v1/[resource]`
- **Headers:** `Authorization: Bearer <token>`
- **Request Payload (JSON):**
```json
{
  "name": "example",
  "config": {}
}
```
- **Response Payload (200 OK / 201 Created):**
```json
{
  "status": "success",
  "data": {
    "id": "uuid-here"
  }
}
```

### 3.2 Event Specification (`contracts/events/`)
- **Topic / Routing Key:** `resource.created`
- **Payload Schema:**
```json
{
  "event_id": "uuid",
  "timestamp": "2026-10-16T00:00:00Z",
  "data": {}
}
```

---

## 4. 4-Layer Clean Architecture Mapping

- **Layer 1 (Domain):** Entity structs, domain events, validation errors.
- **Layer 2 (Use Case):** Interactor workflows and repository interfaces.
- **Layer 3 (Adapter):** Controllers, event publishers/consumers, SQL repositories.
- **Layer 4 (Infrastructure):** DB migration file, router registration.

---

## 5. Database Schema Changes
```sql
-- Migration: YYYYMMDD_add_field_to_table.sql
ALTER TABLE resources ADD COLUMN status VARCHAR(50) DEFAULT 'active';
```

---

## 6. Critical Edge Cases & Test Scenarios

### Edge Cases
1. **Security:** Authorization check to ensure caller owns the requested resource.
2. **Race Condition:** Concurrent write handling with optimistic locking or DB transactions.
3. **Idempotency:** Re-submitting the exact same request will return the existing resource.

### Test Scenarios
- [ ] Unit Test: Layer 1 Domain validation rules.
- [ ] Unit Test: Layer 2 Use Case logic with mocked repository.
- [ ] Integration Test: HTTP endpoint status codes (200, 400, 401, 403, 404).
