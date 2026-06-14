# 08 - Infrastructure And Operations Spec

## Purpose

Define deployment topology, runtime services, environment configuration, scaling, upgrades, backups, restore, operations, runbooks, and incident response for MotsDits Enterprise centralized transcription.

This file must be usable on its own after a long pause in development. A future implementation plan must be able to answer what must run, where it may run, how it is configured, how secrets are handled, how capacity is planned, how upgrades/rollback work, what is backed up, what is not backed up, and how operators diagnose incidents without accessing sensitive user content.

## Scope

This spec defines:

- Runtime components by maturity level.
- Deployment topologies.
- Environment and secret configuration.
- Scaling and capacity signals.
- Backup, restore, migration, and upgrade requirements.
- Operational health, runbooks, incident response, and release gates.
- Infrastructure security and privacy constraints.

This spec does not define:

- Exact cloud provider.
- Exact container/orchestration platform.
- Exact database product.
- Exact queue/job handoff product.
- Exact GPU vendor.
- Exact monitoring vendor.

Those details belong in implementation planning, but they must not contradict this file.

## Required Runtime Components

Minimum pilot components:

- Desktop client.
- Server API.
- Transcription worker.
- Queue or equivalent job handoff.
- Database or durable metadata store.
- Model storage/cache.
- Metrics/logging output.

MVP components:

- API service.
- Worker service or explicit in-process worker boundary if intentionally kept for MVP.
- Database or durable metadata store.
- Selected job handoff mechanism if asynchronous/external workers are used.
- Temporary object storage if needed.
- Admin surface.
- Metrics collector/dashboard.
- Alerting.
- Structured log collection.

Full enterprise components may include:

- Multiple API replicas.
- Multiple worker replicas.
- GPU worker pool if GPU processing is selected.
- HA database option.
- Backup/restore.
- Centralized logs.
- Traces.
- Secret manager or equivalent secret-management process.
- Upgrade/migration tooling.
- Deployment automation.
- Disaster recovery procedure.

## Deployment Topologies

### Single-Node Pilot

Everything can run on one machine.

Allowed for:

- Demo.
- Controlled internal pilot.
- Local development.
- Early self-hosted evaluation with clear limitations.

Not enough for:

- SLA claims.
- High availability claims.
- Large teams.
- Compliance or data residency claims unless separately proven.

Requirements:

- Clear warning that it is a pilot topology.
- Basic backup guidance if metadata matters.
- Explicit resource requirements.
- Clear cleanup behavior for temporary audio/artifacts.

### Self-Hosted Organization Server

Customer deploys server in its own environment.

Requirements:

- Clear install docs.
- Environment/config file.
- Health checks.
- Backup guidance.
- Restore guidance.
- Upgrade guidance.
- Rollback guidance.
- GPU dependency guidance if applicable.
- Secret management guidance.
- Data storage/retention documentation.
- Operational limitations clearly stated.

### Managed Single-Tenant

Product owner operates one isolated deployment for one customer.

Requirements:

- Monitoring by operator.
- Customer-specific retention config.
- Secrets separated by customer.
- Upgrade procedure.
- Rollback procedure.
- Incident response path.
- Region/residency documentation if region is promised.
- Backup/restore ownership clearly defined.
- Support access boundaries documented.

### Multi-Tenant SaaS

Future only unless explicitly prioritized.

Requirements:

- Strong tenant isolation.
- Abuse prevention.
- Billing integration if billing exists.
- Data region strategy.
- Formal operational process.
- Tenant-scoped backup/restore strategy.
- Tenant-scoped support tooling.
- Cross-tenant access tests.

## Environments

Required environment categories:

- Local development.
- Automated test/CI where applicable.
- Pilot/staging.
- Production if deployed for real users.

Requirements:

- Production secrets must not be reused in development/test.
- Test environments must use synthetic audio/transcripts by default.
- Development-mode insecure transport must be explicitly marked and not enabled in production.
- Environment names and config sources must be visible in diagnostics without exposing secrets.

## Configuration Requirements

Config must cover:

- API bind/public URL.
- Database/durable metadata URL.
- Job handoff backend URL/config if used.
- Object storage URL/bucket if used.
- Auth mode.
- Credential/signing secrets.
- Retention settings.
- Max upload size.
- Max duration.
- Rate limits.
- Worker concurrency.
- Worker lifecycle mode: in-process, external, pool, or selected handoff.
- Model cache path.
- Model catalog/config source.
- Metrics/log settings.
- Admin bootstrap settings.
- Support bundle settings.
- Development-mode allowances.
- Public region/deployment label if shown to admins.

Secret/config rules:

- Secrets must not be committed.
- Secrets must be redacted in diagnostics.
- Rotation must be possible for production secrets.
- Config validation must fail startup for unsafe production combinations such as HTTP production API or missing required retention settings.

## Scaling Requirements

Scale dimensions:

- API request rate.
- Audio upload bandwidth.
- Job handoff backlog/depth if the selected handoff mechanism has one.
- Worker count.
- GPU capacity.
- Model load time.
- Storage throughput.

Rules:

- Job handoff backlog/depth must be visible when applicable.
- Worker saturation must be visible.
- Server must reject or slow requests when overloaded instead of failing unpredictably.
- Capacity planning must distinguish CPU, GPU, storage, and network bottlenecks.
- A single worker/GPU outage must produce clear degraded/unavailable status.

