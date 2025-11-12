# Permission audit trails and compliance reporting

## Feature overview

Implement a current-permissions cache that keeps an up-to-date map of report and folder access for every user and group. The backend normalizes the latest permissions on each API call (or scheduled sync), stores them in a fast datastore, and exposes instant lookup endpoints so administrators can retrieve “who has access to what right now” without waiting for fresh queries against Power BI Report Server.

## Why it improves the project

- Removes the need to repeatedly hit the Report Server just to answer “can user X see report Y?”, keeping the UI snappy even in large environments.
- Provides a single source of truth for current access, simplifying troubleshooting and reducing guesswork when triaging support requests.
- Enables quick user-centric views and comparisons (e.g., show everything a user or group can access, or verify that a newly provisioned user inherited the correct roles).
- Sets the foundation for future enhancements (like drift detection) while staying lightweight for teams that only need the latest state.

## Usefulness assessment

- **Impact:** High for daily operations. Admins can confirm access in seconds, accelerating onboarding, offboarding, and help-desk responses.
- **Effort:** Medium. Requires introducing a cache layer, expanding backend APIs, and adding a new UI panel, but avoids long-term historical storage.
- **Differentiation:** Solid. Many Power BI tools manage permissions but still rely on live queries for validation; instant lookups provide a notable productivity boost.

## Implementation roadmap

1. **Architecture and planning**
   - Decide on the cache technology: Redis (in-memory) for quickest reads or a relational table (e.g., SQLite/PostgreSQL) for simplicity.
   - Define schemas for `current_user_permissions` and `current_item_permissions`, including indexes for user, group, path, and role.
   - Extend environment configuration and Docker Compose to provision the chosen datastore.
2. **Backend foundations**
   - Add a data-access layer to read/write the cache efficiently.
   - Update existing `/api/permissions` routes to write the latest state into the cache whenever permissions are set or fetched.
   - Introduce `/api/permissions/user/:principalId` and `/api/permissions/item/:itemId` endpoints that respond directly from the cache.
   - Implement a “refresh from source” endpoint and optional scheduled job to resync data with the Report Server.
3. **Frontend experience**
   - Build a new Vue panel that allows administrators to search for a user or group and immediately view all accessible reports/folders.
   - Add quick filters (by role, by folder/report type) and inline actions to jump to items or copy results.
   - Integrate loading/error states and tooltips explaining when data was last refreshed.
4. **Monitoring and safeguards**
   - Log cache misses and refresh durations to ensure the system remains in sync with the Report Server.
   - Provide basic alerting (e.g., toast or log warning) if the cache grows stale or refresh fails.
5. **Testing and validation**
   - Write unit tests for cache reads/writes and the new lookup endpoints.
   - Add integration tests ensuring permission changes propagate to the cache and surface in the UI immediately.
   - Load-test cache refresh routines on representative data volumes to verify performance.
6. **Documentation and rollout**
   - Update setup instructions with cache configuration and environment variables.
   - Document admin workflows for refreshing and verifying permissions.
   - Highlight the new instant lookup capability in release notes and onboarding materials.

