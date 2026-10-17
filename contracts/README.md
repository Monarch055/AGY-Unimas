# Contracts: Single Source of Truth

> Seluruh komunikasi sinkron (REST API) dan asinkron (Event/AMQP) antar-service WAJIB didefinisikan di dalam folder ini terlebih dahulu sebelum kode implementasi ditulis.

---

## Directory Structure
- `api/`: REST OpenAPI / Swagger specifications (`openapi.yaml`).
- `events/`: Event topics, routing keys, and JSON payload contracts (`PAYLOAD_CONTRACT.md`).
- `schemas/`: Shared JSON Schemas or Protobuf definitions.
