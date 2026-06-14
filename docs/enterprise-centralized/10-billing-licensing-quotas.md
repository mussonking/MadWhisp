# 10 - Billing, Licensing, And Quotas Spec

## Purpose

Define usage accounting, quotas, rate limits, license states, cost controls, admin visibility, and user-facing quota behavior for centralized MotsDits.

Even if no public billing exists at first, centralized transcription consumes server/GPU resources and requires limits.

This file must be usable on its own after a long pause in development. A future implementation plan must be able to answer what usage is counted, what is never counted, when quota is checked, how retries avoid double counting, which limits protect infrastructure, what license states exist, and what errors users/admins see.

## Scope

This spec defines:

- Usage accounting fields and privacy boundaries.
- Quota and rate-limit types.
- License model options without forcing payment processing.
- Enforcement timing and retry/idempotency behavior.
- Cost controls for server/GPU/worker resources.
- Admin and user visibility.
- Tests for accounting, quota, rate limits, and privacy.

This spec does not define:

- Exact payment processor.
- Exact pricing.
- Exact SKU/package names.
- Exact contract terms.
- Exact license server implementation.

Those details belong in business/legal implementation planning, but they must not contradict this file.

## Required Usage Accounting

Track:

- Number of requests/jobs.
- Audio duration submitted.
- Audio duration successfully transcribed.
- Processing mode.
- Model used.
- Model/runtime class if needed for cost accounting.
- Organization ID or scoped organization reference.
- User/device ID if policy allows.
- Job success/failure/cancellation category.
- Retry count.
- Worker mode: CPU, GPU, or fake/test.
- Storage usage for retained metadata/transcripts/audio if enabled.
- Support bundle count if billing/support limits ever depend on it.

Do not track by default:

- Raw audio.
- Full transcript content.
- Prompt content.
- Custom words if sensitive.
- Credentials/secrets.

Usage accounting must be privacy-preserving and must follow the security/privacy spec.

## Quota Types

Possible quotas:

- Minutes per organization.
- Jobs per organization.
- Jobs per user.
- Concurrent jobs per organization.
- Maximum audio duration per job.
- Maximum upload size per job.
- Rate limit per user/device/IP.

Pilot required quotas:

- Max duration.
- Max upload size.
- Basic rate limit.

MVP required quotas:

- Organization usage limit.
- Concurrent job/work limit.
- Quota exceeded error.
- Admin visibility into usage.
- Rate-limit behavior for abuse protection.

Additional quota options:

- Minutes per model class.
- GPU minutes.
- Storage retained by policy.
- Support bundle generation count.
- External post-processing calls if server-side post-processing exists.

## Enforcement Timing

Quota/rate-limit checks must happen before expensive processing whenever possible.

Required enforcement points:

- Before accepting oversized upload.
- Before creating/starting transcription work.
- Before worker handoff where possible.
- Before retry if retry could consume additional resources.
- Before server-side post-processing if enabled.

Accounting rules:

- Rejected requests may be counted separately from successful usage.
- Retries must not double count the same idempotent work.
- Cancelled work must have a defined accounting rule.
- Failed work must have a defined accounting rule.
- Fake/test worker usage must not count as billable production usage unless explicitly configured for a test billing scenario.

## License Models

Possible licensing:

- Self-hosted license credential/key.
- Per-seat license.
- Per-minute usage.
- Flat organization license.
- Managed service contract.
- Trial/evaluation license.
- Offline/self-hosted license file if needed.

License states:

- active.
- trial.
- expired.
- suspended.
- over_quota.
- disabled.
- unknown/unreachable license check if external license service is used.

First implementation recommendation:

- Do not build payment processing first.
- Build usage accounting and quota enforcement first.
- Keep license checks simple and explicit.
- Support self-hosted/manual license state before payment automation if selling enterprise pilots.

Rules:

- License failure behavior must be explicit: fail closed, grace period, local-only fallback, or admin warning.
- Expired/suspended license must not produce vague server errors.
- License checks must not require storing audio/transcripts.
- Payment processing is out of scope until explicitly selected.

## Cost Controls

Required:

