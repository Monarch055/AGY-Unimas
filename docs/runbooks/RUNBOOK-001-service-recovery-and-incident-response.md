# RUNBOOK-001: Service Recovery & Container Restart

> **Operational Runbook — RekaSains**
> Location: `docs/runbooks/RUNBOOK-001-service-recovery-and-container-restart.md`
> Trigger: Container unhealthy, 502/504 Bad Gateway pada Reverse Proxy Caddy, Database Connection Timeout, atau AI Agent unresponsive.
> Severity: P2-High

---

## 1. Symptoms & Initial Detection

- HTTP 502 Bad Gateway atau 504 Gateway Timeout saat memanggil `/v1/*` atau `/ai/v1/*`.
- Respon lambat (> 5 detik) saat melakukan scanning inventaris atau verifikasi langkah.
- Container status `unhealthy` atau `restarting` pada output `docker compose ps`.
- Log `services/core-api` menampilkan `pq: connection refused` atau `adk_gateway: fallback triggered`.

---

## 2. Immediate Diagnostic Steps

1. **Periksa status container Docker:**
   ```bash
   docker compose ps
   ```
2. **Inspeksi log service terkait:**
   ```bash
   # Core API logs
   docker compose logs --tail=100 -f core-api

   # AI Agent logs
   docker compose logs --tail=100 -f ai-agent

   # Database logs
   docker compose logs --tail=100 -f postgres
   ```
3. **Verifikasi konektivitas internal antar container:**
   ```bash
   docker compose exec core-api ping -c 3 ai-agent
   docker compose exec core-api pg_isready -h postgres -p 5432 -U postgres
   ```

---

## 3. Remediation & Recovery Procedure

### Scenario A: PostgreSQL Terhenti / Tidak Merespons
```bash
# Restart database
docker compose restart postgres

# Tunggu hingga status healthy
docker compose ps postgres

# Verifikasi koneksi dari core-api
docker compose restart core-api
```

### Scenario B: AI Agent Mengalami Out-Of-Memory (OOM) atau Hang
1. Restart container AI Agent:
   ```bash
   docker compose restart ai-agent
   ```
2. Catat bahwa `services/core-api` secara otomatis mengaktifkan **Smart Deterministic Fallback** internal sehingga pengguna web tetap dapat melihat rekomendasi dan perancah modul sains tanpa downtime.
3. Setelah `ai-agent` kembali sehat, traffic otomatis dialihkan kembali ke Google ADK Engine.

### Scenario C: Full Stack Restart
Jika terjadi network split internal:
```bash
docker compose down
docker compose up -d
docker compose ps
```

---

## 4. Post-Mortem & Preventative Action

1. Periksa batas memori di `docker-compose.yml` untuk mencegah OOM killer.
2. Pastikan file `.env` memiliki nilai `GEMINI_API_KEY` dan parameter timeout HTTP yang sesuai (minimal 10s untuk multimodal vision).
3. Pastikan `apps/web` tetap memanfaatkan `IndexedDB` untuk mode offline saat jaringan tidak stabil.
