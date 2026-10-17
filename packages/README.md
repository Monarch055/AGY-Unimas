# Packages: Shared Libraries

> **STRICT PACKAGE PURITY RULE:**
> Seluruh kode di dalam folder `packages/` HANYA boleh berisi utility generik, type definitions, dan helper tanpa business logic apapun!
> Business logic mutlak berada di dalam `services/` masing-masing.

---

## Enclaves:
- `shared-types/`: Shared interface, DTOs, dan type contracts cross-service.
- `shared-core/`: Generic logger, error helpers, retry logic, dan validator wrappers.
