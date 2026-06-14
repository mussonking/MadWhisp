# 12 - Roadmap And Implementation Order

## Purpose

Define the implementation order for MotsDits Enterprise centralized transcription.

This is not a schedule. It contains no dates and no time estimates. It defines sequencing, gates, and what must be tested before moving forward.

This file must be usable on its own after a long pause in development. A future implementation plan must be able to follow the order here without accidentally forcing a deployment topology, auth method, worker handoff, GPU runtime, billing system, web admin console, SSO provider, or public SaaS architecture before those decisions are explicitly resolved.

## Roadmap Rules

- No dates.
- No time estimates.
- No forced queue/polling/streaming choice.
- No forced GPU choice.
- No forced web admin console.
- No forced payment processor.
- No forced SSO.
- No compliance/SLA/region claim until the relevant specs and operational gates are satisfied.
- Every stage must leave local-first behavior protected.
- Every stage that touches audio/transcript/credentials must include leak tests or safe diagnostics.

## Rule Before Implementation

Before implementation starts:

1. Review `master-spec.md`.
2. Review each numbered spec sheet one by one.
3. Update `13-review-checklist.md`.
4. Resolve open decisions.
5. Only then create an implementation plan.

## Stage 0 - Confirm Target Pilot Shape

Decisions required:

- First deployment target: local developer server, self-hosted, or managed single-tenant.
- First auth method: server-issued pilot credential, device code, login, or another explicitly supported credential method.
- First transcription lifecycle: synchronous, async polling, chunked upload, streaming, or another explicitly selected lifecycle.
- First worker shape: in-process, external worker, fake deterministic worker, real inference worker, or a combination.
- First job handoff mechanism if worker is not in-process.
- First desktop platform target.
- First admin surface: config file, CLI, admin API, simple web console, or combination.
- First retention policy for audio/transcripts/support bundles.
- First quota/rate-limit/accounting scope.
- Whether local fallback is allowed in the first pilot.
- Whether external post-processing is allowed in enterprise mode.
- Whether any license enforcement exists in the first pilot or only usage/quota controls.

Gate to exit:

- Decisions are written in the specs or plan.
- Out-of-scope items remain explicit.
- The selected lifecycle/handoff/auth/admin choices do not contradict specs 01-11.
- Privacy/security defaults are written before implementation begins.

Tests:

- Documentation consistency check.
- Spec checklist review.

## Stage 1 - Test Harness Foundation

Build first because future development needs autonomous verification.

Implement:

- Synthetic audio fixtures.
- Fake deterministic worker contract for the selected lifecycle/handoff.
- Test-mode output capture concept for desktop/backend.
- Test credential/config isolation.
- Basic log/support leak scanner.
- Initial test command names.
- Machine-readable test report shape.

Gate to exit:

- AI can run a deterministic non-microphone test.
- Test reports are understandable.
- Leak scanner can detect forbidden audio/transcript/credential markers.
- Test environment cannot touch production config by accident.

Tests:

- Fixture validation.
- Fake worker returns deterministic transcript.
- Leak scanner detects forbidden marker in intentionally unsafe log.

## Stage 2 - Server API Skeleton

Implement:

- API service skeleton.
- Health/readiness/version endpoints.
- Capability discovery shape.
- Stable error shape.
- Correlation ID handling.
- Config loading and unsafe production config rejection.
- Basic structured logging with redaction.

Gate to exit:

- API starts locally.
- Health/readiness/version work.
- Capability discovery does not force unsupported features.
- Errors have stable shape.
- Logs include correlation IDs and no secrets.

Tests:

- API health/version tests.
- Capability discovery tests.
- Error shape tests.
- Log redaction tests.
- Unsafe config rejection tests.

## Stage 3 - Pilot Authentication And Policy

Implement:

- Pilot auth method.
- Credential validation/revocation for the selected auth method.
- Organization/policy representation.
- Policy fetch endpoint with version/freshness fields.
- Basic role/permission checks if admin endpoint exists.
- Revoked/expired/disabled access handling.

Gate to exit:

- Authenticated client can fetch policy.
- Unauthenticated client is rejected.
- Revoked/expired/invalid credential is rejected.
- Disabled organization/user/device is rejected where applicable.

Tests:

- Auth success.
- Auth failure.
- Revoked/expired credential failure.
- Disabled org/user/device failure where applicable.
- Policy fetch with version/freshness.
- Member/admin permission boundary if present.

## Stage 4 - Transcription API Lifecycle

Implement:

- Selected first lifecycle from the open decision: synchronous, async polling, chunked upload, or streaming.
- Request/job creation contract if asynchronous lifecycle is selected.
- Audio metadata validation.
- Max size/duration checks.
- Work handoff to the selected worker mechanism.
- Job state/result retrieval if asynchronous lifecycle is selected.
- Cancellation contract if selected for pilot.
- Basic quota/rate limit if selected for pilot.
- Idempotency contract if selected for pilot.

Gate to exit:

- Valid transcription request reaches the selected worker handoff path.
- Invalid requests are rejected before worker processing.
- Client can receive the result through the selected lifecycle.

Tests:

- Valid request accepted.
- Too-large rejected.
- Too-long rejected.
- Unsupported format rejected.
- Unauthenticated rejected.
- Quota/rate limit behavior if implemented.
- Idempotent retry behavior if implemented.
- Cancellation behavior if implemented.

## Stage 5 - Fake Worker End-To-End

Implement:

- Fake deterministic worker consumes work through the selected handoff mechanism.
- Fake worker writes or returns result through the selected lifecycle.
- API returns result.
- End-to-end test from API submit to result.

Gate to exit:

- Full server-side deterministic E2E works without desktop.
- No raw audio/transcript/credential markers in logs or support output.

