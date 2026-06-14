# 01 - Product Modes Spec

## Purpose

Define every supported product mode for MotsDits once enterprise centralized transcription exists.

This spec prevents confusion between the current local-first product, a self-hosted team deployment, a managed cloud deployment, and future hybrid modes.

This file must be usable on its own after a long pause in development. Any future implementation plan must treat the mode definitions and mode-selection rules here as product requirements, not suggestions.

## Scope

This spec defines:

- Which product modes exist.
- Who controls each mode.
- Where audio processing happens in each mode.
- What the user must see.
- What happens when connectivity, policy, or processing fails.
- Which modes are pilot/MVP/future targets.

This spec does not define:

- Exact API endpoint shapes.
- Exact authentication protocol.
- Exact worker implementation.
- Exact pricing or licensing.
- Exact UI layout.

Those details belong in the other spec sheets, but they must not contradict this file.

## Current Baseline

MotsDits currently behaves as a local-first desktop application:

- User records audio locally.
- VAD runs locally.
- Transcription inference runs locally.
- Word correction runs locally.
- Text is pasted locally.
- The README promises that voice does not leave the machine.

Enterprise centralized mode must not silently invalidate that baseline.

## Required Product Modes

### Mode 1: Personal Local Mode

This is the existing core mode.

Behavior:

- No account required.
- No organization required.
- No server required.
- No internet required after local dependencies/models are installed.
- Audio remains on device.
- Transcription is executed using local models.
- Local history is controlled by local user settings.
- Post-processing may call external APIs only if the user configures it explicitly.

UI requirements:

- The app can keep the existing user experience.
- No enterprise login prompt should block local use.
- Settings must not imply that remote mode is required.

Acceptance criteria:

- A fresh install can still perform local transcription without enterprise configuration.
- Existing local shortcut behavior continues to work.
- If no enterprise server is configured, no transcription audio is sent over the network.

### Mode 2: Personal Remote Server Mode

This is an optional mode where a single user points the desktop app at a server without full organization management.

Behavior:

- User configures a server endpoint manually.
- User authenticates with a server-issued pilot credential, login, or another explicitly supported credential type.
- Audio is sent to the configured server for transcription.
- The app receives text and pastes it locally.
- Local fallback may be available if the user's settings allow it.
- No organization administrator controls the device.

Use case:

- Power user runs a GPU server on their LAN.
- Developer tests enterprise server without full organization management.
- Early pilot validates remote transcription plumbing before enterprise admin features exist.

Requirements:

- Must show a clear remote mode indicator.
- Must validate server identity through TLS for production use.
- Must support connection testing from settings.
- Must fail safely if server is unreachable.
- Must allow the user to disconnect and return to personal local mode.
- Must not imply enterprise compliance, team management, or SLA.

Non-goal:

- This mode does not need full admin policy management.
- This mode does not prove enterprise readiness by itself.

### Mode 3: Enterprise Self-Hosted Mode

This is the preferred first professional target.

Behavior:

- Organization deploys its own MotsDits Enterprise Server.
- Desktop clients authenticate to that server.
- Organization controls policies.
- Transcription runs on organization-controlled infrastructure.
- Admins can manage users/devices/configuration.

Requirements:

- Server endpoint can be preconfigured.
- Organization policy can lock transcription mode.
- Organization can disable local history.
- Organization can enforce no audio persistence.
- Organization can restrict models.
- Organization can revoke user/device access.
- Organization can define whether users may switch back to local mode.
- Desktop must show that the device is connected to an organization-managed server.
- If organization policy is unavailable, the app must use cached policy only if the cached policy is still valid; otherwise it must fail closed for organization-managed remote requirements.

Deployment expectation:

- Single organization per deployment for first version.
- Multi-organization support may be added later, but is not required for the first self-hosted version.

### Mode 4: Managed Single-Tenant Cloud Mode

This is a cloud deployment managed by the product owner for one customer organization.

Behavior:

- Similar to self-hosted mode, but infrastructure is operated by the product owner.
- Customer organization has isolated infrastructure or strong logical isolation.
- Support and upgrades are provided centrally.

Requirements:

- Clear data processing terms.
- Clear region choice if needed.
- Operational monitoring by product owner.
- Customer-specific admin controls.
- Strong isolation from other customers.

Risk:

- This increases legal, security, privacy, and operational burden.

### Mode 5: Managed Multi-Tenant SaaS Mode

This is a future cloud platform where multiple organizations share infrastructure.

Behavior:

- Multiple organizations exist in one shared backend.
- Strong tenant isolation is mandatory.
- Billing/quotas become central.
- Abuse prevention becomes central.
- Compliance requirements increase.

Status:

- Not required for first enterprise pilot.
- Not recommended as first target unless the business explicitly chooses SaaS-first.

Requirements if later built:

- Tenant isolation at every data layer.
- Organization-scoped authz checks on every endpoint.
- Per-tenant quotas.
- Per-tenant audit logs.
- Per-tenant retention policies.
- Support tooling that avoids cross-tenant data exposure.

### Mode 6: Hybrid Local + Remote Mode

This mode allows local and remote transcription to coexist.

Possible behavior:

- Local is default, remote is used for large models.
- Remote is default, local is fallback.
- Admin policy decides which workflows use which mode.
- User can choose per-transcription if allowed.
- Short recordings use local mode while long/heavy jobs use remote mode if policy allows.

Requirements:

- UI must make the active processing location obvious.
- Settings must define fallback behavior.
- Errors must say whether local or remote failed.
- History must record processing mode if history is enabled.
- The app must show when the next retry will use a different processing location.
- The app must record whether a transcript was produced locally or remotely if any history entry is kept.

Risks:

- Hybrid behavior can confuse users.
- Policy conflicts must be resolved predictably.
- Privacy expectations can be violated if fallback silently sends audio remote.
- Support/debugging becomes harder because the same shortcut can take different processing paths.

Rule:

- Never fallback from local to remote without explicit user/admin consent.
- Never hide a switch between remote and local processing paths.
- If a recording has already been captured under one privacy expectation, do not reuse it under a different processing location unless the user/admin policy explicitly permits that retry.

## Mode Selection Priority

When deciding mode at runtime, precedence must be:

1. Organization policy if the device is managed.
2. User-selected mode if unmanaged.
3. Safe local default if no remote server is configured.
4. Fail closed if remote is required but unreachable.

Resolution rules:

- Managed policy beats local user preference.
- Unmanaged user preference beats auto-detection.
- Safe local default beats remote convenience.
- Privacy expectation beats retry convenience.
- A remote-required policy must not silently become local.
- A local-only policy must not silently become remote.
- If the app cannot determine the active mode safely, it must not start transcription.

## Connectivity And Offline Behavior

Local mode:

- Must keep working without internet after required local dependencies/models are installed.
- Must not require enterprise server health.

Personal remote mode:

- Requires server connectivity for remote transcription.
- May offer local fallback if configured by the user.
- Must show clear failure if server is unavailable.

Enterprise self-hosted or managed mode:

- Requires valid organization policy.
- May use cached policy only according to policy freshness rules.
- Must fail closed if policy requires remote mode and the server is unreachable.
- May allow local fallback only if organization policy explicitly allows it.

Hybrid mode:

- Must define offline behavior for every configured path.
- Must not change processing location silently because of connectivity.

## Enrollment And Exit Behavior

A mode is not complete unless entry and exit are defined.

Personal local mode entry:

- Default on fresh install.
- Default after disconnecting from personal remote mode if no organization policy remains.

Personal remote mode entry:

- User manually configures server and credentials.
- User can disconnect and return to local mode.

Enterprise self-hosted or managed mode entry:

- Admin-managed configuration, enrollment link, device code, enrollment credential, installer profile, or another explicit provisioning method.
- The app must show the organization identity after enrollment.

Enterprise self-hosted or managed mode exit:

- User may disconnect only if policy allows unmanaged exit.
- Admin may revoke device/user access.
- Revocation must prevent future remote transcription.
- If a device is revoked, cached policy must not be used to continue remote access.

## Required UI State Labels

The app must have plain-language labels for processing location.

Required states:

- Local transcription.
- Remote transcription.
- Remote transcription required by organization.
- Remote server unavailable.
- Local fallback available.
- Local fallback active.
- Fallback blocked by organization policy.
- Policy unavailable.
- Policy cached.
- Policy expired.
- Transcription disabled by organization policy.
- Connected to organization.
- Personal remote server connected.
- Personal remote server disconnected.

## Required Settings Areas

The settings UI must eventually include:

- Processing mode.
- Remote server endpoint.
- Authentication status.
- Organization status.
- Policy status.
- Local fallback behavior.
- Privacy and retention summary.
- Connection test.
- Logout/disconnect.

## Required Policy Controls

Enterprise policies must eventually control:

- Whether local mode is allowed.
- Whether remote mode is allowed.
- Whether remote mode is required.
- Whether fallback is allowed.
- Which direction fallback is allowed: remote to local, local to remote, or both.
- Whether users can choose mode per transcription.
- Which models are allowed.
- Whether local history is allowed.
- Whether server history is allowed.
- Whether audio can be stored temporarily.
- Whether post-processing is allowed.
- Whether custom user words are allowed.
- Whether organization-wide word lists are enforced.
- Whether a user may disconnect from managed mode.
- Maximum policy cache age.

## Mode-Specific Completion Criteria

Personal local mode is complete when:

- Fresh install defaults to local.
- No enterprise login is required.
- No audio is sent remotely unless the user enables a remote feature.
- Local shortcut flow still works.

Personal remote mode is complete when:

- User can configure server.
- User can test connection.
- User can authenticate.
- User can see remote status.
- User can disconnect back to local.
- Server failure is clear and safe.

Enterprise self-hosted mode is complete when:

- Admin/server configuration can enroll a desktop client.
- Organization policy can control mode.
- Organization identity is visible.
- Revocation prevents remote use.
- Policy unavailable behavior is defined and enforced.

Managed single-tenant mode is complete when:

- It has the same user/admin behavior as self-hosted mode.
- Operator responsibilities are explicit.
- Customer isolation and data-processing terms are documented.

Managed multi-tenant SaaS mode is complete only when:

- Tenant isolation is implemented and tested.
- Cross-tenant access tests exist.
- Per-tenant policy, quota, retention, and audit exist.
- Support tooling cannot leak tenant data.

Hybrid mode is complete when:

- Every automatic or manual mode switch is visible.
- Fallback direction is policy-controlled.
- History records processing location when history exists.
- Retrying under a different processing location requires explicit permission.

## Failure Behavior

### If local mode fails

The app may offer remote mode only if:

- A remote server is configured.
- User/admin policy allows remote mode.
- The user is clearly informed audio will be sent to the server.

### If remote mode fails

The app must:

- Show server/network/service failure.
- Not silently switch to local if policy forbids local.
- Offer retry if safe.
- Preserve the user's recorded audio only as long as needed for retry policy.
- Delete temporary audio after failure if retention policy requires deletion.
- Show whether retry will use remote again or local fallback.

### If policy cannot be loaded

The app must:

- Use valid cached policy only if policy freshness rules allow it.
- Show that policy is cached if cached policy is used.
- Refuse organization-managed transcription if policy is expired or missing.
- Avoid silently reverting to unmanaged personal behavior while still enrolled in an organization.

### If user/device is revoked

The app must:

- Stop remote transcription.
- Clear or invalidate remote credentials locally when instructed by server or when auth fails with revoked status.
- Show that access was revoked.
- Not continue using cached policy to bypass revocation.

## Product Copy Requirements

Public and in-app copy must distinguish product editions accurately.

Allowed wording:

- “MotsDits runs locally by default.”
- “Enterprise mode can use a private central server when configured.”
- “Remote transcription sends audio to your configured server.”
- “Your administrator controls transcription mode for this organization.”
- “Local fallback is available only if enabled by policy.”

Avoid wording:

- “Voice never leaves your machine” for enterprise remote mode.
- “Enterprise-ready centralized processing” before required infrastructure exists.
- “Secure by default” unless the specific behavior is defined.
- “Automatic fallback” without naming the fallback direction and privacy impact.
- “Cloud mode” when the server is self-hosted or customer-controlled.

## Open Decisions For Future Planning

These decisions are intentionally not forced by this spec:

1. Whether the first professional pilot is personal remote, enterprise self-hosted, or managed single-tenant.
2. Whether the first remote transport is synchronous upload, async job polling, chunked upload, or streaming.
3. Whether managed enterprise devices may disconnect themselves or require admin release.
4. Whether local fallback is allowed in the first enterprise pilot.
5. Whether organization policy is delivered by server fetch, installer profile, config file, or a combination.
6. Whether remote mode initially supports all desktop platforms or only one.

The implementation plan must resolve these before development starts.

## Acceptance Checklist

This spec is satisfied when:

- Every mode has a clear definition.
- Local-first behavior remains protected.
- Remote mode cannot be enabled invisibly.
- Enterprise policy precedence is defined.
- Connectivity/offline behavior is defined.
- Enrollment and exit behavior are defined.
- Failure behavior is defined.
- Revocation behavior is defined.
- UI labels for processing location are defined.
- Product copy cannot accidentally oversell centralized enterprise readiness.
- Open decisions are listed instead of hidden.
