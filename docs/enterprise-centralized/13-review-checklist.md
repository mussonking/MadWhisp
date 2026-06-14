# 13 - Spec Review Checklist

## Purpose

Track one-by-one review of the enterprise centralized spec sheets.

This checklist exists so no spec gets skipped, summarized away, or assumed complete without review.

## Review Rules

- Review one file at a time.
- Do not merge review of multiple files into one vague pass.
- For each file, check missing requirements, contradictions, unclear decisions, hidden assumptions, test gaps, and security/privacy gaps.
- Update the reviewed file immediately if gaps are found.
- Mark status only after the file has been read and updated.
- Do not create final implementation plan until all required specs are reviewed or explicitly deferred.

## Status Legend

- Not reviewed.
- In review.
- Reviewed with changes.
- Reviewed no changes.
- Deferred with reason.

## Review Table

| Spec file                            | Status                | Reviewer notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------ | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `master-spec.md`                     | Not reviewed          | Verify global scope, current reality, target state, non-negotiables, open decisions.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `01-product-modes.md`                | Reviewed with changes | Strengthened as standalone spec: scope, connectivity/offline rules, enrollment/exit, policy cache, revocation, fallback direction, mode completion criteria, product copy, open decisions.                                                                                                                                                                                                                                                                                                            |
| `02-desktop-client.md`               | Reviewed with changes | Strengthened as standalone spec: local-first upgrade safety, enrollment/config sources, revocation, policy cache expiry, mode resolution, audio prep, progress/cancel, paste target safety, diagnostics, desktop test mode, CLI wording.                                                                                                                                                                                                                                                              |
| `03-server-api.md`                   | Reviewed with changes | Strengthened as standalone spec: scope, version/capabilities, policy freshness, lifecycle options without forcing transport, upload/cancellation, admin pagination/audit, error codes, idempotency, compatibility, storage/retention, security, tests. Also generalized roadmap/observability wording away from forced queue/polling.                                                                                                                                                                 |
| `04-transcription-workers.md`        | Reviewed with changes | Strengthened as standalone spec: scope, handoff options without forcing queue, in-process/external workers, sync/async lifecycle, model/runtime reporting, audio cleanup, result contract, retry/cancel, health/capacity/versioning, fake deterministic worker, security, tests. Also generalized queue wording in master/API/ops/observability.                                                                                                                                                      |
| `05-auth-organizations.md`           | Reviewed with changes | Strengthened as standalone spec: scope, personal remote vs org-managed identity, org auth methods/disconnect policy, user/device states, role rules, server-issued credentials, device code/OIDC requirements, session/logout/revocation, provisioning/state transitions, stable auth errors, desktop identity UX, tests. Also replaced forced static/shared token wording in master/desktop/roadmap.                                                                                                 |
| `06-security-privacy-compliance.md`  | Reviewed with changes | Strengthened as standalone spec: scope, expanded data classes, no training/analytics by default, data boundaries, data residency, retention/backups/support bundles, deletion cleanup, audit events, support diagnostics safety, external post-processing risk, compliance non-claims, security gates/tests. Also replaced forced token wording in related specs.                                                                                                                                     |
| `07-admin-console-policies.md`       | Reviewed with changes | Strengthened as standalone spec: scope, admin surface maturity without forcing web console, expanded policies, diagnostics/security policies, policy validation/change/rollback/audit workflow, user/device pagination, usage/operator visibility, content access boundaries, tests. Also generalized worker/queue wording in roadmap/master.                                                                                                                                                         |
| `08-infrastructure-operations.md`    | Reviewed with changes | Strengthened as standalone spec: scope, runtime components by maturity without forcing queue/GPU/provider, environments, config/secrets validation, topology requirements, capacity inputs, backup/restore tests, upgrade gates, runbooks, incident response without content access, open decisions/tests. Also generalized queue-depth wording in master.                                                                                                                                            |
| `09-observability-support.md`        | Reviewed with changes | Strengthened as standalone spec: scope, expanded log events/fields, redaction rules, metrics labels privacy, alerting/dashboards, SLO-vs-SLA rule, tracing rules, support bundle workflow/audit/TTL/deletion, diagnostic UX, observability retention/access, leak/diagnostic tests.                                                                                                                                                                                                                   |
| `10-billing-licensing-quotas.md`     | Reviewed with changes | Strengthened as standalone spec: scope, privacy-preserving usage accounting, quota/rate-limit types, enforcement timing, retry/idempotency/cancellation accounting, license states without payment processor, cost drivers/controls, admin/operator visibility, user-facing quota/license errors, privacy boundaries, tests/open decisions.                                                                                                                                                           |
| `11-ai-system-testing.md`            | Reviewed with changes | Strengthened as standalone spec: scope, test philosophy, selected lifecycle/handoff instead of forced queue, synthetic fixture rules, fake worker contract, desktop test mode with test credential, leak scan targets, environment isolation/cleanup, flake handling, reports, stage gates, AI operating rules, open decisions. Also replaced test-token/queue wording in desktop/roadmap.                                                                                                            |
| `12-roadmap-implementation-order.md` | Reviewed with changes | Strengthened as standalone roadmap: explicit no-date/no-forced-choice rules, expanded Stage 0 decisions, test harness isolation/leak gates, API capability/version/config gates, auth revoked/expired/disabled checks, lifecycle idempotency/cancel gates, desktop policy freshness/fallback/test credential gates, worker capability gates, admin privacy-safe diagnostics, security/quota/observability hardening, deployment runbooks, release readiness copy constraints, always-run regressions. |

## Global Review Questions

For every spec, answer:

1. Is the current product reality accurately represented?
2. Does this spec accidentally claim the feature already exists?
3. Are required behaviors testable?
4. Are sensitive data rules explicit?
5. Are failure modes defined?
6. Are pilot, MVP, and full enterprise scopes separated where needed?
7. Are open decisions named instead of hidden?
8. Would a future AI/dev session know exactly what to build from this file?

## Final Pre-Plan Gate

Before writing the implementation plan, confirm:

- All specs reviewed or deferred with explicit reason.
- Open decisions resolved or assigned to a first implementation assumption.
- Test system spec reviewed before implementation order is finalized.
- Roadmap contains no dates/time estimates.
- Local-first promise remains protected.
- Enterprise centralized claims are honest and scoped.
