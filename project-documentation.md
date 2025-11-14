# Power BI Permissions Manager – Project Documentation

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Setup & Installation](#setup--installation)
- [Technical Details](#technical-details)
- [Project Workflow](#project-workflow)
- [Maintenance & Future Development](#maintenance--future-development)
- [Appendices](#appendices)

## Project Overview

### Purpose

Power BI Permissions Manager centralizes the discovery and governance of Power BI Report Server assets. It gives administrators a single browser-based console to search catalog items, inspect existing security policies, update permissions in bulk, and surface Active Directory context (user details, reporting chains, group memberships). The project eliminates the need for RDP sessions or manual SSRS portal work while keeping all credentials on the server side for security.

### Problem It Solves

- **Visibility:** Administrators often lack a consolidated view of which users and groups can access PBIX/RDL artifacts spread across many folders and instances.
- **Productivity:** Managing permissions through the native Power BI Report Server UI is slow, repetitive, and does not support batch changes across different item types.
- **Governance:** Compliance processes (least privilege, quarterly reviews) demand reliable audit-friendly workflows and Active Directory enrichment.
- **Security:** Credentials previously collected from end-users now reside exclusively on the backend, preventing credential leakage and providing rate-limited, logged APIs.

### High-Level Functionality

- Connect to predefined or ad-hoc Power BI Report Server URIs and enumerate folders, PBIX, and RDL items through NTLM-authenticated REST calls.
- Render a responsive, memoized tree/table hybrid UI for browsing, filtering, selecting, renaming, and bulk tagging of assets.
- Apply or remove permissions for one or multiple users/groups simultaneously, with precise role controls (Browser, Content Manager, My Reports, Publisher, Report Builder).
- Query and display Active Directory users, groups, manager chains, direct reports, and memberships; reuse AD data when assigning permissions.
- Support multi-language (English/Persian) UI, RTL layouts, and a tri-theme (light/dark/system) appearance.
- Provide CLI/docker scripts for reproducible deployments with Nginx reverse proxying front-end assets to backend APIs.

### Technologies, Libraries, and Frameworks

- **Frontend:** Vue 3 (Composition API, `<script setup>`), Vite 5, Pinia for shared state, Axios for HTTP, custom SVG icon components, CSS design system, and bespoke i18n tooling.
- **Backend:** Node.js 18, Express 4, httpntlm for NTLM authentication, ldapjs for AD queries, Helmet, CORS, express-rate-limit, compression, Morgan, Winston, Joi.
- **Infrastructure:** Docker, Docker Compose, Nginx, shell/batch helper scripts.
- **External Systems:** Power BI Report Server REST API (`/api/v2.0`), Active Directory/LDAP. Project maintains no internal database; all state is ephemeral or delegated to external services.

## Architecture

### System Topology

```text
Browser (Vue 3 SPA)
        │ HTTPS
        ▼
Nginx (static assets + /api proxy)
        │
Backend API (Express)
   ├─ Power BI Report Server (NTLM)
   └─ Active Directory / LDAP
```

### Folder & File Structure

```text
power-bi-permissions-manager/
├── backend/                # Express service, NTLM + LDAP logic
│   ├── src/
│   │   ├── server.js       # Boots Express + background jobs
│   │   ├── app.js          # Middleware stack + /api route mounting
│   │   ├── config/         # dotenv load, env validation, rate-limit, CORS
│   │   ├── controllers/    # HTTP adapters (thin)
│   │   ├── services/       # Business workflows (reports, permissions, AD)
│   │   ├── repositories/   # NTLM/Power BI + LDAP data access
│   │   ├── middlewares/    # Async handler, validation, errors, timeouts
│   │   ├── validations/    # Joi schemas per route
│   │   ├── utils/          # Logger + NTLM client
│   │   └── routes/         # Feature routers wiring validation + controllers
│   ├── server.js           # Back-compat shim → requires `src/server.js`
│   ├── Dockerfile, env.example, package.json
├── frontend-vue/           # Vue 3 SPA
│   ├── src/
│   │   ├── App.vue
│   │   ├── components/
│   │   │   ├── ReportTree.vue
│   │   │   ├── TableTreeNode.vue
│   │   │   └── PermissionsPanel.vue
│   │   ├── composables/useI18n.js
│   │   ├── i18n/translations.js
│   │   ├── assets/ (SVG icons)
│   │   └── styles/
│   ├── vite.config.js, Dockerfile, nginx.conf
├── docker-compose.yml
├── rebuild-and-run.sh/.bat, quick-restart.sh
├── README.md, DOCUMENTATION_PERSIAN.md, CHANGELOG.md
└── suggestions/recommended-improvements.md
```

### Responsibilities by Module

- **`backend/src/server.js`** – Loads dotenv/env validation, starts Express app (`src/app.js`), logs environment metadata, and initializes background job scaffolding.
- **`backend/src/app.js`** – Centralizes Helmet, CORS allowlists, compression, Winston/Morgan logging, 30s request timeouts, rate limiting, validation, and mounts `/api` routes plus `/health`.
- **Controllers (`src/controllers/`)** – Handle request/response translation only, deferring to services.
- **Services (`src/services/`)** – House business logic:
  - `reportService` merges Power BI and RDL catalogs, normalizes names/paths, and renames items with NTLM PATCH fallbacks.
  - `permissionService` retrieves policies via ID/path, batches catalog lookups, calculates mutual permissions, normalizes usernames, and orchestrates role updates/removals.
  - `adService` orchestrates LDAP searches, group lookups, hierarchy queries, and metadata hydration.
  - `configService` returns server presets + optional AD bindings.
- **Repositories (`src/repositories/`)** – `powerBiRepository` wraps NTLM HTTP calls (GET/PATCH/PUT) via a shared `ntlmClient`, while `ldapRepository` encapsulates ldapjs bindings, attribute helpers, and traversal safeguards (circular manager detection, member hydration).
- **Middlewares (`src/middlewares/`)** – Provide async handler, Joi validation bridge, error/not-found responders, and request timeout enforcement.
- **Utilities (`src/utils/`)** – Winston logger config and NTLM HTTP helper shared by repositories/services.
- **Frontend components**:
  - `App.vue` orchestrates theme/locale toggles, top-level layout, toast notifications, modal lifecycles, and wires child components to REST endpoints.
  - `ReportTree.vue` manages the tree/table hybrid view (search, quick filters, expand/collapse, selection states, inline rename flows, auto-select parents).
  - `TableTreeNode.vue` recursively renders nested nodes, badge states, and inline role pickers, while emitting selection and rename events.
  - `PermissionsPanel.vue` aggregates selections, tracks role chips, drives apply/check actions, and embeds the AD-driven user info modals.
  - `useI18n.js` persists locale selection, flips RTL/LTR attributes, and resolves translation keys.
- **Docker/Nginx assets** – Containerize both services, enforce security headers, gzip/caching, and proxy `/api` traffic inside the docker network.

### Data Flow & Interactions

1. User selects a server URI (prefilled via `/api/config/servers`) and triggers a report load.
2. Frontend calls `POST /api/reports/list` with only the server URI. Backend injects server-side NTLM credentials and queries Power BI endpoints (`/PowerBIReports`, `/Reports`), merging results for the UI tree.
3. Selecting tree nodes populates `PermissionsPanel` state. Simultaneously, the Active Directory search box (auto-complete) calls `POST /api/ad/search`, enabling quick user/group tagging.
4. Applying permissions sends `POST /api/permissions/set` with item metadata and normalized usernames. Backend fetches existing policies, merges/removes role sets, and writes via ID-based endpoints (falling back to path-based calls for non-Latin names).
5. Checking permissions issues `POST /api/permissions/check`, which enumerates catalog items, batches policy lookups, and intersects roles when multiple principals are provided. Results are surfaced in the UI for audit trails.
6. User detail modals chain additional AD endpoints (`/user/details`, `/user/manager-chain`, `/user/direct-reports`, `/group/members`, `/departments`, `/locations`) to enrich context, all reusing the backend’s LDAP bindings.

### Key Architectural Decisions & Dependencies

- **Server-side credential custody** keeps Power BI and LDAP secrets out of the browser. The backend enforces input validation, CORS allow-lists, rate limiting (100 req / 15 min), and 30-second request timeouts to protect upstream services.
- **NTLM bridging via `httpntlm`** allows Express to talk to on-prem Power BI Report Server without exposing credentials. Fallback sequences (ID-first, then path-based queries) address Unicode/Persian catalog paths.
- **Batching & throttling** in `/permissions/check` reduce load on Report Server by slicing catalog fetches into batches of 20 and short-circuiting on root path successes.
- **Custom i18n + RTL toggle** ensures the same component tree serves English and Persian audiences and persists user choices in `localStorage`.
- **Docker-first deployment** aligns with infrastructure automation goals: Compose orchestrates health checks and restarts, while Nginx handles HTTPS termination, caching, and proxying.
- **No internal database** simplifies infrastructure while relying on Power BI and AD as the systems of record. Any persistence (e.g., audit logs) would require future extensions.

## Setup & Installation

### Requirements & Prerequisites

- **Docker path (recommended):** Docker 20.10+, Docker Compose 2.0+, ability to run shell/batch helpers.
- **Manual path:** Node.js 18+, npm 9+, optional LDAP connectivity to your domain controller.
- **Power BI Report Server credentials:** Configure `backend/.env` via `backend/env.example`.
- **Active Directory credentials (optional but required for AD search):** `LDAP_URL`, `LDAP_BIND_DN`, `LDAP_BIND_PASSWORD`, `LDAP_SEARCH_BASE`.

### Environment Preparation

1. Clone or copy the repository to `/media/mosleh/Windows/Scripts/power-bi-permissions-manager`.
2. Copy backend configuration: `cp backend/env.example backend/.env` and fill out NTLM + LDAP variables.
3. (Optional) Add `frontend-vue/.env` with `VITE_API_URL=/api` when hosting behind a reverse proxy.
4. Ensure ports `80` and `5000` are free (or adjust Compose/Env accordingly).

### Docker Compose Workflow

1. From project root run `./rebuild-and-run.sh` (Linux/Mac) or `rebuild-and-run.bat` (Windows) for cached rebuilds. Append `--clean` to invalidate caches.
2. Scripts stop existing containers, rebuild images, and start services in detached mode (`docker compose up -d` under the hood).
3. Access:
   - Frontend: `http://localhost`
   - Backend API: `http://localhost:5000`
4. Monitor logs: `docker compose logs -f`.
5. Shutdown: `docker compose down`.
6. Health checks:
   - Backend: `http://localhost:5000/health`
   - Frontend: HEAD request to `http://localhost/`.

### Manual Development Setup

1. **Backend**

   ```bash
   cd /media/mosleh/Windows/Scripts/power-bi-permissions-manager/backend
   npm install
   cp env.example .env
   npm run dev
   ```

   Express listens on `http://localhost:5000`.

2. **Frontend**

   ```bash
   cd /media/mosleh/Windows/Scripts/power-bi-permissions-manager/frontend-vue
   npm install
   npm run dev
   ```

   Vite serves the SPA on `http://localhost:5173` (or `:3000` per `vite.config.js`) and proxies `/api` to `http://localhost:5000`.

### Production Build & Nginx

1. Run `npm run build` in `frontend-vue` to produce `dist/`.
2. Nginx config (`frontend-vue/nginx.conf`) serves `dist`, applies security headers, enables gzip, caches static assets for 1 year, and proxies `/api` to the backend container using docker-network hostnames.
3. Backend start command `npm start` (or `node server.js`) runs the API in production mode; ensure `.env` is populated and environment validation passes at boot.

## Technical Details

### Backend Services

- **Middleware stack**: `helmet()` for security headers, CORS origin filtering using `ALLOWED_ORIGINS`, JSON/body size caps (10 MB), `compression` (level 6), request/response timeouts (30s), Morgan logging piped into Winston, and `/api/*` rate limiter (`express-rate-limit`).
- **Environment validation**: `utils/validateEnv.js` enforces the presence of Power BI credentials and warns when LDAP is incomplete, failing fast during startup to avoid partial configuration.
- **Reports API**: `/list` composes PBIX + RDL listings using NTLM GET requests, standardizes `fullPath`, and returns aggregated errors for visibility. `/rename` uses GET to resolve folder IDs and PATCH operations (`PowerBIReports`, `Reports`, `Folders`) with fallback sequences.
- **Permissions API**:
  - `/get` fetches policies by ID and/or path, escaping quotes and supporting Unicode.
  - `/check` loads all catalog items, batches policy calls (20 at a time), normalizes usernames (domain stripping), and optionally intersects roles across multiple principals to provide “mutual access” insights.
  - `/set` merges new policies, supports removal (empty role array), deduplicates roles using canonical definitions, and sequentially attempts ID-based then path-based endpoints to cover multilingual catalogs.
- **Active Directory API**: `adRoutes` + `adService` expose search, user detail, group, manager chain, department, and location endpoints. `adService` now falls back to server-side LDAP credentials from `.env` when a request omits them, so web clients no longer need to resend bind secrets; `ldapRepository` centralizes LDAP bindings, entry parsing, multi-valued attribute extraction, and circular reference guards for manager traversals.
- **Config API**: Supplies frontend with server URIs and, when fully specified, default LDAP settings for the AD search modal.

### Frontend Application

- **Entry (`main.js`)**: Creates the Vue app, installs Pinia (reserved for future shared stores), imports global CSS fonts/design tokens, and mounts to `#app`.
- **`App.vue`**: Hosts theme buttons (persisted via `localStorage`), locale toggles that update `document.dir`, AD search UI with debounced calls, top-level action buttons (Apply/Check), toast notifications, and modals for user/group detail introspection.
- **`ReportTree.vue`**: Builds an in-memory tree each render, honors search text (matching names and folder paths), tracks expanded/checked sets via `Set`s for O(1) lookups, implements quick actions (expand/collapse/select/deselect), auto-select parents toggle, renders server root node, and exposes rename/role actions upstream.
- **`TableTreeNode.vue`**: Recursively renders each tree node with indentation, icons, checkboxes, role badges, mark-for-removal toggles, inline rename inputs, and emits events for all interactions. Maintains computed metadata for selection hierarchy and permission inheritance.
- **`PermissionsPanel.vue`**: Surfaces selected items (with counts by type), chips for roles, “show more” modals for long selections, and AD-driven user detail/group modals. Buttons disable automatically until selections, target users, and role changes exist.
- **i18n**: `useI18n.js` stores the active locale, updates HTML attributes for accessibility, and substitutes parameters inside translation strings defined in `i18n/translations.js`. Supports RTL mirroring for Persian.
- **Styling**: `style.css` and `styles/design-system.css` define CSS variables for theme tokens, grid layouts, table styling, modals, and responsive breakpoints. Mode toggles add classes to the root container for CSS-driven theming.

### Design Patterns & Techniques

- **Separation of Concerns**: Back-end routers isolate Power BI, AD, and configuration duties; front-end components are single-responsibility (tree rendering vs. permission editing vs. AD display).
- **Fail-fast validation**: Joi guards environment misconfiguration; HTTP handlers check for required payload fields and short-circuit with descriptive errors.
- **Progressive enhancement**: Optional AD features degrade gracefully if LDAP config is missing (back-end returns `adConfig: null`, UI hides search results or prompts for manual entry).
- **Batch processing + concurrency control**: Permission checks throttle upstream calls using batch arrays and `Promise.all`, reducing strain on Report Server.
- **Fallback chains**: NTLM endpoints try ID-based paths first (handles complex Unicode) and fall back to path-based OData queries, ensuring coverage of Persian or duplicated folder names.
- **Local caching**: Theme/locale preferences persist via `localStorage`, while `ReportTree` memoizes computed data structures for fluid UI updates.

### Important Configurations

- `.env` (backend) – sets ports, allowed origins, NTLM credentials, LDAP options, and rate limit thresholds.
- `frontend-vue/vite.config.js` – dev server port (3000), `/api` proxy to `http://localhost:5000`, production build chunk splitting (vendor/pinia), and `terser` minification (drops console/debugger).
- `frontend-vue/nginx.conf` – security headers, gzip, static caching, SPA routing fallback, `/api` proxy to backend service hostname.
- `docker-compose.yml` – service definitions, port mappings (`5000`, `80`), restart policies, health checks, and env file injection for backend secrets.

### Complex or Critical Logic

- **Permission intersection (`permissions.js`):** After collecting each user’s accessible items, the service normalizes paths (decoding + slash dedupe), attempts multiple match strategies (ID ➝ normalized path ➝ folder+name), and computes role intersections so only commonly shared roles survive.
- **AD manager chain detection (`adHelper.js`):** Uses a visited set to prevent infinite loops and marks nodes as top-level if circular references occur, ensuring UI hierarchies do not hang.
- **Tree search filtering (`ReportTree.vue`):** When searching, only nodes that match the query (by report name or folder path) render; parent folder creation is suppressed unless the report itself matches, avoiding misleading folder-only matches and keeping large trees performant.
- **Inline rename (`reports.js`):** For folders, the backend must first GET the folder by Path to obtain GUIDs before PATCHing; error handling surfaces partial failures so the UI can prompt the user appropriately.

## Project Workflow

### End-to-End Execution

1. **Connect**
   - User selects a predefined server (`/api/config/servers`) or inputs a custom URI.
   - Frontend calls `/api/reports/list`; backend authenticates via NTLM and returns normalized items.
2. **Explore & Select**
   - Tree/table view supports search, quick filters by folder/PBIX/RDL, expand/collapse, and automatic parent selection.
   - Multi-select checkboxes build `selectedItems`; removal mode marks nodes with red “X” for revocation without deletion.
3. **Choose Principals**
   - AD search box streams queries to `/api/ad/search`, tagging results with status icons (active/inactive users, groups).
   - Users can open detail modals (user profile, manager chain, direct reports, group members) for due diligence before applying changes.
4. **Assign Roles**
   - Role chips (Browser, Content Manager, My Reports, Publisher, Report Builder) allow selective assignment or “Select All”. Backend enforces canonical role definitions.
5. **Apply Permissions**
   - Clicking “Apply” sends one payload per user selection with all targeted items, inheriting existing policies and performing adds, updates, or removals based on user input.
6. **Verify**
   - “Check Permissions” triggers `/api/permissions/check` for selected principals, returning full catalogs or mutual intersections. UI overlays icons/role badges directly in the tree for at-a-glance auditing.
7. **Audit & Iterate**
   - Users may rename items, revisit AD context, or repeat operations. Toast notifications confirm successes or display error summaries from backend responses.

### Data Flow Narrative

1. **Frontend ➝ Backend**: All API calls originate from Axios within Vue components.
2. **Backend ➝ Power BI Report Server**: `httpntlm` uses service credentials to call Report Server REST endpoints, retrieving catalog data or writing policies.
3. **Backend ➝ Active Directory**: `ldapjs` binds with service accounts and executes subtree searches or base queries, translating LDAP entries into JSON payloads.
4. **Backend ➝ Frontend**: JSON responses include success flags, counts, errors (if partial failures), and additional context (e.g., policy roles, AD metadata).
5. **Frontend Rendering Loop**: Pinia-ready stores and component-level refs/computed properties render the UI, while watchers respond to state changes (e.g., clearing selections when server changes).

## Maintenance & Future Development

### Extension Guidelines

- **Backend**
  - Reuse `logger` for observability and prefer router-level separation for new domains (e.g., audit logs, templates).
  - Extend `validateEnv` whenever new environment variables are introduced to keep boot-time checks aligned.
  - Preserve NTLM credential isolation; never accept credentials from the browser.
- **Frontend**
  - Keep heavy logic inside composables or dedicated components to maintain App.vue readability.
  - Follow existing patterns for modals and watchers when adding new AD or permission features.
  - Update `translations.js` and `useI18n` when introducing new copy; confirm RTL compatibility.
- **Testing & QA**
  - Unit-test router helpers (NTLM/LDAP functions) with mocks to avoid regression when adjusting request batching.
  - For UI, consider Cypress or Vitest + Vue Test Utils focusing on tree selection, role assignment, and AD modal flows.

### Sensitive Areas

- **NTLM & LDAP Credentials:** Stored in `.env`; ensure files remain outside source control and volumes. Audit scripts before sharing.
- **Rate Limiting & Timeouts:** Adjust carefully; lowering limits may impact large organizations, raising them could expose APIs to brute force attempts.
- **Unicode Path Handling:** Path-based OData filters must remain properly escaped to support Persian and duplicated folder names; test thoroughly when altering string helpers.
- **AD Size Limits:** Increasing search sizeLimit may affect performance; consider pagination before raising above 500/10,000 defaults.

### Suggested Enhancements

Leverage the curated roadmap in `suggestions/recommended-improvements.md` for strategic direction:

- **Audit logging & compliance** – persistent change history, exportable reports.
- **Permission templates & analytics dashboards** – reuseable role bundles, heatmaps for over-privileged principals.
- **Scheduled/temporary access & approval workflows** – auto-expiring grants, manager approvals with notification hooks.
- **Performance tuning** – Redis caching, pagination, virtual scrolling, job queues for bulk operations.
- **Security upgrades** – MFA layers, IP allowlists, per-user rate limits, OAuth/OIDC integration.
- **Integrations** – ServiceNow, Teams/Slack alerts, Power Automate connectors.

Prioritize features based on compliance requirements and available infrastructure (e.g., database or message queue) additions.

## Appendices

### Sample API Payloads

- **List Reports**

  ```json
  {
    "serverUri": "https://reports.my-domain.local/Reports"
  }
  ```

- **Set Permissions**

  ```json
  {
    "serverUri": "https://reports.my-domain.local/Reports",
    "itemId": "1f0a2f0d-...",
    "itemPath": "/Finance/Dashboards/Revenue",
    "itemType": "Report",
    "userName": "DOMAIN\\jdoe",
    "roles": ["Browser", "Publisher"]
  }
  ```

- **AD Search**

  ```json
  {
    "ldapUrl": "ldap://10.0.0.5",
    "bindDN": "service.account@domain.com",
    "bindPassword": "••••••",
    "searchBase": "DC=domain,DC=com",
    "searchFilter": "finance"
  }
  ```

### Environment Reference

```env
PORT=5000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost
PBI_DOMAIN=YOURDOMAIN
PBI_USER=svc-report
PBI_PASSWORD=********
PBI_SERVER_URL_1=https://pbi-server1/Power_BI
LDAP_URL=ldap://192.168.1.10
LDAP_BIND_DN=svc-account@domain.com
LDAP_BIND_PASSWORD=********
LDAP_SEARCH_BASE=DC=domain,DC=com
RATE_LIMIT_MAX=100
```

### Ports & Services

- `80` – Vue SPA via Nginx container (reverse proxies `/api`).
- `5000` – Express backend service.
- `5173` / `3000` – Vite dev servers during local development.

### Additional Notes

- The repository already includes English and Persian documentation (`README.md`, `DOCUMENTATION_PERSIAN.md`). Keep `project-documentation.md` as the primary technical reference and update it after each major milestone to satisfy the “read before coding” directive.
- No local database schema exists; all state changes operate directly against Power BI Report Server policies and Active Directory records. Future persistence (audit logs, templates) will require selecting a backing store and updating this document accordingly.
