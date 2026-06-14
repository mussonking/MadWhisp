# 06 - Security, Privacy, And Compliance Spec

## Purpose

Define security, privacy, retention, encryption, audit, support access, secret handling, and compliance expectations for centralized MotsDits.

Voice data is highly sensitive. A centralized voice transcription system must be designed as a sensitive data processor from the beginning.

This file must be usable on its own after a long pause in development. A future implementation plan must be able to answer what data is sensitive, what may be stored, what must be deleted, what must never be logged, how support can diagnose safely, which compliance claims are forbidden, and what security gates must pass before any pilot or enterprise release.

## Scope

This spec defines:

- Data classification.
- Privacy defaults.
- Transport security.
- Encryption at rest.
- Retention and deletion.
- Audit logging.
- Access control.
- Secret management.
- Support/diagnostic safety.
- Threats and mitigations.
- Compliance posture and non-claims.
- Security acceptance criteria and tests.

This spec does not define:

- Exact legal terms.
- Exact certification process.
- Exact cloud provider.
- Exact secret manager product.
- Exact incident response staffing model.

Those details belong in implementation planning, contracts, or legal/security work, but they must not contradict this file.

## Data Classification

### Highly Sensitive Data

- Raw audio.
- Audio chunks.
- Temporary audio files.
- Transcript text.
- Partial transcript text.
- Post-processed transcript text.
- User-provided custom words if they reveal business context.
- Organization word lists if they reveal business context.
- Prompt templates if they contain confidential instructions.
- Support bundles if they include logs, transcript, audio, config, or identity metadata.

### Sensitive Operational Data

- User identity.
- Organization identity.
- Device identity.
- Job metadata.
- Usage volume.
- Error/correlation logs.
- Admin audit logs.
- Model used.
- Language detected or requested.
- Policy version.
- IP addresses or network metadata if collected.
- Client app version and platform.

### Secret Data

- Authentication credentials/tokens.
- Enrollment credentials.
- Refresh credentials.
- API keys.
- Signing keys.
- Database credentials.
- Storage credentials.
- SSO/OIDC/SAML secrets.
- Webhook/shared secrets if added later.
- Model registry credentials if private models are used.

## Privacy Principles

### No audio persistence by default

Default behavior:

- Audio exists only for the duration required to process the job.
- Temporary audio is deleted after completion/failure.
- Audio is not retained for analytics.
- Audio is not used for model training.

If storage is enabled:

- It must be explicit.
- It must be policy-controlled.
- It must have retention duration.
- It must be visible to administrators.
- It must be documented for users/customers.

### No transcript logging by default

Default behavior:

- Logs do not include transcript text.
- Metrics do not include transcript text.
- Support bundles do not include transcript text unless explicitly requested and allowed.

### Data minimization

Store only what is required:

- Job state.
- Duration.
- Model used.
- Error code.
- Usage counters.
- Correlation ID.
- Policy version.
- Retention class.

Avoid storing:

- Full audio.
- Full transcript unless policy explicitly allows server history.
- Unbounded request payloads.
- Debug dumps containing user content.
- Raw credentials/secrets.

### No training or analytics use by default

Default behavior:

- Customer audio is not used for model training.
- Customer transcripts are not used for model training.
- Customer prompts/custom words are not used for model training.
- Product analytics, if added later, must not include raw audio/transcript content by default.

Any future training/analytics use of customer content requires a separate explicit policy, consent/contract path, and security/legal review.

## Data Boundary And Flow Rules

Every implementation plan must identify where each sensitive data class exists.

Required boundaries:

- Desktop capture boundary.
- Client-server transport boundary.
- API validation boundary.
- Temporary storage boundary.
- Worker processing boundary.
- Result return boundary.
- History/storage boundary.
- Logs/metrics/traces boundary.
- Support bundle boundary.
- External post-processing provider boundary if enabled.

Rule:

- A data boundary cannot be considered safe just because the UI says so; enforcement must exist in code, config, storage lifecycle, and tests.

## Transport Security

Production requirements:

- TLS required for all client-server communication.
- TLS required for admin console/API.
- Internal service communication should use trusted network, TLS, or both depending on deployment.
- Certificate validation must not be disabled in production.

Development exceptions:

- Localhost HTTP may be allowed only in explicit development mode.
- Development mode must be visually/logically distinct from production.

## Encryption At Rest

Required:

