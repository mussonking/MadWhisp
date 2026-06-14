# 03 - Server API Spec

## Purpose

Define the central server API required for enterprise centralized transcription.

The server API is the boundary between MotsDits desktop clients, admin/operator tooling, authentication, job handoff, transcription workers, and observability.

This file must be usable on its own after a long pause in development. A future implementation plan must be able to answer what the server API must accept, reject, return, store, expose, redact, version, and test without relying on memory.

## Scope

This spec defines:

- API responsibilities and non-responsibilities.
- Required endpoint categories without forcing exact routes.
- Authentication, authorization, policy, transcription, admin, metrics, and diagnostic contracts.
- Job/request lifecycle options.
- Error, correlation, idempotency, storage, security, compatibility, and test requirements.

This spec does not define:

- Exact HTTP paths.
- Exact framework or programming language.
- Exact database, queue, or object storage product.
- Exact authentication provider.
- Exact worker implementation.
- Exact admin console UI.

Those details belong in implementation planning or other spec sheets, but they must not contradict this file.

## Server API Responsibilities

The central API must:

- Authenticate clients.
- Authorize users/devices/organizations.
- Serve organization policy.
- Accept transcription requests.
- Validate audio metadata and limits.
- Create or execute transcription work depending on selected transport/lifecycle.
- Return transcription results.
- Expose health and readiness checks.
- Expose safe diagnostics and metrics endpoints.
- Support admin operations if no separate admin service exists.
- Provide stable error contracts for desktop clients.
- Enforce retention and logging rules at the API boundary.
- Provide version/compatibility information for desktop and worker clients.

The central API must not:

- Log raw audio.
- Log secrets.
- Treat organization isolation as optional.
- Accept unbounded audio uploads.
- Allow anonymous production transcription unless explicitly configured for local development.
- Trust client-provided organization/user/device identifiers without authenticated authorization.
- Expose worker-internal endpoints publicly.
- Leak transcript text in logs, metrics, traces, or support output by default.

## API Maturity Levels

### Pilot API

Minimum endpoints:

- Health check.
- Authenticate or validate token.
- Fetch policy.
- Submit transcription job.
- Poll job result or synchronous result endpoint.
- Basic metrics.

### MVP API

Additional endpoints:

- User/session management.
- Device registration/revocation.
- Organization settings.
- Usage reporting.
- Quota enforcement.
- Job history metadata.
- Admin endpoints.

### Full Enterprise API

Additional endpoints:

- SSO/OIDC integration.
- Audit log export.
- Tenant/organization lifecycle.
- Policy versioning.
- Worker fleet visibility.
- Support bundle generation.
- Billing/license enforcement.

## Required API Endpoint Categories

### Health And Version Endpoints

Required:

- Liveness: process is running.
- Readiness: API can serve requests.
- Dependency readiness: database, job handoff backend, storage, worker availability if needed.
- Version: API version, build version, supported client protocol versions, and supported feature flags/capabilities.

Rules:

- Liveness must not require database if the goal is only process health.
- Readiness must fail if required dependencies are unavailable.
- Health responses must not expose secrets.
- Public health may be minimal; authenticated/operator health may include dependency detail.
- Version responses must not expose secrets or internal topology.

### Authentication Endpoints

Possible pilot choices:

- Token validation endpoint.
- Login endpoint.
- Device code flow endpoint.

Required behavior:

- Invalid credentials return a stable auth error code.
- Expired credentials return a distinct stable error code.
- Revoked credentials return a distinct stable error code.
- Authentication failures are rate-limited.
- Credential/token material is never returned in logs.

### Policy Endpoints

Required behavior:

- Return organization policy for the authenticated user/device.
- Include policy version.
- Include effective mode settings.
- Include limits relevant to recording/upload.
- Include retention settings.
- Include model/post-processing permissions.
- Include fallback permissions and fallback direction.
- Include policy cache maximum age or expiration guidance.
- Include whether user/device may disconnect from managed mode if applicable.
- Include support bundle and diagnostic permissions.

