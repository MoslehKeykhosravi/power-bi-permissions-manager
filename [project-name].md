# Power BI Permissions Manager – Engineering Guide

> **Read this file before making any code changes.**  
> Update this guide after major features, milestones, or database/infra changes.

## Quick Facts

- **Purpose:** Centralized UI + API to inspect and manage Power BI Report Server permissions with Active Directory enrichment.
- **Stack:** Vue 3 + Vite frontend, Node.js/Express backend, httpntlm for Power BI REST calls, ldapjs for AD, Docker + Nginx for deployment.
- **Key Docs:**
  - `project-documentation.md` – full technical deep dive (architecture, workflows, setup).
  - `README.md` – product-level overview and quick start.
  - `DOCUMENTATION_PERSIAN.md` – Persian-language documentation.

## Current Architecture Snapshot

- **Frontend (`frontend-vue/`)** renders the report tree, permissions panel, AD modals, i18n/theme controls.
- **Backend (`backend/`)** now runs from `src/server.js` with a layered layout (`src/controllers`, `src/services`, `src/repositories`, `src/middlewares`, `src/validations`, `src/utils`). Controllers stay thin, delegating to services and repositories so that routing, business logic, and external integrations remain isolated. Shared middleware (async handler, validation, error handling, timeouts) and utilities (NTLM client, logger) are centralized for easier maintenance.
- **Security note:** `/api/config/servers` now exposes only an `adConfig.available` flag. LDAP bind credentials remain server-side; callers must rely on backend fallbacks instead of receiving secrets over HTTP.
- **Permission updates:** the backend validates requested roles against the known Report Server role catalogue and normalizes provided user identifiers (UPN/user-only → `DOMAIN\user`) before persisting policy changes, preventing mismatched grants.
- **Environment parity:** `PBI_USER` is the canonical credential variable; `PBI_USERNAME` remains as a legacy alias for existing deployments, but new `.env` files should only set `PBI_USER`.
- **Dev tooling:** backend now ships with ESLint scripts (`npm run lint|lint:fix`) and a placeholder `npm test` (runs lint by default). Docker images install dependencies via `npm ci --omit=dev` for deterministic builds.
- **Background jobs:** `src/jobs/index.js` now exposes `registerJob` so real recurring work (syncs, cleanups) can be added explicitly; without registrations the scheduler stays idle and logs a single informational message.
- **AD/LDAP calls**: `adService` automatically falls back to server-side `.env` credentials when a client request omits LDAP settings, so dashboards/Postman scripts no longer need to echo secrets in every payload.
- **External Systems:** Power BI Report Server REST API (NTLM auth) + Active Directory/LDAP; no local database persisted today.

### Data Schema

The application does **not** manage its own database. All authoritative data lives in:

1. **Power BI Report Server Catalog** – accessed via REST `/api/v2.0/PowerBIReports`, `/Reports`, `/CatalogItems`, `/Policies`.
2. **Active Directory** – queried via LDAP for users, groups, hierarchy, departments, and locations.

If future features introduce persistence (audit logs, templates, etc.), document the schema here immediately.

## Dev & Deployment Essentials

- Copy `backend/env.example` → `.env`; keep credentials server-side only.
- `npm run dev` in both `backend/` and `frontend-vue/` for local work (frontend proxies `/api` to `localhost:5000`).
- Docker path: `./rebuild-and-run.sh` (or `.bat`) builds, starts, and health-checks the stack; Nginx serves SPA and proxies `/api`.
- Always update `project-documentation.md` after major releases to reflect new modules, configs, or workflows.

## Change Management Checklist

1. Read this file and `project-documentation.md`.
2. Confirm `.env` values match target environment; never commit secrets.
3. After completing a significant feature:
   - Update this `[project-name].md` with any architecture/process/db changes.
   - Summarize structural changes in `project-documentation.md` and `CHANGELOG.md`.
4. When adding migrations or databases in the future, append schema definitions here (tables, columns, relationships, seed data).

## Contacts & Next Steps

- Improvement backlog lives in `suggestions/recommended-improvements.md`.
- If clarifications are needed, document them here for continuity before coding.

_Last updated: 2025-11-14 – backend layered refactor + AD fallback_
