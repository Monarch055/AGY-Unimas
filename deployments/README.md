# Deployments Enclave: Infrastructure & Orchestration

> Definisi infrastruktur sebagai kode (IaC), container base files, dan reverse proxy ingress.

---

## Directories
- `docker/`: Base Dockerfiles dan multi-stage build templates.
- `proxy/`: Konfigurasi reverse proxy (Caddyfile atau Nginx) dengan auto-SSL dan route forwarding.
- `terraform/`: Modul Terraform / OpenTofu provisioning resource cloud/bare-metal.
