# Virtualize and cache the report tree

## Feature overview
Replace the current all-in-memory tree rendering with a virtualized viewport (Vue Virtual Scroll List or custom IntersectionObserver solution) backed by lazy-loaded child nodes and indexed caching. The frontend only renders visible branches, and the backend exposes endpoints to fetch paginated children and metadata hashes to detect changes without refetching everything.

## Why it improves the project
Large Power BI instances can have thousands of folders and reports. Rendering every node at once and shipping full payloads hurts initial load, scrolling, and memory usage. Virtualization keeps the UI snappy regardless of catalog size and reduces backend bandwidth by delivering only what is needed.

## How much cost
Medium (1 sprint). Requires refactoring the tree components, adding a small client-side cache, and augmenting the `/api/reports/list` endpoint to support delta or child-only queries.

## Whats benefit
- Initial load drops from seconds to milliseconds even with huge catalogs.
- Browser memory footprint and re-render counts decrease drastically.
- Paves the way for per-branch permission previews without costly loops.
- Improves accessibility by keeping DOM size manageable.

## Usecase
Global enterprises with tens of thousands of catalog items can scroll effortlessly, expand deep branches instantly, and avoid browser stalls when selecting large sets for bulk edits.