- Database encryption through platform/provider if available.
- Object storage encryption if audio/artifacts are stored.
- Secret values must not be stored in plaintext config files committed to repo.
- Desktop-stored credentials must use OS-appropriate secure storage when available.

Recommended:

- Per-deployment secret keys.
- Key rotation procedure.
- Separate storage bucket/container per organization for multi-tenant future if needed.
- Separate secrets per environment/customer deployment.

## Data Residency And Region

Enterprise deployments may need regional constraints.

Requirements:

- Managed cloud deployments must document where audio, transcripts, metadata, logs, and backups are processed/stored.
- Self-hosted deployments inherit the customer's environment, but documentation must still explain what the software stores.
- Region claims must not be made until deployment architecture enforces them.
- Backups, logs, support bundles, and external post-processing providers must be included in region/residency analysis.

## Retention Policy

Retention must be policy-driven.

Required retention categories:

- Raw audio.
- Audio chunks.
- Temporary upload artifacts.
- Transcript result.
- Partial transcript result.
- Job metadata.
- Audit logs.
- Metrics.
- Support bundles.
- Backups if any stored data is backed up.
- Idempotency records.

Default proposal:

- Raw audio: delete immediately after processing.
- Audio chunks/temporary uploads: delete after processing, failure, cancellation, or expiration.
- Transcript text: store only if history/server history is enabled.
- Job metadata: keep for operational troubleshooting and usage accounting.
- Audit logs: keep according to enterprise policy.
- Metrics: aggregate without user content.
- Support bundles: short-lived, explicit, redacted by default.

Retention policy must define:

- Whether data is stored.
- Where it is stored.
- How long it is stored.
- Who can access it.
- How deletion is triggered.
- Whether backups contain it.
- Whether deletion from backups is immediate or lifecycle-based.

## Deletion Requirements

System must support:

- Delete temporary audio after job.
- Delete temporary audio after cancellation, timeout, validation failure, or retry expiration.
- Delete expired audio/artifacts.
- Delete user/device credentials on revocation where appropriate.
- Delete support bundles after TTL.
- Delete organization data if required by contract or self-hosted admin action.
- Delete or age out idempotency records.

Deletion must be observable:

- Expired object cleanup metrics.
- Errors if cleanup fails.
- Audit event for administrative deletion.
- Safe correlation IDs for cleanup failures.

Deletion failure must not cause raw audio/transcript content to be logged.

## Audit Logs

Audit logs should capture security-relevant actions.

Required events:

- Login/authentication success where appropriate.
- Authentication failure summary where safe.
- Credential/device revocation.
- Policy changes.
- User role changes.
- Admin setting changes.
- Retention setting changes.
- SSO/identity provider config changes if applicable.
- Organization disabled/enabled.
- Support bundle generated/exported/deleted.
- Sensitive retention setting enabled/disabled.
- Audio/transcript storage setting enabled/disabled.
- Admin access to sensitive content if such access is ever allowed.

Audit logs must not include:

- Raw audio.
- Raw credentials/tokens.
- Passwords.
- Full transcript by default.
- Secret configuration values.

## Access Control

Requirements:

- Principle of least privilege.
- Admins do not automatically see transcript/audio content.
- Operators can diagnose system health without content access.
- Workers only access jobs they need to process.
- Cross-organization access must be impossible by API design.

## Secret Management

Requirements:

- Secrets come from environment, secret store, or deployment config outside source control.
- Secret rotation must be possible.
- Logs must redact secrets.
- Desktop credentials must be stored securely when OS support exists.
- No committed production secrets.
- Separate development, staging, and production secrets.
- Support bundles must never include secrets.
- Test fixtures must not use real customer credentials.

## Support And Diagnostics Safety

Support must be possible without default access to user content.

Default support bundle may include:

- App/server/worker versions.
- Platform.
- Redacted config summary.
- Policy version and status.
- Correlation IDs.
- Error codes.
- Safe logs.
- Health summaries.

Default support bundle must not include:

- Raw audio.
- Transcript text.
- Prompt content if sensitive.
- Custom words if sensitive.
- Credentials/tokens/secrets.
- Full request/response payloads.

If sensitive support export is ever allowed:

- It must be explicit.
- It must be policy-controlled.
- It must be audited.
- It must have TTL/deletion.
- It must clearly label included sensitive content.

## Threats To Address

### Unauthorized transcription use

Mitigations:

- Authentication required.
- Rate limits.
- Quotas.
- Revocation.

### Cross-organization data leak

Mitigations:

