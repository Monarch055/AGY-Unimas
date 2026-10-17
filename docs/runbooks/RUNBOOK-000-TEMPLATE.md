# RUNBOOK-XXX: [Incident / Operational Procedure Title]

> **Operational Runbook**
> Trigger: [Alarm / User Report / High Memory Alert]
> Severity: [P1-Critical | P2-High | P3-Medium]

---

## 1. Symptoms & Initial Detection
- Metrik APM atau log error yang menandai terjadinya insiden.
- Dampak terhadap end user.

---

## 2. Immediate Diagnostic Steps
1. Periksa status container:
   ```bash
   docker compose ps
   ```
2. Cek error logs:
   ```bash
   docker compose logs -f --tail=100 [service-name]
   ```

---

## 3. Remediation & Recovery Procedure
- **Step 1:** [Tindakan mitigasi tercepat, misal: restart service atau clear cache]
- **Step 2:** [Verifikasi pemulihan data]

---

## 4. Post-Mortem & Preventative Action
- Catat akar masalah dan buat task pencegahan agar tidak terulang.
