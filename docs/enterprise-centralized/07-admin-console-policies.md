# 07 - Admin Console And Policies Spec

## Purpose

Define administrative controls, central policies, user/device management, quota visibility, support diagnostics, audit visibility, and organization-level configuration for MotsDits Enterprise.

The admin surface may start as configuration files, CLI tooling, admin API, or a web console, but the required capabilities must be known before implementation.

This file must be usable on its own after a long pause in development. A future implementation plan must be able to answer which policies exist, who can change them, how changes are validated/audited/versioned, what admins can see, what operators can diagnose, and what content access is forbidden by default.

## Scope

This spec defines:

- Admin surface maturity from pilot to full enterprise.
- Required policy categories.
- Policy validation, versioning, rollout, rollback, and audit behavior.
- User/device management requirements.
- Usage, health, support, and diagnostic visibility.
- Admin/operator/owner boundaries.
- Content access restrictions.
- Tests required for admin and policy behavior.

This spec does not define:

- Exact admin UI layout.
- Exact frontend framework.
- Exact API route paths.
- Exact billing provider.
- Exact SSO provider.

Those details belong in implementation planning or other spec sheets, but they must not contradict this file.

## Admin Surface Maturity

### Pilot

Acceptable admin surface:

- Config file.
- CLI admin command.
- Minimal admin API.
- Manual database seed only if tightly controlled and documented.

Pilot must still support:

- Configure organization policy.
- Create/revoke credentials.
- Configure retention.
- View basic system health.

### MVP

Expected admin surface:

- Admin API and/or simple web console.
- User/device management.
- Policy editing.
- Usage visibility.
- Worker and job handoff health summary.
- Audit visibility for admin/security actions.

### Full Enterprise

Expected admin surface:

- Mature admin surface, usually a web admin console, but not forced if an API/CLI-managed deployment is intentionally chosen.
- SSO/identity provider configuration if SSO is supported.
- Audit log export.
- Advanced policy management.
- License/billing visibility if billing/licensing is implemented.
- Support diagnostics with privacy-safe defaults.

## Required Policy Categories

### Processing Mode Policy

Controls:

- Local transcription allowed.
- Remote transcription allowed.
- Remote transcription required.
- Local fallback allowed.
- Remote fallback allowed.
- Fallback direction: remote to local, local to remote, or both.
- User can choose mode.
- User can disconnect from managed mode.

Rules:

- Remote required means desktop must not use local fallback.
- Local-only means desktop must not send audio to server.
- User-choice mode must show the active mode clearly.
- Fallback direction must be explicit.
- Managed disconnect must be explicit because it affects whether organization policy can be bypassed.

### Model Policy

Controls:

- Allowed models.
- Default model.
- GPU-only or CPU-allowed models.
- Maximum model size if relevant.

Rules:

- Client requested model must be validated server-side.
- Worker must reject unsupported model.

### Audio Policy

Controls:

- Maximum recording duration.
- Maximum upload size.
- Allowed audio formats.
- Temporary storage allowed.
- Audio retention duration.
- Audio deletion behavior after success/failure/cancellation/timeout.
- Whether temporary object storage is allowed.
- Whether audio may ever be included in support bundles, default false.

### History Policy

Controls:

- Local history allowed.
- Server transcript storage allowed.
- Metadata-only history allowed.
- Retention duration for stored transcript.
- Whether history includes processing mode, model, policy version, and server job ID.
- Whether users can delete their own history if server history exists.
- Whether admins can view aggregate history metadata without transcript content.

### Post-Processing Policy

Controls:

- Post-processing allowed.
- Server-side post-processing allowed.
- Client-side external post-processing allowed.
- Allowed providers.
- Approved prompts/templates.

Rule:

- External post-processing must be explicit because it can send transcript text outside the central server.

### Custom Words Policy

Controls:

- User custom words allowed.
- Organization word list enabled.
- Organization word list required.
- User can override organization entries.
- Aliases/blacklist allowed.

### Diagnostics Policy

Controls:

- Client debug logs allowed.
- Server debug logs allowed.
- Worker debug logs allowed.
- Support bundle generation allowed.
- Include transcript text in support bundle: default false.
- Include audio in support bundle: default false.
- Support bundle TTL.
- Whether operators can generate support bundles.
- Whether user/admin consent is required before sensitive content inclusion.

Rules:

- Credentials/secrets must never be included in support bundles.
- Transcript/audio inclusion must be explicit, policy-controlled, audited, and disabled by default.

### Security And Access Policy

Controls:

- Allowed authentication methods.
- SSO/identity provider enabled if supported.
- Required re-authentication for high-risk admin actions.
- Admin/operator role capabilities.
- Session duration if configurable.
- Device enrollment allowed.
- Device revocation allowed.
- Minimum client version if version policy exists.

## Policy Validation And Change Workflow

Every policy change must be validated before it becomes active.

Requirements:

- Reject contradictory policies such as remote required while remote disabled.
- Reject fallback policies that violate processing-mode rules.
- Reject retention policies without a duration when storage is enabled.
- Reject support-bundle policies that include sensitive content without audit/TTL controls.
- Validate default model is included in allowed models.
- Validate max duration/upload limits are within server capability.
- Require role authorization for policy changes.
- Create audit event for policy changes.
- Increment policy version on every effective change.

