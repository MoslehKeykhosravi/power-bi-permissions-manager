# Add permission drift detection and alerting

## Feature overview
Build a background job that snapshots catalog permissions at each sync, compares them with the previous state, and highlights adds/removes/role changes per user or group. Expose a new dashboard that surfaces high-impact diffs, allows exports, and ships optional webhook/email alerts when critical assets lose required access or inherit unexpected roles.

## Why it improves the project
Daily administrators want to know not just the current truth (already supported) but who changed what and when. Drift detection turns the manager into a proactive guardrail: it spots accidental removals before executives complain, flags shadow admins, and supports auditors with ready-made evidence.

## How much cost
Medium-High (2–3 sprints). Needs a historical table (PostgreSQL/SQLite) for permission versions, a comparison engine, scheduling logic, UI to review changes, and plumbing for alert destinations.

## Whats benefit
- Prevents regressions after bulk edits or external tooling runs.
- Offers governance teams timestamped evidence without manual exports.
- Enables incident response playbooks (“who granted Publisher to group X?”).
- Differentiates the product from simple CRUD helpers.

## Usecase
Compliance officers can subscribe to alerts on key folders. When an unauthorized role appears, they get an email with the delta, the actor (if known), and links to remediate directly inside the portal.


