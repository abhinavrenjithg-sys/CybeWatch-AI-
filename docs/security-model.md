# CybeWatch AI — Security Model & Guardrails

## 1. Authentication & Session Security
- **Algorithm**: Cryptographically signed JSON Web Tokens (JWT) using HS256 with server-side validation.
- **Password Storage**: Passwords hashed using Bcrypt with 12 rounds of salt.
- **Default Credentials**: Development installation provides `analyst@cybewatch.ai` with initial setup password `CybeWatch2026!`. Production deployments enforce `.env` configuration.

## 2. Workspace Multi-Tenancy & Data Isolation
- Every security event, alert, prediction, and incident is bound to a `workspace_id`.
- Foreign key cascading deletes ensure that data is completely purged when a workspace is deprovisioned.
- Queries enforce workspace filtering at the database layer to strictly prevent cross-tenant leakage.

## 3. AI Safety & Defensive Containment Guardrails
- **Prompt Injection Defense**: Network flow parameters and packet payload data are treated strictly as untrusted telemetry data, never as system instructions.
- **Zero-Speculation Evidence Standard**: The AI Investigator separates observed telemetry facts from attack hypotheses.
- **Mandatory Human Approval**: The system will **never** automatically execute firewall rules, drop network routes, or shut down host interfaces. All defensive recommendations require manual human review and confirmation.