- Reject too-long recordings.
- Reject too-large uploads.
- Limit concurrent jobs/work.
- Limit retries.
- Avoid duplicate usage accounting on retry.
- Monitor GPU utilization if GPU processing is used.
- Monitor worker saturation.
- Monitor handoff/backlog depth if applicable.
- Apply backpressure before overload becomes outage.
- Separate abuse/rate-limit controls from business quota controls.

Cost drivers to track internally:

- Audio minutes.
- Model/runtime class.
- CPU/GPU processing time.
- Worker concurrency.
- Storage retention.
- External post-processing calls if enabled.
- Managed infrastructure deployment size if managed service is offered.

## Admin Visibility

Admins should see:

- Current usage versus quota.
- Quota period if periods exist.
- Rejections by quota/rate-limit category.
- Top-level model usage distribution.
- Concurrent job/work limit status.
- License state if licensing exists.
- Whether usage data excludes content.

Admins should not see by default:

- Raw transcripts.
- Raw audio.
- Prompt content.
- Credentials/secrets.

Operators should see infrastructure cost-control signals without transcript/audio access.

## User-Facing Quota Errors

Quota/license/cost-control errors must be clear:

- Quota exceeded.
- Recording too long.
- Upload too large.
- Too many concurrent jobs/work.
- Rate limit exceeded.
- Server busy/overloaded.
- License expired.
- License suspended.
- License check unavailable if external check exists.

Each must include:

- Stable error code.
- Retryable true/false.
- Whether waiting may help.
- Whether admin action is needed.
- Admin contact suggestion if organization-managed.
- Safe user-facing message without pricing internals unless intentionally exposed.

## Privacy And Compliance Boundaries

Billing/usage must not become a reason to store sensitive content by default.

Rules:

- No raw audio for billing by default.
- No transcript text for billing by default.
- No prompt/custom word content for billing by default.
- Usage exports must be metadata-only by default.
- If invoices/reports are generated, they must avoid sensitive transcript/audio content.
- Usage data retention must be defined.

## Open Decisions For Future Planning

These decisions are intentionally not forced by this spec:

1. Whether the first pilot has license enforcement or only quotas/rate limits.
2. Exact quota period: daily, monthly, rolling, contract-defined, or none for pilot.
3. Whether failed/cancelled jobs count against usage.
4. Whether GPU minutes are tracked separately.
5. Whether self-hosted deployments use offline license files or manual config.
6. Whether managed service billing is per-seat, per-minute, flat contract, or not built yet.
7. Whether quota overage has hard block, soft warning, grace period, or admin override.
8. Whether usage exports are needed in MVP.

The implementation plan must resolve these before development starts.

## Required Tests

### Usage Accounting Tests

- Successful job increments expected usage counters.
- Rejected oversized upload increments rejection counters but not successful transcription minutes.
- Idempotent retry does not double count successful usage.
- Failed job accounting follows defined rule.
- Cancelled job accounting follows defined rule.
- Fake/test worker usage does not count as production usage by default.

### Quota And Rate-Limit Tests

- Max duration is enforced before expensive processing.
- Max upload size is enforced before storage/worker handoff where possible.
- Concurrent work limit is enforced.
- Organization quota exceeded returns stable error.
- Rate limit exceeded returns stable error distinct from business quota.
- Retry limit prevents retry storms.

### License Tests

- Active license permits configured usage.
- Expired/suspended/disabled license returns stable error if license enforcement exists.
- Unknown license-check state follows configured fail-open/fail-closed/grace behavior.

### Privacy Tests

- Usage records do not include raw audio.
- Usage records do not include transcript text.
- Usage exports do not include credentials/secrets.
- Admin usage view does not expose content by default.

## Acceptance Checklist

This spec is satisfied when:

- Usage accounting fields are defined.
- Usage privacy boundaries are explicit.
- Pilot and MVP quotas are defined.
- Quota/rate-limit/license errors are stable and user-safe.
- Enforcement timing is defined.
- Retry/idempotency/cancellation accounting is defined.
- Cost controls are required.
- Admin/operator visibility is defined without content access.
- License model options are defined without forcing payment processing.
- Billing is not overbuilt before quotas and accounting exist.
- Required accounting/quota/license/privacy tests are defined.
- Open decisions are listed instead of hidden.
