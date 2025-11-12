# Modularize frontend state with Pinia and composables

## Feature overview
Refactor the Vue app to centralize state management using Pinia stores (for selected items, connection info, AD lookups, theme). Break the monolithic `PermissionsPanel.vue` into smaller composables and components, introduce TypeScript typings, and add service modules for API calls with unified error handling and retry helpers.

## Why it improves the project
The current panel component exceeds 3,000 lines, mixes API calls, UI logic, and derived state, and uses ad-hoc refs that are hard to test. Modularizing reduces cognitive load, makes bug fixing faster, and prepares the codebase for new panels (templates, history views) without duplicating logic.

## How much cost
Medium (1 sprint). Requires introducing Pinia, migrating existing reactive state, carving out API service wrappers, and gradually converting files to TypeScript for stronger tooling.

## Whats benefit
- Simplifies maintenance by isolating responsibilities.
- Enables reuse of AD/search logic across future features.
- Improves developer onboarding and reduces regression risk during edits.
- Unlocks better IDE autocompletion and type safety.

## Usecase
Future features like permission drift dashboards or job history panels can consume the same Pinia stores for catalog data and AD users, eliminating copy-paste logic and ensuring consistent behavior throughout the app.


