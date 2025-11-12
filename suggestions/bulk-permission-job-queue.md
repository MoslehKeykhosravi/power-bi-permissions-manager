# Queue-based bulk permission engine

## Feature overview
Introduce a background job queue (BullMQ, RabbitMQ, or Azure Storage Queues) that offloads bulk permission changes and report syncs from the request/response path. The UI submits batches, receives a job id, and polls or subscribes to status updates. Workers execute NTLM calls with configurable concurrency, retries, and circuit breakers.

## Why it improves the project
Current bulk operations run synchronously, tying up HTTP connections and risking timeouts when a tree selection includes dozens of reports. A queue decouples user actions from long-running NTLM chatter, prevents UI freezes, and paves the way for horizontal scaling (multiple workers processing jobs in parallel).

## How much cost
Medium (1–2 sprints). Requires selecting a queue backend, adding worker containers, refactoring `/api/permissions/set` to enqueue jobs, and exposing progress endpoints/events to the Vue app.

## Whats benefit
- Eliminates front-end spinner stalls and HTTP 504s on large batches.
- Gives administrators progress visibility and retry controls.
- Reduces load spikes on the Power BI server through rate scheduling.
- Eases future migration to cloud hosting with autoscaled workers.

## Usecase
When a department restructure requires updating hundreds of items, admins submit the job once, monitor progress in a jobs panel, and receive a toast or email when the queue finishes or needs attention.


