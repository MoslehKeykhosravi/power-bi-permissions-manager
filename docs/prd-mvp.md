## Power BI Permissions Manager – MVP PRD

### 1. Overview
- **Vision**: Deliver a browser-based control plane that centralizes discovery, auditing, and management of Power BI Report Server permissions while keeping Power BI and LDAP credentials secured server-side.
- **Problem**: Legacy SSRS/Report Server tooling is slow, requires RDP, and lacks AD context, making least-privilege enforcement difficult.
- **Principles**: Security-first (server-held creds, rate limiting), operator productivity (batch actions, AD enrichment), portable deployments (Docker + manual scripts).

### 2. Target Users & Use Cases
- **Power BI platform admins** need quick insight into catalog permissions to apply bulk fixes.
- **Security & compliance officers** must audit mutual access and document quarterly reviews.
- **Support engineers** handle ad-hoc access requests and verify AD details before granting roles.

### 3. Goals & KPIs
- Cut time to audit a department’s access footprint by ≥50% vs native tools.
- Complete bulk permission change (≥5 assets, ≥2 principals) in <3 minutes.
- Keep NTLM/LDAP credentials server-only; zero exposure in client payloads.
- Ship dual-language UX (EN/FA) and tri-theme (light/dark/system) with <200 KB frontend bundle.

### 4. MVP Scope
- **Server Connectivity**: `/api/config/servers` returns predefined URIs; backend injects NTLM creds.
- **Catalog Exploration**: Combined folder/PBIX/RDL tree with search, filters, auto-select parents, rename flows.
- **Permission Management**: Fetch/check/apply policies for Browser, Content Manager, My Reports, Publisher, Report Builder roles with username normalization.
- **AD Enrichment**: Search, user profiles, manager chain, direct reports, group memberships, departments, locations via backend LDAP fallbacks.
- **UI Foundations**: Vue 3 SPA, tri-theme toggle, RTL support, responsive layout, toast notifications.
- **Deployment Tooling**: Docker Compose (frontend, backend, Nginx) plus manual Node/Vite dev scripts.
- **Security Controls**: Helmet, CORS allowlists, rate limiting (100 req/15 min), 30 s timeouts, Joi validation, server-only secrets.

### 5. Out of Scope (MVP)
- Persistent storage (audit logs, templates).
- Approval workflows, scheduled/temporary access.
- External notifications/integrations (ServiceNow, Teams, Slack).
- MFA/OIDC layers.
- Performance enhancements beyond current batching/throttling.

### 6. User Stories & Acceptance Criteria
1. **Catalog Discovery**: Admin loads authorized server and sees searchable tree (folders/reports with filters) within 5 s.
2. **Bulk Permission Application**: Admin selects assets, principals, roles, and applies changes once; UI shows granular success/errors.
3. **Permission Audit**: Compliance officer runs “Check Permissions” to view mutual roles per item; tree overlays role badges.
4. **AD Context Lookup**: Admin inspects user’s AD profile, hierarchy, groups before granting access; degrades gracefully when LDAP missing.
5. **Theme/Locale Control**: User toggles language (EN/FA) and theme (Light/Dark/System) with persisted preferences and proper RTL behavior.

### 7. End-to-End Flows
1. **Connect**: Choose server → `/api/reports/list` → backend merges catalog with NTLM creds.
2. **Select**: Filter tree → select assets → stage principals via AD search.
3. **Apply**: Submit `/api/permissions/set` → backend merges policies (ID-first fallback to path) → toast results.
4. **Audit**: Run `/api/permissions/check` → backend batches (20 items) → UI overlays role badges.
5. **Review AD**: Open detail modals hitting `/api/ad/user/details`, `/manager-chain`, `/group/members`.

