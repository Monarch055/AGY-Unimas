# Operational Runbooks

> Master catalog of operational incident recovery, health probing, and maintenance playbooks for **RekaSains**.

---

## Active Runbooks

| Runbook ID | Title | Trigger Condition | Severity | Status |
|------------|-------|-------------------|----------|--------|
| `RUNBOOK-001` | [Service Recovery & Container Restart](RUNBOOK-001-service-recovery-and-container-restart.md) | Container unhealthy / CrashLoop / SSE Disconnect | P2-High | 🟢 Production |
| `RUNBOOK-002` | [Health Probing & Incident Response Playbook](RUNBOOK-001-service-recovery-and-incident-response.md) | Latency spike (>1s) / SSE Stream disconnect / Resource saturation | P2-High | 🟢 Production |

---

## Templates
- `RUNBOOK-000-TEMPLATE.md`: Template standar untuk menyusun runbook operasional baru.
