# MotsDits Enterprise Centralized - Master Spec

## Purpose

This document defines the complete global specification for a professional centralized version of MotsDits where an organization can run transcription processing on centralized infrastructure instead of requiring every desktop user to process speech locally.

The goal is to preserve MotsDits' existing desktop dictation experience while adding an enterprise-grade server mode that can be deployed, secured, monitored, tested, and operated for teams.

This is not a claim that centralized enterprise mode already exists. The current product is local-first. This specification defines the missing infrastructure, product behavior, technical contracts, security posture, testing system, and implementation order required to build it.

## Source Intent From Marco

Marco asked for this work in these terms:

> On va commencer à faire un spec sheet. complet et detaillé.
> on fait un spec global, exactement ce dont on a besoin
> ensuite on detail chaque spec bien precisement, on indique TOUT dans le .md verbatim. comme sa quand on va exécuter le plan dans 1 mois, on va savoir exactement ce qu'on fait. pas de resumer ou de point qui disparait dans la memoire. tout est ecrit noir sur blanc.
>
> 1 - master spec
> 2 - one spec sheet per point
> 3 - révision des spec sheets one by one pour rien oublier
> 4 - roadmap/plan (sans date / time) juste pour preciser l'ordre d'implementation, quoi faire et tester exactemetn entre chaque etape.
> 5 - Spec sheet d'un test systeme AI complet pour que tu puisses, pendant le devellopement, tester autonome l'application que tu devellope sans avoir besoin d'un humain entre chaque tour.

## Current Product Reality

MotsDits currently presents itself as a local-first desktop speech-to-text app:

- It runs speech-to-text on the user's machine.
- The public README says the user's voice never leaves the machine.
- The existing architecture is a Tauri 2.x desktop app with a Rust backend and React/TypeScript frontend.
- The existing pipeline is microphone capture, VAD, local transcription model inference, text correction, clipboard/paste, and optional post-processing.
- The current app has managers for audio, models, transcription, and history.
- The current app has command-event communication between frontend and backend.
- The current app has platform-specific behavior for audio, clipboard, overlay, shortcuts, tray, and ONNX runtime concerns.
- The current app supports local models such as Whisper, Parakeet, Canary, and Moonshine.
- The current app supports post-processing through OpenAI-compatible APIs, but this is not the same as centralized enterprise transcription.

## Enterprise Centralized Target State

The target product is a professional team-capable edition with a centralized transcription option.

The enterprise centralized version must allow an organization to choose whether transcription happens:

1. Locally on each desktop machine.
2. On a private/self-hosted central server controlled by the organization.
3. On a managed cloud server operated by the product owner.

The first enterprise implementation should prioritize private/self-hosted or single-tenant central deployment before multi-tenant public SaaS, because centralized voice processing introduces confidentiality and compliance risk.

## Non-Negotiable Product Principles

### Local-first must remain true for the existing product

The existing product promise is local processing and privacy. Enterprise centralized mode must not silently change that behavior.

Requirements:

- Existing users must not have their audio sent to a server by default.
- Centralized processing must be opt-in.
- The UI must clearly show whether the current mode is local or remote.
- Enterprise policies may lock remote mode for managed deployments, but unmanaged personal installs must remain local-first.

### Centralized mode must be explicit

Users and administrators must know when audio leaves the device.

Requirements:

- Remote mode must be visible in settings.
- Remote mode must be visible during recording or transcription.
- The app must not hide the network dependency.
- Errors must distinguish local transcription failures from remote service failures.

### Audio privacy must be designed before scaling

Voice data can contain confidential, personal, medical, legal, financial, customer, credential, and business information.

Requirements:

- No persistent audio storage by default.
- If audio storage is enabled, it must be explicit, time-limited, and admin-controlled.
- Transcription jobs must be isolated by organization.
- Logs must never contain raw audio.
- Logs must not contain full transcript text by default.
- Debug traces must avoid sensitive payloads.

### The system must support professional operations

A team feature is not enterprise-ready unless it can be operated.

Requirements:

- Health checks.
- Metrics.
- Structured logs.
- Admin visibility.
- Quotas or usage limits.
- Version reporting.
- Upgrade/migration path.
- Backup strategy for server-owned metadata.
- Incident-friendly diagnostics.

