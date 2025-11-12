# End-to-end test automation and CI pipeline

## Feature overview
Set up automated testing across backend and frontend: Jest + supertest for Express routes (mocking NTLM/LDAP calls), Vue Test Utils for critical components, and Playwright smoke tests that exercise report loading and permission edits via mocked servers. Wire the suites into a CI pipeline (GitHub Actions or Azure DevOps) that lints, tests, builds Docker images, and publishes results on every pull request.

## Why it improves the project
Right now there is no safety net preventing regressions in API handlers, AD integrations, or complex UI workflows. Automated tests plus CI catch bugs before they hit production, encourage contributions, and shorten the feedback loop for maintainers. They also document expected behavior better than prose.

## How much cost
Medium (1 sprint to bootstrap). Requires factoring logic into testable units, adding mocks for NTLM/LDAP, configuring test runners, and authoring an initial set of happy-path and failure-path cases.

## Whats benefit
- Prevents accidental breakage when refactoring NTLM helpers or Vue components.
- Enables confident upgrades of dependencies (httpntlm, ldapjs, Vue, Vite).
- Provides contributors with fast feedback on PRs.
- Improves release velocity by automating build and regression checks.

## Usecase
Before merging a branch that optimizes permission checks, the developer pushes a PR. GitHub Actions runs lint, unit, and Playwright tests against mocked Power BI endpoints and flags a failing edge case, saving hours of manual QA.


