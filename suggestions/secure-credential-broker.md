# Harden credential handling via managed secrets

## Feature overview
Introduce a secure credential broker that removes raw LDAP and NTLM secrets from the frontend bundle and application .env files. The backend loads secrets from a managed store (Azure Key Vault, AWS Secrets Manager, or HashiCorp Vault), caches them briefly in memory, and rotates them automatically. Client requests use opaque token references so that bind passwords and Power BI accounts never traverse the browser or persistent config files.

## Why it improves the project
The current `/api/config/servers` endpoint returns LDAP bind credentials to the browser, creating a critical leak vector. Moving secrets to a managed vault with backend-only access closes that exposure, aligns with enterprise security expectations, and simplifies compliance audits. Automatic rotation also prevents forgotten passwords from becoming long-term liabilities.

## How much cost
Medium (1–2 sprints). Requires wiring a secrets SDK into the Node backend, updating Docker Compose / deployment scripts with vault configuration, and refactoring AD-lookup endpoints to fetch credentials server-side.

## Whats benefit
- Eliminates credential leakage to the UI.
- Enables rotation without redeploying containers.
- Centralizes access control and audit trails for secrets.
- Improves trust posture when pitching the tool to security teams.

## Usecase
Enterprise administrators deploying the manager in production can point the backend at their corporate Key Vault, grant it a managed identity, and ensure no operator ever copies bind passwords into plaintext env files or exposes them via network traces.