Policy response must be cacheable by the client with a freshness indicator and expiration/freshness rule.

Policy endpoint must distinguish:

- Policy loaded successfully.
- Policy unavailable temporarily.
- Policy not found.
- User/device revoked.
- Organization disabled.
- Client version unsupported.

### Capability Discovery Endpoint

The API must expose enough capability information for the desktop to avoid guessing.

Required capability categories:

- Supported API/protocol versions.
- Supported transcription lifecycle modes: synchronous, asynchronous job, chunked upload, streaming.
- Supported audio formats.
- Maximum upload size.
- Maximum duration.
- Supported authentication/enrollment flows.
- Whether cancellation is supported.
- Whether partial transcripts are supported.
- Whether idempotency keys are supported.
- Whether server-side post-processing is supported.

Capability discovery may be part of version, policy, or a dedicated endpoint, but the contract must exist.

### Transcription Request And Job Endpoints

The first implementation may choose synchronous request/response, asynchronous job flow, chunked upload, or streaming. This spec does not force the first transport.

Supported lifecycle options:

- Synchronous request/response: acceptable for short pilot requests if timeout and size limits are strict.
- Asynchronous job with polling: preferred robust design for longer requests and worker queues.
- Asynchronous job with subscription/events: possible future improvement.
- Chunked upload: useful for large recordings or unreliable networks.
- Streaming: future option unless live partial transcripts are explicitly required.

Preferred robust asynchronous design:

1. Client creates job and uploads or references audio.
2. Server validates request.
3. Server hands off work to worker infrastructure.
4. Client polls or subscribes for result.
5. Server returns final result.

Minimum job states when asynchronous jobs are used:

- accepted.
- uploading if upload is separate/chunked.
- queued.
- processing.
- completed.
- failed.
- cancelling.
- cancelled.
- expired.

Minimum result states when synchronous requests are used:

- completed.
- failed.
- timed_out.
- rejected.

Required request validation:

- Authenticated identity.
- Organization status.
- User/device status.
- Client version/protocol supported.
- Policy permission.
- Policy version if supplied.
- Audio size.
- Audio duration.
- Audio format.
- Audio sample rate and channels if required by selected format.
- Requested model allowed.
- Requested language allowed if language policy exists.
- Requested post-processing allowed.
- Quota available.
- Rate limit available.
- Request idempotency key or correlation ID.

Required result fields:

- Job ID if asynchronous.
- State.
- Transcript text when completed and policy allows returning it.
- Error code when failed.
- User-safe error message.
- Model used.
- Language if detected.
- Processing duration metadata.
- Processing mode.
- Policy version used.
- Correlation ID.
- Whether retry is allowed.
- Whether client fallback may be offered if known.

### Upload Endpoints

If audio upload is separate from job creation, upload endpoints must support:

- Authenticated upload.
- Upload size validation before storage when possible.
- Audio duration validation before worker handoff when possible.
- Content type/format validation.
- Correlation ID.
- Idempotency or resumability if supported.
- Temporary storage TTL.
- Cleanup after completion/failure/expiration.

Chunked/resumable upload is not required for the pilot unless explicitly selected.

If chunked upload is implemented, it must support:

- Chunk ordering.
- Chunk size limits.
- Upload session expiration.
- Finalization step.
- Abandonment cleanup.
- Rejection of incomplete or corrupted uploads.

### Cancellation Endpoints

Cancellation support must be explicit.

If implemented, cancellation must support:

- Authenticated cancellation request.
- Authorization check for the requesting user/device/org.
- Job state transition to cancelling/cancelled where applicable.
- Worker notification or cancellation flag where supported.
- Safe response if cancellation is requested after completion.
- Clear client response when server-side cancellation is not supported.

### Streaming Endpoints

Streaming is not required for the pilot unless explicitly selected.

If implemented, streaming must support:

- Authenticated connection.
- Audio chunk validation.
- Partial transcript events.
- Final transcript event.
- Backpressure.
- Cancellation.
- Timeout.
- Reconnect or recover policy.

Allowed transports:

- WebSocket.
- gRPC streaming.
- HTTP chunked upload with polling.

Rule:

- Do not choose streaming first unless the pilot specifically requires live partial transcripts.

### Admin Endpoints

Required by MVP if no admin console exists:

- List users/devices.
- Invite or provision users.
- Revoke users/devices.
- View organization settings.
- Update organization policy.
- View usage summary.
- View worker health summary.
- View audit events if audit is implemented.
- View current license/quota status if licensing/quotas are implemented.

Admin endpoints must require stronger authorization than normal client endpoints.

Admin API requirements:

- Pagination for list endpoints.
- Filtering where lists can grow large.
- Stable error codes.
- Audit event for security/policy changes.
- No transcript/audio content exposure by default.
- Explicit role checks for every admin action.

### Metrics Endpoints

Required:

- API request count.
- API error count.
- Job count by state.
- Queue/backlog depth if the selected handoff mechanism has a backlog.
- Job latency.
- Worker availability.
- Transcription duration.
- Quota usage.

Metrics must not include transcript text or raw audio.

## Data Contracts

### Standard Error Shape

Every API error should include:

- Stable error code.
- Safe user-facing message.
- Correlation ID.
- Retryable true/false.
- Optional policy reason.

Examples of stable error codes:

- auth.invalid_credentials.
- auth.expired_token.
- auth.revoked_token.
- auth.insufficient_role.
- org.disabled.
- device.revoked.
- client.unsupported_version.
- policy.unavailable.
- policy.expired.
- policy.conflict.
- policy.remote_disabled.
- policy.local_required.
- quota.exceeded.
- rate_limited.
- audio.too_large.
- audio.too_long.
- audio.unsupported_format.
- audio.invalid_metadata.
- upload.failed.
- upload.incomplete.
- server.overloaded.
- job.not_found.
- job.timeout.
- job.cancelled.
- worker.unavailable.
- transcription.failed.

### Correlation IDs

Every client request must have or receive a correlation ID.

Rules:

- Client may generate correlation ID.
- Server may generate if absent.
- Logs across API, queue, worker, and client must include it.
- Correlation ID must not contain personal data.

### Idempotency

Job creation should support idempotency where practical.

Purpose:

- Avoid double billing/usage when client retries upload.
- Avoid duplicate jobs from network failures.

Requirements:

- Client sends idempotency key for job creation if supported by the selected lifecycle.
- Server treats repeated key within a retention window as same request.
- Server rejects conflicting duplicate keys.
- Idempotency keys must be scoped to authenticated identity and organization.
- Idempotency keys must not contain sensitive user content.

### Pagination And List Contracts

Any endpoint that can return many records must support bounded responses.

Required for list endpoints:

- Limit/page size.
- Cursor or page token when needed.
- Stable ordering.
- Filter parameters where appropriate.
- Maximum page size.

### Compatibility And Versioning

The API must support explicit compatibility management.

Requirements:

- Desktop sends app version and protocol/API version.
- Server can reject unsupported clients with `client.unsupported_version`.
- Server exposes supported versions/capabilities.
- Breaking API changes require versioning or a coordinated migration plan.
- Error shapes must remain stable across compatible versions.

## Storage Responsibilities

The API may store:

- User/device/session metadata.
- Organization policy.
- Job metadata.
- Job state.
- Result text if policy allows.
- Usage counters.
- Audit events.
- Idempotency records.
- Temporary upload metadata.

The API must avoid storing by default:

- Raw audio after processing.
- Full transcript text in logs.
- Secrets in plaintext.

Audio storage options:

- In-memory only for small synchronous jobs.
- Temporary object storage with short TTL.
- Persistent storage only if explicitly enabled by policy.

Retention requirements:

- Temporary audio must have TTL/cleanup.
- Expired jobs/uploads must be cleaned up.
- Retention policy must be enforced by API/storage lifecycle, not only by UI promises.
- Cleanup failures must be observable without exposing content.

## Security Requirements

- All production traffic must use TLS.
- Auth required for transcription endpoints.
- Request size limits required.
- Rate limits required.
- Organization authorization required.
- Admin endpoints require admin role.
- CORS must be restrictive if browser admin console exists.
- Upload parsing must avoid unsafe file handling.
- Server must not execute client-provided commands.
- Server must not trust client-provided org/user/device fields without auth context.
- Server must validate policy on every transcription request, not only when client fetches policy.
- Server must redact secrets from logs and errors.
- Server must avoid reflecting raw request payloads in error messages.
- Public endpoints must expose the minimum safe information.

## Open Decisions For Future Planning

These decisions are intentionally not forced by this spec:

1. Exact API framework/language.
2. Exact route paths and request/response serialization format.
3. First lifecycle: synchronous, async polling, chunked upload, or streaming.
4. First auth method.
5. First persistence backend.
6. First job handoff backend.
7. Whether API and worker are one process in the pilot or separate services.
8. Whether cancellation is supported in the first pilot.
9. Whether partial transcripts are supported in the first pilot.
10. Whether admin capabilities start as config file, API, or web console.

The implementation plan must resolve these before development starts.

## Deployment Configuration

Server must be configurable through environment/config file for:

- Listen address.
- Public URL.
- Database URL.
- Job handoff/queue URL if used.
- Storage backend.
- Auth settings.
- Token signing/validation keys.
- Worker handoff settings.
- Retention settings.
- Max upload size.
- Max duration.
- Rate limits.
- CORS/admin UI origin if applicable.
- Metrics settings.
- Log level.
- Supported protocol/API versions if configurable.
- Development-mode allowances such as localhost HTTP.

## Required API Tests

### Unit Tests

- Request validation.
- Error mapping.
- Policy enforcement.
- Quota enforcement.
- Rate-limit enforcement.
- Authz checks.
- Idempotency behavior.
- Policy cache/freshness fields.
- Compatibility/version rejection.
- Pagination bounds.
- Redaction helpers.

### Integration Tests

- Health/version endpoint works.
- Capability discovery returns supported lifecycle and limits.
- Policy fetch includes version and cache/freshness rules.
- Submit valid request/job.
- Submit unauthenticated request/job.
- Submit request/job with expired token.
- Submit request/job with revoked token/device.
- Submit request/job from disabled organization.
- Submit request/job from unsupported client version.
- Submit request/job over size limit.
- Submit request/job over duration limit.
- Submit unsupported audio format.
- Submit disallowed model.
- Submit disallowed post-processing request.
- Poll completed result if async lifecycle is selected.
- Poll failed result if async lifecycle is selected.
- Cancel job if cancellation is selected.
- Verify idempotent retry if idempotency is selected.
- Ensure logs do not contain raw audio payload.
- Ensure logs do not contain transcript marker by default.
- Ensure logs do not contain token marker.

### Load/Stress Tests

- Concurrent job submissions.
- Queue overload behavior.
- Rate-limit behavior.
- Worker unavailable behavior.

## Acceptance Checklist

This spec is satisfied when:

- API responsibilities are explicit.
- Required endpoint categories are defined without forcing exact routes.
- Capability discovery and version compatibility are defined.
- Policy response cache/freshness behavior is defined.
- Transcription lifecycle options are defined without prematurely forcing sync/async/streaming.
- Upload, cancellation, and result contracts are defined where applicable.
- Job/request lifecycle is defined.
- Error shape is stable.
- Correlation and idempotency requirements are defined.
- Storage and retention responsibilities are explicit.
- Sensitive data rules are explicit.
- Auth, policy, quota, rate limits, and validation are mandatory.
- Admin list/pagination/audit requirements are explicit.
- Tests cover happy path, failure modes, compatibility, privacy, and overload behavior.
- Open decisions are listed instead of hidden.