### 8. Functional Requirements
- **FR1**: Backend must perform NTLM-authenticated GET/PATCH/PUT to Power BI `/api/v2.0` using `.env` credentials.
- **FR2**: Tree UI must handle ≥1,000 catalog items with sub-200 ms expand/collapse via memoization.
- **FR3**: Permission mutations validate requested roles against canonical list; reject invalid roles with descriptive errors.
- **FR4**: AD APIs fall back to `.env` LDAP credentials when request omits them and enforce size/time limits.
- **FR5**: `/api/permissions/check` batches catalog lookups (20 items) with Promise concurrency caps.
- **FR6**: Frontend supports English/Persian translations, toggles `document.dir`, and persists selections (locale/theme) via `localStorage`.

### 9. Non-Functional Requirements
- **Security**: Helmet, CORS allowlists, rate limiting, request timeout, backend-only secret custody.
- **Performance**: Catalog responses <2 s (assuming upstream health); UI actions <100 ms perceived latency.
- **Reliability**: Health endpoints (`/health`, frontend HEAD) monitored; Docker scripts restart on failure.
- **Scalability**: Stateless backend suitable for horizontal scaling.
- **Accessibility**: Keyboard navigation, high-contrast compliance, RTL correctness.

### 10. Dependencies & Constraints
- **External Systems**: Power BI Report Server REST API, Active Directory/LDAP.
- **Tech Stack**: Vue 3 + Vite, Pinia (optional), Axios, Node 18, Express, httpntlm, ldapjs, Joi, Winston/Morgan.
- **Infra**: Docker 20.10+, Docker Compose 2+, optional reverse proxy for SSL.
- **Constraint**: No internal DB; state lives in Power BI catalog + AD.

### 11. Release Criteria
- All MVP user stories validated against staging Report Server + AD.
- Backend lint/tests (`npm run lint`, `npm test`) pass; frontend builds via Vite without errors.
- Documentation (`README.md`, `[project-name].md`, `project-documentation.md`) updated for deviations.
- Docker Compose deployment verified (health checks green; Nginx serves SPA, proxies `/api`).

### 12. Success Metrics (Post-MVP)
- ≥80% of permission-change requests routed through the tool within first quarter.
- Mean time to grant/revoke access <5 minutes.
- Zero incidents of credential exposure via frontend payloads.
- User satisfaction survey ≥4/5 among target admins.

### 13. Risks & Mitigations
- **Upstream Latency/Failures**: Batch tuning, retries, user-facing error summaries.
- **LDAP Schema Variance**: Configurable attribute mapping, null-safe parsing.
- **Large Catalog Performance**: Memoization now, roadmap for pagination/virtual scroll.
- **Security Surface**: Continuous review of headers, CORS, log redaction.

### 14. Open Questions
- Do auditors need export/download of permission snapshots for MVP?
- Is SSO/OIDC required shortly after MVP (affecting architecture)?
- Are there departments that prohibit Docker, requiring alternative deployment packaging?

### 15. Related Documents & Ownership Boundaries
- **`[project-name].md` – Engineering Guide**: Required pre-flight read for contributors. Captures architecture deltas, security/process guardrails, and (future) schema definitions. Update this first whenever core layers, infra, or migrations change.
- **`project-documentation.md` – Deep Technical Reference**: End-to-end architecture, setup instructions, workflows, Docker/Nginx internals, and extension guidelines. Treat as the canonical “how the system works under the hood” companion to this PRD.
- **`README.md` – Product & Onboarding Overview**: Public-facing summary of features, quick start, API samples, troubleshooting, and contribution steps. Keep concise for newcomers; surface only the most critical getting-started info.
- **`DOCUMENTATION_PERSIAN.md` – Persian Translation**: Full localized version of the technical narrative for Persian-speaking stakeholders. Update in parallel with major README/project-documentation changes to maintain parity.

> **Guidance:** Use this PRD for product intent, MVP scope, and requirement traceability. Drill into the referenced documents for implementation specifics, setup details, or localized explanations instead of duplicating content here. When a change affects multiple scopes, update the relevant source file and link back to it from this PRD if helpful.