### The architecture must avoid premature multi-tenant complexity

A multi-tenant SaaS architecture is not required for the first version unless the business decision explicitly requires it.

Preferred first target:

- Single organization server.
- Self-hosted or single-tenant deployment.
- Simple team/user management.
- Clear path to future multi-tenancy.

## Required Spec Sheets

The complete specification set is split into these documents:

1. `master-spec.md` - This global specification and scope control document.
2. `01-product-modes.md` - Local, remote, self-hosted, managed cloud, and hybrid mode behavior.
3. `02-desktop-client.md` - Required changes in the MotsDits desktop app.
4. `03-server-api.md` - Central API responsibilities, endpoint categories, contracts, and failure behavior.
5. `04-transcription-workers.md` - Worker service, model execution, queues, GPU/CPU processing, and result handling.
6. `05-auth-organizations.md` - Authentication, users, organizations, roles, sessions, tokens, and enterprise identity.
7. `06-security-privacy-compliance.md` - Security, privacy, retention, encryption, audit, compliance, and data classification.
8. `07-admin-console-policies.md` - Admin console, centralized policies, user management, model settings, quotas, and observability surfaces.
9. `08-infrastructure-operations.md` - Deployment topology, environment config, scaling, monitoring, backups, upgrades, and incident response.
10. `09-observability-support.md` - Logs, metrics, traces, support bundles, diagnostics, and safe debugging.
11. `10-billing-licensing-quotas.md` - License model, quota tracking, usage accounting, cost controls, and plan enforcement.
12. `11-ai-system-testing.md` - Complete autonomous AI testing system specification.
13. `12-roadmap-implementation-order.md` - Date-free implementation order, gates, and what to test at each stage.
14. `13-review-checklist.md` - One-by-one review checklist for all spec sheets.

## High-Level System Architecture

The target architecture has these main components:

- MotsDits Desktop Client.
- Enterprise Server API.
- Authentication and organization service.
- Transcription job queue.
- Transcription worker service.
- Model storage/cache.
- Metadata database.
- Optional object storage for temporary audio or artifacts.
- Admin console or admin API.
- Observability stack.
- AI autonomous test harness.

Reference flow:

```text
Desktop Client
  -> Authenticated API request
  -> Transcription job creation
  -> Queue
  -> Worker claims job
  -> Worker runs model inference
  -> Worker stores result metadata
  -> API returns or streams result
  -> Desktop inserts/pastes text
```

## Core User Journeys

### Individual local user

A user installs MotsDits and uses local transcription exactly as before.

Must remain true:

- No account required.
- No server required.
- No internet required for normal local transcription after models are installed.
- Audio remains on the user's machine.

### Team user with central transcription

A user signs in to an organization-managed MotsDits deployment and uses central transcription.

Required flow:

1. User opens MotsDits.
2. User signs in or receives a device credential through admin-managed provisioning.
3. App loads organization policy.
4. App shows remote transcription mode clearly.
5. User presses the existing transcription shortcut.
6. App records audio locally.
7. App sends audio or audio chunks to the configured enterprise server.
8. Server authenticates request.
9. Server validates organization policy and quota.
10. Server processes transcription through worker infrastructure.
11. App receives text.
12. App applies allowed client-side or server-side correction/post-processing behavior.
13. App pastes text into the active app.
14. App records local history only if allowed by policy.

### Administrator

An administrator configures how the team uses MotsDits.

Required capabilities:

- Invite or provision users.
- Configure server endpoint.
- Configure allowed transcription modes.
- Configure allowed models.
- Configure retention policy.
- Configure whether history is stored locally, server-side, both, or neither.
- View usage and health.
- Revoke users or devices.
- Export audit logs if supported.

### Operator

An operator keeps the centralized system running.

Required capabilities:

- Deploy server components.
- Configure GPU/CPU workers.
- Monitor job latency and errors.
- See job handoff backlog/depth when applicable.
- See worker health.
- Rotate secrets.
- Upgrade versions.
- Diagnose failures without seeing sensitive user content by default.

## Minimum Viable Enterprise Pilot

