# 05 - Authentication And Organizations Spec

## Purpose

Define authentication, organizations, users, roles, sessions, tokens, devices, enrollment, provisioning, authorization, revocation, and enterprise identity requirements for centralized MotsDits.

Centralized transcription cannot be professional without a clear identity and authorization model.

This file must be usable on its own after a long pause in development. A future implementation plan must be able to answer who is allowed to use remote transcription, how devices are enrolled, how access is revoked, how roles are enforced, what identity data is stored, and which authentication choices remain open.

## Scope

This spec defines:

- Organization, user, device, role, session/token, identity-provider, invitation, and provisioning concepts.
- Personal remote versus organization-managed identity differences.
- Authentication method maturity from pilot to full enterprise.
- Authorization requirements for normal users, admins, operators, and owners.
- Revocation, logout/disconnect, audit, and desktop identity UX.
- Security and test requirements for identity and access control.

This spec does not define:

- Exact auth protocol implementation.
- Exact SSO provider.
- Exact database schema.
- Exact admin console UI.
- Exact billing/license model.

Those details belong in implementation planning or other spec sheets, but they must not contradict this file.

## Identity Model

Required entities:

- Organization.
- User.
- Device.
- Session/token.
- Role.
- Policy.
- Invitation or provisioning record.

Optional future entities:

- Team/group.
- Service account.
- API key.
- SSO identity provider.
- License subscription.
- External identity subject.
- Managed deployment profile.

Identity modes:

- Personal remote mode may have a user/token/device without a full organization admin model.
- Enterprise mode must have an organization context.
- Multi-tenant future mode must scope every user/device/session/policy/resource to an organization or explicit tenant boundary.

## Organization

An organization represents a professional customer or team.

Required fields:

- Organization ID.
- Display name.
- Status: active, suspended, disabled.
- Created timestamp.
- Policy version.
- Retention settings.
- Quota settings.
- Allowed deployment mode.
- Allowed authentication methods.
- Managed disconnect policy if devices are organization-managed.

Rules:

- Every enterprise transcription job belongs to one organization.
- Every policy decision must be scoped to organization.
- Organization disabled means transcription requests are rejected.
- Organization status must be checked on policy fetch and transcription request.
- Organization policy controls whether enrolled devices may disconnect to unmanaged local mode.

## User

A user represents a human member of an organization.

Required fields:

- User ID.
- Organization ID when organization-managed.
- Email or username.
- Display name if available.
- Status: active, invited, suspended, disabled.
- Role.
- Created timestamp.
- Last active timestamp.
- External identity subject if SSO/OIDC is used.

Rules:

- A user may only access their organization unless future multi-org membership is explicitly designed.
- Disabled users cannot create transcription jobs.
- Suspended users cannot create transcription jobs unless a later design defines a narrower suspended state.
- Invited users cannot create transcription jobs until activation/enrollment completes.
- User identity must not be inferred from untrusted client metadata.
- Multi-organization membership is a future feature and must not be assumed in the first implementation.

## Device

A device represents an installed MotsDits desktop client authorized for organization use.

Required fields:

- Device ID.
- User ID or organization ID.
- Device name.
- Platform.
- App version.
- Status: active, revoked, pending, disabled.
- Enrollment method.
- Managed/unmanaged flag.
- Last seen timestamp.
- Created timestamp.
- Last policy version seen if applicable.

Use cases:

- Revoke a lost machine.
- Track which app versions are active.
- Apply policy to managed devices.
- Support token refresh or device code login.
- Detect unsupported client versions.
- Distinguish personal remote devices from organization-managed devices.

Rules:

- Revoked devices cannot fetch policy or create transcription jobs.
- Disabled devices cannot fetch policy or create transcription jobs until re-enabled.
- Pending devices cannot create transcription jobs until enrollment completes.
- Device identity must be authenticated, not trusted from client-provided metadata alone.

## Roles

Minimum roles:

- Member.
- Admin.
- Operator or Owner if needed.

Member can:

- Authenticate.
- Fetch policy.
- Submit transcription jobs if allowed.
- View own status.
- View own device/session status where applicable.

Admin can:

- Manage users/devices.
- Change organization policy.
- View usage summary.
- Revoke access.
- Manage invitations/provisioning records.

Operator can:

- View system health.
- View worker state.
- Access support diagnostics.
- Not necessarily read transcripts.

Owner, if used, can:

- Manage billing/licensing.
- Manage high-risk settings.
- Delete organization data.
- Manage SSO/identity provider settings if supported.

Rules:

- Do not give transcript/audio access to admins/operators by default unless a specific product requirement says so.
- Role checks must be performed server-side for every protected endpoint.
- UI hiding is not authorization.
- High-risk actions require audit events.

## Authentication Methods

### Pilot Server-Issued Credential Authentication

