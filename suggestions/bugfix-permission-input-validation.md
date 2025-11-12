# Harden permission input validation

## Feature overview
Add request validation middleware (Joi, Zod, or express-validator) on `/api/permissions/*` endpoints to enforce required fields, ensure `roles` is an array of known values, and guard against empty payloads. Replace `console.log` calls with the shared logger so errors surface consistently.

## Why it improves the project
The current code assumes `roles` exists and is iterable; malformed requests (or UI regressions) will trigger runtime errors and return 500s without clear messages. Validating upfront prevents crashes, improves error responses, and standardizes logging for easier debugging.

## How much cost
Low (≤1 day). Involves defining Joi schemas, adding middleware, updating routes to depend on sanitized inputs, and swapping logging statements to `logger`.

## Whats benefit
- Eliminates brittle `roles.join` failures and similar runtime exceptions.
- Produces consistent, localized error messages for the frontend.
- Shields the backend from crafted requests that bypass the UI.
- Moves the project closer to production-grade API hygiene.

## Usecase
When a future UI update accidentally sends `roles: null`, the backend now returns a 400 with a descriptive error instead of throwing, allowing developers to diagnose and ship a fix quickly.


