# 09 - Observability And Support Spec

## Purpose

Define logs, metrics, traces, alerting signals, dashboards, support diagnostics, support bundles, and safe debugging for centralized MotsDits.

Observability must help operators solve failures without exposing user audio or transcript content by default.

This file must be usable on its own after a long pause in development. A future implementation plan must be able to answer what gets logged, what must never be logged, which metrics exist, which alerts matter, what support can export, how correlation IDs connect desktop/API/worker flows, and how leak tests prove diagnostics are safe.

## Scope

This spec defines:

- Required log events and log fields.
- Redaction and forbidden content rules.
- Required metrics and operational signals.
- Tracing and correlation requirements.
- Dashboard and alerting expectations.
- Support bundle content and workflow.
- Diagnostic UX for desktop/admin/operator.
- Retention and access boundaries for observability data.
- Tests for observability and sensitive-data leakage.

This spec does not define:

- Exact logging vendor.
- Exact metrics backend.
- Exact tracing backend.
- Exact dashboard tool.
- Exact alerting vendor.

Those details belong in implementation planning, but they must not contradict this file.

## Required Logs

Log events:

- API request received/completed.
- Authentication failure category.
- Authorization rejection category.
- Policy fetch.
- Policy cache/freshness error.
- Transcription request/job created.
- Transcription request/job state transition.
- Work handoff accepted/rejected.
- Worker accepted/claimed work.
- Worker completed work.
- Worker failed work.
- Cancellation requested/completed/failed if supported.
- Quota rejection.
- Rate-limit rejection.
- Upload/audio validation rejection.
- Retention cleanup.
- Retention cleanup failure.
- Admin policy change.
- User/device/credential revocation.
- Support bundle generated/exported/deleted.

Every log should include where applicable:

- Timestamp.
- Level.
- Service name.
- Service version.
- Environment/deployment label.
- Correlation ID.
- Job/work ID.
- Organization ID or hashed/scoped organization reference.
- User/device ID or hashed/scoped reference when needed.
- Safe error code.
- Policy version when relevant.
- Processing mode when relevant.

Logs must not include by default:

- Raw audio.
- Audio chunks.
- Full transcript.
- Partial transcript.
- Prompt content if sensitive.
- Custom words if sensitive.
- Credentials/tokens.
- Secrets.
- Full request bodies.
- Full response bodies.

Redaction requirements:

- Redaction must happen before logs leave process boundaries where practical.
- Redaction must be tested with synthetic markers.
- Debug logs must follow the same sensitive-data restrictions unless a separate explicit sensitive export policy exists.
- Log levels must be configurable without enabling sensitive payload dumps by accident.

## Required Metrics

API metrics:

- Request count.
- Error count by code.
- Latency.
- Auth failures.
- Authorization rejections.
- Upload rejection count.
- Rate-limit rejection count.
- Policy rejection count.

Job/work metrics:

- Requests/jobs created.
- Requests/jobs pending handoff when applicable.
- Requests/jobs processing.
- Requests/jobs completed.
- Requests/jobs failed by reason.
- Requests/jobs cancelled.
- End-to-end transcription latency.
- Handoff/backlog wait time when applicable.
- Cleanup failures.

Worker metrics:

- Worker up/down.
- Worker readiness.
- Worker version/capability.
- Active jobs/work.
- Model load time.
- Inference time.
- CPU/GPU/fake mode.
- GPU availability if available.
- GPU memory if available.
- Worker memory if available.

Usage metrics:

- Transcription minutes.
- Jobs per organization.
- Quota consumption.
- Model usage distribution.
- Rejection counts by organization and safe category.
- Support bundle generation count.

Privacy rule:

- Metrics must not contain transcript/audio content.
- Metric labels/tags must avoid high-cardinality sensitive data such as raw user email, raw transcript, raw prompt, raw file name, or credential material.
- Organization/user/device labels should be scoped, hashed, or otherwise safe according to deployment needs.

## Alerting And Dashboards

Alerts should detect operational problems without requiring content access.

Recommended alert categories:

- API unavailable.
- API readiness failing.
- Auth failure spike.
- Policy rejection spike.
- Upload/audio validation rejection spike.
- Worker unavailable.
- Worker capacity saturated.
- GPU unavailable if GPU processing is used.
- Handoff/backlog depth high when applicable.
- Job/work failure rate high.
- End-to-end latency high.
- Retention cleanup failure.
- Support bundle export failure or unusual sensitive export if such export is ever allowed.

Dashboard should show:

- API health and latency.
- Job/work lifecycle counts.
- Worker health/capacity/version.
- Handoff/backlog depth when applicable.
- Error categories.
- Usage/quota summary.
- Cleanup health.
- Version mismatch summary.

No alert/dashboard may expose raw audio or transcript content by default.

SLO/SLA rule:

- Internal SLO-style signals may be tracked before commercial SLA exists.
- Customer-visible SLA promises must not be made until operations, monitoring, incident process, and contractual terms exist.