Capacity inputs to document:

- Expected users.
- Expected audio minutes per user/day.
- Expected peak concurrency.
- Selected model/runtime.
- CPU/GPU availability.
- Maximum upload size/duration.
- Retention/storage settings.

## Backup And Restore

Back up:

- Organization metadata.
- Users/devices.
- Policies.
- Audit logs if required.
- Usage/accounting data.
- Admin configuration.
- License/subscription metadata if implemented.

Do not back up by default:

- Raw audio if no-audio-retention policy is active.
- Temporary job artifacts after TTL.
- Support bundles after TTL.
- Secrets unless backup/restore is handled by a secure secret-management process.

Restore procedure must be documented before production.

Restore requirements:

- Restore must preserve organization boundaries.
- Restore must not resurrect revoked credentials as active.
- Restore must account for policy versions.
- Restore test/smoke must exist before production claims.
- Backup retention must be documented.
- Backup region/residency must match any region claim.

## Upgrade Requirements

- Versioned database migrations.
- Backward-compatible client/server protocol where practical.
- Server reports version.
- Worker reports version.
- Desktop includes version in requests.
- Upgrade rollback guidance.
- Migration dry-run or backup-before-migration guidance for production.
- Compatibility matrix for desktop/API/worker versions once versions can differ.
- Config migration guidance.

Upgrade gates:

- Health checks pass after upgrade.
- Existing local-first desktop behavior remains safe.
- Remote policy fetch works.
- Worker capability/version is visible.
- No secret/content leak appears in logs.

## Operational Runbooks

Required runbooks before production:

- Start/stop/restart services.
- Check health/readiness.
- Rotate credentials/secrets.
- Apply policy/config changes.
- Restore from backup.
- Roll back upgrade.
- Investigate high error rate.
- Investigate worker unavailable.
- Investigate GPU unavailable if GPU is used.
- Investigate storage cleanup failure.
- Revoke compromised user/device/credential.

Runbooks must avoid instructing operators to inspect raw audio/transcripts by default.

## Incident Response Requirements

Operators need to answer:

- Is API alive?
- Is API ready?
- Is database/durable metadata store reachable?
- Is the selected job handoff mechanism healthy?
- Are workers alive?
- Are GPUs available if GPU processing is used?
- Are jobs stuck?
- Are errors auth, policy, audio, worker, storage, or infrastructure?
- Are cleanup jobs failing?
- Are clients using unsupported versions?
- Is capacity exhausted or degraded?

Required incident artifacts:

- Health endpoint output.
- Metrics dashboard.
- Recent structured logs.
- Correlation ID lookup.
- Worker status.
- Version/capability output.
- Safe config summary with secrets redacted.

Incident rules:

- Incident diagnostics must not require raw audio/transcript access by default.
- Any sensitive support export must follow security/privacy spec requirements.
- Customer-visible claims such as SLA, RTO, RPO, region, or compliance must not be made until the operational process exists.

## Open Decisions For Future Planning

These decisions are intentionally not forced by this spec:

1. First deployment topology.
2. Exact database/durable metadata store.
3. Exact job handoff mechanism.
4. Whether the first worker is in-process or external.
5. Whether object storage is used in the first pilot.
6. Exact secret-management product/process.
7. Exact monitoring/logging/tracing stack.
8. Exact backup retention and restore target.
9. Whether managed single-tenant operations are offered before self-hosted operations are stable.
10. Whether any SLA/RTO/RPO is offered.

The implementation plan must resolve these before development starts.

## Required Tests

### Configuration Tests

- Production config rejects HTTP public URL unless explicitly allowed by deployment class.
- Required secrets missing causes safe startup failure.
- Unsafe retention config is rejected.
- Diagnostics redact secrets.

### Deployment Smoke Tests

- API health/readiness works.
- Worker health/version/capability works if worker exists.
- Selected job handoff mechanism works if applicable.
- Metadata store is reachable.
- Metrics/log output is available.

### Backup/Restore Tests

- Backup includes required metadata.
- Restore preserves organization boundaries.
- Restore does not reactivate revoked credentials.
- Restored deployment passes health checks.

### Upgrade Tests

- Migration applies cleanly.
- Rollback guidance exists.
- Desktop/API/worker version compatibility is visible.
- Post-upgrade smoke passes.

### Incident/Runbook Tests

- Operator can diagnose worker unavailable without content access.
- Operator can diagnose auth/policy/audio/storage categories from safe logs/metrics.
- Cleanup failure is observable without logging sensitive content.

## Acceptance Checklist

This spec is satisfied when:

- Runtime components are defined by maturity level.
- Deployment topologies are defined without forcing a cloud/provider/queue/GPU choice.
- Environment categories and config needs are explicit.
- Secret/config safety rules are explicit.
- Scaling signals and capacity inputs are explicit.
- Backup/restore and upgrades are testable, not merely acknowledged.
- Operational runbooks are listed.
- Incident response questions are answerable without content access by default.
- SLA/RTO/RPO/region/compliance claims are not implied before the operational process exists.
- Required configuration/deployment/backup/upgrade/incident tests are defined.
- Open decisions are listed instead of hidden.