Tests:

- API + selected handoff/lifecycle + fake worker happy path.
- Fake worker failure path.
- Log/support leak scan.

## Stage 6 - Desktop Remote Configuration

Implement:

- Remote server config storage.
- Connection test.
- Auth state display.
- Policy fetch/cache/freshness from desktop.
- Mode selection logic.
- Remote/local/fallback status display.
- Local-first migration safety.
- Desktop test mode configuration using test credential.

Gate to exit:

- Fresh app remains local.
- User/test harness can configure remote server.
- Desktop can fetch policy and detect stale/expired policy.
- UI/status exposes local vs remote and fallback availability.

Tests:

- Settings migration preserves local mode.
- Connection test success/failure.
- Policy fetch success/failure/stale/expired.
- Mode precedence tests.
- Test credential config isolation.
- Local-first migration regression.

## Stage 7 - Desktop Remote Transcription With Fake Worker

Implement:

- Desktop sends synthetic/test audio to server.
- Server hands off work through the selected transcription lifecycle.
- Fake worker returns deterministic transcript.
- Desktop receives result.
- Desktop captures paste output in test mode.
- History obeys policy.

Gate to exit:

- AI can run complete desktop-to-server-to-worker-to-desktop test without microphone.
- Failure states are visible to desktop.

Tests:

- Remote happy path.
- Server unavailable.
- Credential expired/revoked.
- Policy blocks local/remote as expected.
- History disabled policy.
- Quota/rate-limit failure if implemented.
- Cancellation if implemented.
- Log/support leak scan.

## Stage 8 - Real Worker Prototype

Implement:

- Real transcription worker for one supported model/backend.
- Model loading/config.
- Audio decoding for selected format.
- Worker metrics.
- Worker health/version/capability reporting.
- Failure classification.
- Real worker remains behind selected lifecycle/handoff contract.

Gate to exit:

- Real worker can transcribe reference fixture.
- Real worker errors are safe and mapped.
- Fake worker remains available for deterministic tests.

Tests:

- Real model smoke test if model available.
- Missing model failure.
- Corrupt audio failure.
- Worker temp cleanup.
- Worker metrics present.
- Worker health/version/capability visible.

## Stage 9 - Admin/Operations MVP

Implement:

- Minimal admin surface.
- User/device lifecycle selected for MVP.
- Policy editing with validation/versioning/audit.
- Usage/quota visibility.
- Worker and job handoff/backlog health view.
- Audit events for admin changes.
- Support diagnostics safe by default.

Gate to exit:

- Admin can manage access/policy without direct database edits.
- Operators can see health, worker state, and job handoff/backlog state when applicable.

Tests:

- Admin policy update.
- Member blocked from admin update.
- Device revocation.
- Audit event created.
- Usage counter increments.
- Admin/operator views do not expose audio/transcript by default.

## Stage 10 - Security, Privacy, Quota, And Observability Hardening

Implement:

- Retention cleanup.
- Stronger secret handling.
- Rate limits.
- Quota/accounting enforcement selected for MVP.
- Cross-org tests if multi-org exists.
- Support bundle redaction.
- Audit log completeness.
- Observability retention/access rules.
- Alert/dashboard signals selected for MVP.

Gate to exit:

- Security/privacy acceptance criteria pass.
- Logs/support bundles are safe by default.
- Quota/rate-limit behavior is stable and user-safe if enabled.
- Operators can diagnose without content access by default.

Tests:

- Audio deleted after job/cancel/timeout.
- Transcript not logged by default.
- Credential/token not logged.
- Revoked access blocked.
- Retention cleanup.
- Support bundle excludes audio/transcript/secrets by default.
- Usage accounting avoids content and avoids double counting idempotent retry if implemented.

## Stage 11 - Packaging And Deployment

Implement:

- Deployment docs/scripts.
- Config templates with unsafe production config checks.
- Health/version/capability check docs.
- Backup/restore guidance.
- Upgrade/migration/rollback guidance.
- Operational runbooks.
- Desktop enterprise config packaging if needed.

Gate to exit:

- A new environment can be deployed from documented steps.
- Desktop can connect to that environment.
- Operators can run basic runbooks without content access.
- No SLA/RTO/RPO/region/compliance claim is implied unless separately implemented and documented.

Tests:

- Fresh deployment smoke.
- Upgrade smoke.
- Backup/restore smoke if implemented.
- Runbook smoke for health, restart, rollback guidance, and cleanup failure diagnosis.

## Stage 12 - Release Readiness Review

Do not ship enterprise centralized mode before:

- Specs are reviewed.
- Open decisions for shipped scope are resolved.
- Autonomous E2E passes.
- Security leak tests pass.
- Local-first behavior is verified.
- Remote mode is visibly labeled.
- Failure UX is tested.
- Credential revocation/access-loss behavior is tested.
- Policy freshness/expiration behavior is tested.
- Quota/rate-limit behavior is tested if enabled.
- Support bundles are safe by default.
- Deployment docs exist.
- Operational runbooks exist for shipped topology.
- Known limitations are documented.
- Product/marketing copy does not claim compliance, SLA, region, SSO, multi-tenant SaaS, billing, or enterprise features that are not implemented.

## Always-Run Regression Gates

Before claiming a stage complete:

- Relevant unit tests.
- Relevant integration tests.
- Log/support leak scan if audio/transcript/credential/support behavior is involved.
- Desktop UI/test-mode check if user-visible behavior changed.
- Local mode regression if desktop transcription behavior changed.
- Policy/auth/quota regression if those decisions are touched.
- Cleanup/retention regression if audio/artifact/support-bundle lifecycle is touched.
- Test report includes correlation IDs and artifact paths for failures.