## Tracing

Distributed tracing is recommended for MVP/full enterprise.

Trace should connect:

- Desktop request correlation ID.
- API request validation.
- Policy/auth/quota decision.
- Upload/audio validation if applicable.
- Job/work creation.
- Job handoff enqueue/dequeue or equivalent worker handoff step.
- Worker processing.
- Result delivery.
- Cleanup path if relevant.

Tracing rules:

- Trace IDs/correlation IDs must not contain personal data.
- Trace attributes must not include raw audio/transcript/prompt/credentials.
- Sampling must preserve enough failures for debugging.
- Traces are recommended for MVP/full enterprise, but the spec does not force a tracing vendor.

## Support Bundles

Support bundles must be policy-controlled.

Default included:

- App/API/worker version.
- Platform.
- Environment/deployment label.
- Config summary with secrets redacted.
- Policy version/status.
- Recent safe logs.
- Correlation IDs.
- Error codes.
- Health endpoint summaries.
- Worker capability summary if relevant.

Default excluded:

- Raw audio.
- Audio chunks.
- Full transcript.
- Partial transcript.
- Prompt content if sensitive.
- Custom words if sensitive.
- Credentials/tokens/secrets.
- Full request/response payloads.

If sensitive content inclusion is ever supported:

- Must require explicit admin/user consent according to policy.
- Must be clearly labeled.
- Must be audited.
- Must have expiration/deletion path.
- Must have TTL.
- Must never include credentials/secrets.

Support workflow requirements:

- Support bundle generation must record who generated it when identity exists.
- Support bundle export/download must be audited when admin/operator identities exist.
- Support bundle deletion/expiration must be observable.
- Support bundles must be redacted before export.
- Support bundles must be safe for AI/developer analysis by default because they exclude customer content.

## Diagnostic UX

Desktop should expose:

- Server connection status.
- Last remote error code.
- Correlation ID for support.
- Policy version and freshness.
- App version.
- Active processing mode.
- Whether diagnostics/support bundle is allowed by policy.

Admin/operator should expose:

- Queue/backlog depth when applicable.
- Worker health/capacity/version.
- Recent error categories.
- Usage/quotas.
- Version mismatches.
- Cleanup failures.
- Support bundle generation/export status.

Diagnostic UX must not expose:

- Raw audio.
- Transcript text.
- Credentials/secrets.
- Full request/response payloads.

## Observability Retention And Access

Observability data has its own retention and access concerns.

Requirements:

- Log retention must be defined.
- Metrics retention must be defined.
- Trace retention must be defined if traces exist.
- Support bundle retention must be defined.
- Access to logs/metrics/traces/support bundles must be role-scoped.
- Operators can diagnose without transcript/audio access by default.
- Retention must account for managed cloud versus self-hosted deployment differences.

## Open Decisions For Future Planning

These decisions are intentionally not forced by this spec:

1. Exact logging backend.
2. Exact metrics backend.
3. Exact tracing backend.
4. Exact dashboard/alerting tool.
5. Log/metric/trace retention durations.
6. Whether traces are required in the first MVP or later.
7. Whether sensitive support export is ever allowed.
8. Whether customer-visible SLO/SLA reporting is ever offered.

The implementation plan must resolve these before development starts.

## Required Tests

### Log Safety Tests

- Raw audio marker does not appear in logs.
- Transcript marker does not appear in logs by default.
- Credential/secret marker does not appear in logs.
- Full request/response body is not logged by default.
- Debug log mode does not enable sensitive payload dumps accidentally.

### Metrics And Trace Tests

- Metrics do not contain transcript/audio content.
- Metrics labels do not include raw user email or credentials.
- Correlation ID connects desktop/API/worker path.
- Trace attributes do not include sensitive payloads if tracing exists.

### Support Bundle Tests

- Default support bundle excludes audio/transcript/secrets.
- Support bundle includes versions, policy status, correlation IDs, health summary, and safe logs.
- Sensitive support export, if enabled, requires policy/consent/audit/TTL.
- Support bundle expiration/deletion is observable.

### Operator Diagnostic Tests

- Operator can diagnose server unavailable without content access.
- Operator can diagnose worker unavailable without content access.
- Operator can diagnose auth/policy/audio/storage categories from safe data.
- Operator can find a failure by correlation ID.

## Acceptance Checklist

This spec is satisfied when:

- Required logs and metrics are defined.
- Sensitive logging restrictions and redaction rules are explicit.
- Alerting/dashboard signals are defined without forcing a vendor.
- Correlation IDs are central across desktop/API/worker flows.
- Trace rules are defined if tracing exists.
- Support bundles are safe by default.
- Support bundle workflow, audit, TTL, and deletion are defined.
- Observability retention and access boundaries are defined.
- Operators can diagnose failures without content access.
- Tests prove logs/metrics/traces/support bundles do not leak sensitive content.
- Open decisions are listed instead of hidden.
