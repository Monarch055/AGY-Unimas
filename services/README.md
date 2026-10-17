# Services Enclave: Microservices & Background Workers

> **STRICT ZERO COUPLING DIRECTIVE:**
> 1. Dilarang keras melakukan import cross-service secara langsung (misal: `service-a` dilarang mengimpor file dari `service-b`).
> 2. Komunikasi hanya boleh melalui `contracts/api/` (HTTP/gRPC) atau `contracts/events/` (Message Broker).
> 3. Setiap service wajib menerapkan Robert C. Martin's **4-Layer Clean Architecture**.

---

## Directory Standards for Each Service
```text
services/[service-name]/
├── cmd/               # Application entrypoint (main.go, index.ts, server.py)
├── internal/          # Service-private code (not importable externally)
│   ├── domain/        # Layer 1: Pure Domain Entities & Invariants
│   ├── usecase/       # Layer 2: Application Business Workflows & Port Interfaces
│   ├── delivery/      # Layer 3: HTTP Handlers / Event Consumers
│   ├── repository/    # Layer 3: DB Implementations (SQL, GORM, Prisma)
│   └── infrastructure/# Layer 4: DB Connection Pools, Logger init, SDKs
├── Dockerfile         # Service-specific build & packaging
└── README.md          # Service documentation & port assignments
```