A pilot must prove centralized transcription works with a small controlled group.

Required pilot capabilities:

- Desktop can switch between local and remote transcription.
- Desktop can authenticate to one configured server.
- Server can accept audio from authenticated clients.
- Server can run transcription through at least one worker.
- Server can return transcription results.
- Server can reject unauthorized requests.
- Server can enforce basic request size and duration limits.
- Server can expose health and basic metrics.
- Server can run without storing raw audio permanently.
- Basic logs can diagnose failures without exposing audio.
- AI test harness can exercise the happy path without a human.

Not required for pilot:

- Public SaaS multi-tenancy.
- Billing system.
- SAML/SSO.
- Autoscaling GPU cluster.
- Formal compliance certification.
- Full web admin console.

## MVP Enterprise Requirements

The MVP must support a real small professional team.

Required MVP capabilities:

- Organization-aware users.
- Secure authentication.
- Device/session management.
- Centralized remote transcription mode.
- Basic admin controls.
- Worker handoff mechanism such as queue, internal RPC, or another explicit lifecycle.
- At least one production deployment topology.
- Metrics and alerting.
- Policy-controlled retention.
- Quotas or rate limits.
- Upgrade-safe configuration.
- Documentation for deployment and operations.
- End-to-end autonomous test suite.

## Full Enterprise Requirements

The full enterprise version expands MVP into a serious B2B platform.

Required full capabilities:

- SSO/OIDC/SAML support.
- Strong role-based access control.
- Audit logs.
- Central policy management.
- Multi-worker scaling.
- GPU scheduling or worker pool management.
- HA deployment option.
- Backup/restore procedures.
- Security review artifacts.
- Compliance-ready retention and deletion controls.
- Support diagnostics.
- Optional multi-tenant SaaS architecture if business chooses managed cloud.

## Explicit Out of Scope For First Build

These are not part of the first implementation unless explicitly moved into scope later:

- Replacing local transcription entirely.
- Removing current local-first product behavior.
- Building public multi-tenant SaaS before a single-tenant deployment works.
- Recording all user audio for analytics.
- Training custom models on customer audio by default.
- Building mobile apps.
- Building browser extension dictation.
- Guaranteeing medical/legal compliance without a dedicated compliance project.
- Real-time collaborative transcript editing.

## Key Open Decisions

These must be decided before implementation starts:

1. First deployment target: self-hosted, managed single-tenant, or public SaaS.
2. First transcription transport: whole audio segment upload, chunked upload, or streaming.
3. First authentication model: server-issued pilot credential, user login, device credential, device code, or OIDC.
4. First storage policy: no audio persistence, short temporary storage, or configurable storage.
5. First worker backend: reuse current local inference code in a server process, call an external inference service, or build a dedicated worker runtime.
6. First admin interface: config file only, admin API, or web admin console.
7. Whether post-processing runs client-side, server-side, or both.
8. Whether custom words and corrections are personal, organization-wide, or both.
9. Whether history remains local-only, server-side, or policy-controlled.
10. Whether the first pilot must support Windows, Linux, macOS, or a single platform only.

## Acceptance Criteria For This Spec Set

This spec set is complete enough only if a future development session can answer these questions without relying on memory:

- What are we building?
- What is explicitly not being built first?
- What infrastructure is missing?
- What desktop changes are required?
- What server components are required?
- What data is sensitive?
- What must be logged and what must not be logged?
- How does authentication work at each maturity stage?
- How are organizations and policies represented?
- How are jobs queued, processed, failed, retried, and returned?
- What must be tested after each implementation stage?
- How can an AI agent test the system without needing a human to speak into a microphone every turn?

## Spec Revision Process

The spec sheets must be reviewed one by one before implementation.

Review rules:

- Do not review all specs as one blob.
- Read one spec sheet.
- Check for missing requirements, hidden assumptions, ambiguity, and contradictions.
- Update that sheet before moving to the next one.
- Track review status in `13-review-checklist.md`.
- Do not create the final implementation plan until the spec sheets have been reviewed.

## Implementation Planning Rule

The roadmap document is not a schedule. It must not contain dates or time estimates. It defines order, gates, required tests, and evidence needed before moving forward.
