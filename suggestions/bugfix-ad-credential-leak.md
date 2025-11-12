# Fix LDAP credential leak to the frontend

## Feature overview
Restrict the `/api/config/servers` response so it never returns `LDAP_BIND_PASSWORD` (or related secrets) to the browser. Instead, keep AD configuration server-side, let the backend inject credentials when calling LDAP helpers, and adjust frontend requests to omit sensitive fields.

## Why it improves the project
The current implementation exposes the bind password to every authenticated user who loads the UI, which is a critical security flaw. Any user could view dev tools, grab the password, and access the domain controller. Removing the leak is mandatory before wider adoption.

## How much cost
Low (≤1 day). Requires changing the config route, updating AD endpoints to read secrets internally, and adapting frontend API calls to stop sending passwords with each request.

## Whats benefit
- Closes an immediate security vulnerability.
- Aligns with the project’s promise of secure credential handling.
- Reduces audit findings and simplifies pentest remediation.
- Builds trust with IT and security stakeholders.

## Usecase
After the fix, an internal pentest inspects network traffic and finds that LDAP bind passwords are no longer exposed. Security signs off on deploying the manager to production domains.