Simplest pilot option.

Behavior:

- Server issues a credential manually or through admin tooling.
- Desktop stores credential securely.
- Requests include credential-derived authentication.
- Server validates credential and maps it to organization/user/device as applicable.

Pros:

- Fast to implement.
- Good for controlled pilot.

Cons:

- Weak user lifecycle if used alone.
- Manual provisioning if no enrollment flow exists.
- Not enough for full enterprise.

Requirements:

- Credential can be revoked.
- Credential has expiration or rotation plan.
- Credential is never logged.
- Credential must be high entropy.
- Credential scope must be clear: personal remote user, organization user, device, or enrollment.

This option must not be described as enterprise SSO or full enterprise identity.

### Device Code Authentication

Good for desktop apps.

Behavior:

- Desktop shows a code or opens browser.
- User authenticates in browser.
- Device receives session/device credential after approval.

Pros:

- Better UX than manual credential.
- Works for desktop apps.
- Compatible with future SSO.

Cons:

- Requires auth web flow.

Requirements:

- Device code expires.
- Device code is single-use unless explicitly designed otherwise.
- Device approval maps to user/device/organization.
- Revocation of user or device invalidates future access.

### OIDC/SSO Authentication

Enterprise target.

Behavior:

- Organization configures identity provider.
- User signs in with company account.
- Server validates identity provider tokens or exchanges them for server-managed sessions.
- Roles/groups may be mapped.

Pros:

- Enterprise-friendly.
- Centralized access control.

Cons:

- More complex.
- Requires admin configuration.

Requirements:

- Identity provider configuration changes are audited.
- External identity subject is stored in a stable mapping.
- Role/group mapping must fail safely if ambiguous.
- SSO logout behavior must be defined before claiming full SSO support.
- SAML may be future scope but is not required unless explicitly selected.

## Personal Remote Identity

Personal remote mode is not the same as enterprise organization identity.

Requirements:

- Personal remote may authenticate with a single user/device credential.
- Personal remote must not claim admin-managed organization policy unless an organization exists.
- Personal remote credentials must still be revocable/rotatable.
- Personal remote logout/disconnect must return the desktop to local mode.
- Personal remote mode must not imply enterprise compliance, SSO, audit, or team management.

## Session And Token Requirements

Required session/credential properties:

- Scoped to organization when organization-managed.
- Scoped to user/device.
- Expirable.
- Revocable.
- Not logged.
- Stored securely on client.
- Bound to intended auth method where practical.
- Has clear audience/use: enrollment, session, device, API/service, or refresh.

Refresh behavior:

- MVP should support refresh or re-authentication.
- Expired credential must produce distinct error.
- Revoked credential must produce distinct error.
- Refresh failure must not silently downgrade to unauthenticated remote access.

Logout/disconnect behavior:

- Personal remote logout/disconnect returns desktop to local mode.
- Organization-managed disconnect is allowed only if organization policy permits it.
- Server-side revocation must invalidate future remote requests.
- Cached policy cannot be used to bypass revoked credentials.

## Authorization Rules

Every protected API endpoint must check:

- Is credential/session valid?
- Is credential/session expired?
- Is credential/session revoked?
- Is user/device active?
- Is organization active when organization-scoped?
- Does role allow action?
- Does organization policy allow action?
- Does quota allow action where relevant?
- Is client/app version allowed where relevant?

Normal member transcription requires:

- Valid auth.
- Active organization when organization-managed.
- Active user/device.
- Policy allows remote transcription.
- Quota available.
- Client version allowed if version policy exists.

Personal remote transcription requires:

- Valid personal remote credential.
- Active personal remote user/device identity if modeled.
- Server policy or local server config allows transcription.
- Quota/rate limit available if configured.

Admin policy update requires:

- Valid auth.
- Admin/owner role.
- Organization active.
- Policy payload validation.
- Audit event.

## Invitations And Provisioning

MVP should support one simple provisioning method.

Options:

- Admin creates user and server-issued credential manually.
- Admin invites by email.
- Admin generates device enrollment code.
- Managed deployment config preloads server URL and enrollment credential.
- SSO-driven just-in-time provisioning if explicitly selected later.

Requirements:

- Invitations/enrollment credentials expire.
- Used enrollment credentials cannot be reused unless explicitly designed.
- Revocation is possible.
- Provisioning records identify who created them.
- Provisioning records identify intended organization and role/device scope.
- Enrollment failure must not leak whether sensitive organization/user data exists beyond safe messages.

## Identity State Transitions

Required user transitions:

- invited -> active.
- active -> suspended.
- active/suspended -> disabled.
- disabled -> active only through explicit admin action if allowed.

Required device transitions:

- pending -> active.
- active -> revoked.
- active -> disabled.
- disabled -> active only through explicit admin action if allowed.