Recommended workflow for MVP/full enterprise:

- Draft policy.
- Validate policy.
- Apply policy.
- Audit policy change.
- Desktop fetches new policy version.

Rollback requirements:

- Previous policy version should be recoverable or at least visible.
- Rollback must be audited.
- Rollback must still pass current validation rules.

## User Management

Admin must eventually be able to:

- List users.
- Invite users.
- Activate users.
- Suspend users.
- Disable users.
- Change roles.
- View last active timestamp.
- View app versions by user/device.
- Revoke user sessions/credentials.

Admin must not automatically be able to:

- Read all user transcripts.
- Download user audio.
- Export sensitive support bundles without policy/audit controls.

User list requirements:

- Pagination.
- Filtering by status/role where applicable.
- No raw credential display.
- Audit for role/status changes.

## Device Management

Admin must eventually be able to:

- List devices.
- See pending/active/disabled/revoked status.
- Revoke devices.
- Disable devices.
- See platform and app version.
- See last seen timestamp.
- See last policy version seen.
- Require re-authentication.
- Create or view enrollment method if supported.

Device list requirements:

- Pagination.
- Filtering by status/platform/version where applicable.
- No raw credential display.
- Audit for revocation/disable/re-enable actions.

## Usage Visibility

Admin should see:

- Total transcription minutes.
- Jobs by state.
- Errors by category.
- Quota consumption.
- Average latency.
- Job handoff/backlog delay if applicable.
- Worker availability.
- Model usage distribution.
- Rejection counts for policy/quota/rate-limit/audio validation.

Admin should not see by default:

- Raw transcripts.
- Raw audio.
- Prompt content if sensitive.
- Custom words if sensitive.

Operator should see:

- System health.
- Worker health/capacity.
- Job handoff backlog/depth if applicable.
- Error categories.
- Version mismatches.
- Cleanup failures.

Operator should not see by default:

- Raw transcripts.
- Raw audio.
- Credentials/secrets.

## Policy Versioning

Requirements:

- Every policy has a version.
- Desktop reports current cached policy version.
- Policy changes are audited.
- Desktop can detect stale policy.
- Server can reject or refresh requests using expired policy where applicable.
- Policy version should be included in diagnostics and history metadata when history is enabled.

## Audit And Content Access Boundaries

Admin/operator access must follow least privilege.

Required audit events:

- Policy changed.
- Policy rollback.
- User invited/activated/suspended/disabled.
- Role changed.
- Device enrolled/disabled/revoked.
- Credential/session revoked.
- Retention setting changed.
- Audio/transcript storage setting changed.
- Support bundle generated/exported/deleted.
- Sensitive content access if ever allowed.
- SSO/identity provider setting changed if supported.

Content access rules:

- Admins and operators do not receive transcript/audio access by default.
- If sensitive content access is ever added, it must be explicit, role-scoped, policy-controlled, audited, and visible to the organization.
- Support diagnostics must work without content access by default.

## Open Decisions For Future Planning

These decisions are intentionally not forced by this spec:

1. First admin surface: config file, CLI, admin API, simple web console, or combination.
2. Whether a web admin console is required for the first MVP.
3. Which role model ships first: Admin only, Admin+Operator, or Admin+Operator+Owner.
4. Whether policy rollback is implemented in the first MVP or only policy history is visible.
5. Whether any sensitive support export is ever allowed.
6. Whether server-side transcript history is enabled in the first pilot.
7. Whether billing/license controls are visible before billing enforcement exists.
8. Whether SSO configuration is in the first enterprise release or future scope.

The implementation plan must resolve these before development starts.

## Required Tests

### Policy Tests

- Remote required with remote disabled is rejected.
- Local-only policy prevents remote upload.
- Fallback direction is explicit and enforced.
- Default model must be in allowed model list.
- Retention storage enabled without duration is rejected.
- Support bundle audio/transcript inclusion requires explicit policy.
- Policy change increments version and creates audit event.
- Desktop stale policy detection works through policy version/freshness.

### Admin Authorization Tests

- Member cannot edit policy.
- Operator cannot edit policy unless explicitly allowed.
- Admin can edit allowed policies.
- Owner-only action rejects Admin if Owner role exists.
- Cross-organization admin access is rejected.

### User And Device Management Tests

- Admin can invite/activate/suspend/disable user according to role.
- Suspended/disabled user cannot transcribe.
- Admin can revoke/disable device.
- Revoked/disabled device cannot fetch policy or transcribe.
- Lists are paginated and do not expose credentials.

### Privacy And Support Tests

- Admin usage view does not expose transcripts/audio by default.
- Operator diagnostics do not expose transcripts/audio by default.
- Support bundle excludes secrets/audio/transcripts by default.
- Sensitive support export, if enabled, is audited and TTL-controlled.

## Acceptance Checklist

This spec is satisfied when:

- Required policies are defined.
- Pilot/MVP/full admin surfaces are distinguished without forcing a web console too early.
- Policy validation/change/rollback/audit workflow is defined.
- Admin/operator/owner boundaries are explicit.
- Admin powers are separated from content access.
- User/device/usage requirements are explicit.
- Support diagnostics are privacy-safe by default.
- Policy versioning is required.
- Policy tests, admin authorization tests, user/device tests, and privacy/support tests are defined.
- Open decisions are listed instead of hidden.
