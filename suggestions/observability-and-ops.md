# Observability stack with tracing and metrics

## Feature overview
Add structured telemetry across the stack: instrument the backend with OpenTelemetry to emit distributed traces, request/NTLM timings, and LDAP call metrics to Prometheus/Grafana or Azure Monitor. Layer in structured JSON logs with correlation ids, expose `/healthz` and `/readyz` endpoints, and ship Dockerfiles with baked-in log shipping (Fluent Bit) for production deployments.

## Why it improves the project
When NTLM calls slow down or AD lookups fail intermittently, operators currently have only console logs to diagnose issues. Observability makes latency spikes and failure rates visible, accelerates incident response, and enables capacity planning. Health probes also unlock orchestrated rollouts in Kubernetes or Swarm.

## How much cost
Medium (1 sprint). Requires introducing OpenTelemetry SDKs, wiring exporters, enriching existing logger usage, adding metrics middleware, and updating Docker Compose/Kubernetes manifests.

## Whats benefit
- Shortens time-to-diagnose for Power BI or LDAP outages.
- Provides dashboards for concurrency, queue depth, and cache hit rates.
- Supports service-level objectives (SLOs) for enterprise customers.
- Simplifies support by correlating user actions with backend events.

## Usecase
An ops engineer sees permission batches slowing down. Grafana displays NTLM call latency and queue backlog, revealing a specific Power BI server struggling. They throttle batch concurrency temporarily and alert the downstream team with concrete evidence.