- Organization-scoped authorization on every request.
- Tenant-aware database queries.
- Tests for cross-org access denial.

### Sensitive content in logs

Mitigations:

- Structured logging with redaction.
- No payload dumps.
- Tests or log scanning for known synthetic secret/audio markers.

### Server compromise

Mitigations:

- Minimal secrets on workers.
- Least-privilege service accounts.
- Patchable deployment.
- Audit logs.
- Backups where needed.

### Abuse/cost explosion

Mitigations:

- Quotas.
- Rate limits.
- Max audio duration.
- Max upload size.
- Job handoff backlog/concurrency limits.

### Prompt/post-processing data leak

If post-processing calls external APIs:

- Must be policy-controlled.
- Must be clearly disclosed.
- Must not happen silently in enterprise mode.
- Admin must choose allowed providers.
- Provider region/data handling must be considered before enterprise use.
- Transcript text sent to external providers must be treated as highly sensitive.

### Debug/test data leak

Mitigations:

- Use synthetic fixtures for tests.
- Do not use customer audio in development tests by default.
- Test logs must follow the same redaction rules.
- Fake worker must be visibly marked as fake/test.

## Compliance Posture

This spec does not claim certification.

Potential future compliance needs:

- SOC 2 readiness.
- ISO 27001 alignment.
- GDPR/Canadian privacy law obligations.
- Data processing agreement.
- Regional hosting.
- Customer deletion/export process.

Rules:

- Do not advertise formal compliance until legal/process/security work exists.
- Do not claim SOC 2, ISO 27001, HIPAA, GDPR compliance, or data residency guarantees until the required program and evidence exist.
- “Privacy-preserving defaults” may be described only when the actual defaults match this spec.
- “Secure by default” must not be used as generic marketing copy without naming the specific controls.

## Open Decisions For Future Planning

These decisions are intentionally not forced by this spec:

1. First production hosting model: self-hosted, managed single-tenant, or later multi-tenant.
2. Whether any server-side transcript history is enabled in the first pilot.
3. Whether any temporary object storage is used or audio stays in-memory for short jobs.
4. Exact retention durations for each data category.
5. Exact secret manager/key management product.
6. Exact regional hosting requirements.
7. Whether external post-processing providers are allowed in enterprise mode.
8. Whether support bundles ever allow sensitive content inclusion.
9. Whether any compliance program is pursued before enterprise sales claims.

The implementation plan must resolve these before development starts.

## Security Acceptance For Pilot

Pilot must have:

- Authenticated transcription endpoint.
- TLS or controlled private network for non-localhost use.
- No default raw audio persistence.
- No raw audio/transcript logging.
- Request size limits.
- Request duration limits.
- Basic rate limits.
- Credential revocation or equivalent.
- Safe error messages.
- Support bundle redaction if support bundles exist.
- Synthetic marker leak tests for logs.

## Security Acceptance For MVP

MVP must add:

- Organization-scoped authorization.
- User/device lifecycle.
- Policy-controlled retention.
- Audit logs for admin/security actions.
- Secure credential storage guidance.
- Basic incident diagnostics without content access.
- Cross-organization access tests.

## Required Tests

- Raw audio marker does not appear in logs.
- Transcript marker does not appear in logs by default.
- Credential/token marker does not appear in logs.
- Credential/token marker does not appear in support bundles.
- Invalid credential rejected.
- Revoked credential rejected.
- Cross-org job access rejected.
- Client-provided organization/user/device metadata cannot override auth context.
- Oversized audio rejected.
- Too-long audio rejected.
- Retention cleanup deletes temporary artifacts.
- Cancellation/timeout cleanup deletes temporary artifacts.
- Support bundle excludes audio/transcript/secrets by default.
- Admin-only endpoint rejects member.
- Operator diagnostics work without transcript/audio content access.
- External post-processing is blocked unless policy allows it.

## Acceptance Checklist

This spec is satisfied when:

- Sensitive data classes are defined.
- Data boundaries are explicit.
- Default retention is privacy-preserving.
- Training/analytics use of customer content is disabled by default.
- Logging restrictions are explicit.
- Support bundle restrictions are explicit.
- Encryption/transport requirements are explicit.
- Data residency/region claims are not made without enforcement.
- Access control is mandatory.
- Secret management is explicit.
- Deletion/cleanup behavior is observable and safe.
- Threats and mitigations are named.
- Compliance is not overclaimed.
- Security gates for pilot and MVP are testable.
- Open decisions are listed instead of hidden.