Required credential/session transitions:

- issued -> active.
- active -> expired.
- active -> revoked.
- revoked credentials never return to active.

Every state transition that changes access must be audited.

## Audit Requirements

Audit events must exist for identity and access changes.

Required audit events:

- User invited.
- User activated.
- User suspended.
- User disabled.
- Device enrollment created.
- Device registered.
- Device disabled.
- Device revoked.
- Role changed.
- Policy changed.
- Credential/session revoked.
- Enrollment credential created/revoked.
- SSO configuration changed if supported.
- Managed disconnect policy changed.

Audit events must include:

- Actor ID.
- Organization ID.
- Event type.
- Target ID.
- Timestamp.
- Correlation ID.

Audit events must not include:

- Raw tokens.
- Passwords.
- Raw audio.

## Stable Auth Error Categories

Auth and authorization failures must be distinguishable without leaking secrets.

Required categories:

- invalid_credentials.
- expired_credentials.
- revoked_credentials.
- user_disabled.
- user_suspended.
- device_pending.
- device_disabled.
- device_revoked.
- organization_disabled.
- insufficient_role.
- policy_blocks_action.
- client_version_blocked.

Every category needs:

- Stable machine-readable error code.
- Safe user-facing message.
- Whether retry is useful.
- Whether user action or admin action is required.

## Security Requirements

- Passwords, if used, must be hashed with a modern password hashing algorithm.
- Prefer external/OIDC auth over building password auth for enterprise.
- Credentials/tokens must be high entropy.
- Admin endpoints must be role-protected.
- Auth failures must be rate-limited.
- Session invalidation must work after revocation.
- Sensitive auth config must come from secure environment/config.
- Credential values must never be logged, shown, exported, or stored in plaintext where avoidable.
- Enrollment credentials must expire.
- Cross-organization authorization must be tested server-side.
- Service accounts/API keys, if added later, must have explicit scopes and cannot inherit human admin powers by default.

## Desktop Identity UX

The desktop app must show:

- Connected organization when organization-managed.
- Personal remote identity when not organization-managed.
- Signed-in user or device.
- Server URL/display name.
- Policy status.
- Whether logout/disconnect is allowed.
- Revoked/disabled/suspended state when access is lost.

The desktop app must not show:

- Raw credential/token.
- Secret keys.
- Sensitive identity-provider configuration.

## Open Decisions For Future Planning

These decisions are intentionally not forced by this spec:

1. First pilot auth method.
2. Whether the first pilot models a full user or device-only identity.
3. Whether personal remote mode has an organization record or separate personal identity model.
4. Whether the first enterprise enrollment method is manual credential, device code, invite, config file, or managed profile.
5. Whether user/password auth is ever implemented or avoided in favor of external identity.
6. Whether SSO starts with OIDC only or later includes SAML.
7. Whether multi-organization user membership is supported later.
8. Whether managed devices can disconnect themselves or require admin release.

The implementation plan must resolve these before development starts.

## Required Tests

### Unit Tests

- Role permission checks.
- Organization status checks.
- User state transitions.
- Device state transitions.
- Credential expiration.
- Credential revocation.
- Policy authorization.
- Managed disconnect permission.
- Stable auth error mapping.

### Integration Tests

- Authenticated user/device can fetch policy.
- Invited user cannot submit job before activation.
- Suspended user cannot submit job.
- Disabled user cannot submit job.
- Pending device cannot submit job.
- Disabled device cannot submit job.
- Revoked device cannot fetch policy or submit job.
- Member cannot update policy.
- Admin can update policy.
- Expired credential returns correct error.
- Revoked credential returns correct error.
- Organization disabled blocks policy fetch/transcription.
- Personal remote disconnect returns desktop to local mode.
- Managed disconnect follows policy.

### Security Tests

- Credential/token not present in logs.
- Credential/token not present in support bundles.
- Auth failure is rate-limited.
- Cross-organization access is rejected.
- Client-provided organization/user/device metadata cannot override auth context.
- Revoked credential cannot use cached policy to continue remote access.
- Admin-only endpoint rejects member/operator when not permitted.

## Acceptance Checklist

This spec is satisfied when:

- Organization, user, device, role, session/credential, and provisioning concepts are defined.
- Personal remote and organization-managed identity are distinguished.
- Pilot, MVP, and enterprise auth paths are distinguished.
- Authorization checks are explicit.
- User/device/credential state transitions are defined.
- Revocation is required and cannot be bypassed with cached policy.
- Logout/disconnect behavior is defined.
- Admin/member/operator/owner permissions are separated.
- Stable auth error categories are defined.
- Audit requirements exist for identity/access changes.
- Desktop identity UX requirements are explicit.
- Tests cover state, revocation, cross-organization isolation, and credential leakage.
- Open decisions are listed instead of hidden.
