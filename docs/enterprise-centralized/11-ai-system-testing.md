# 11 - AI System Testing Spec

## Purpose

Define a complete autonomous AI testing system so an AI development agent can test MotsDits Enterprise centralized features during development without needing a human to speak into a microphone, click every UI element manually, or inspect every server state by hand.

The purpose is not to replace human acceptance testing. The purpose is to remove human dependency between development turns.

This file must be usable on its own after a long pause in development. A future implementation plan must be able to answer which tests exist, how synthetic audio is injected, how fake workers behave, how desktop output is captured, how leaks are detected, what can run without GPU, and which gates must pass before a development stage is considered complete.

## Scope

This spec defines:

- Autonomous test layers.
- Synthetic fixtures and test data rules.
- Fake deterministic worker behavior.
- Desktop test mode requirements.
- API/worker/desktop/E2E test expectations.
- Log/support-bundle leak detection.
- Test reports and AI-agent operating rules.
- Flake/retry handling and environment isolation.

This spec does not define:

- Exact test framework.
- Exact CI provider.
- Exact command names.
- Exact browser automation tool.
- Exact real model used for smoke tests.

Those details belong in implementation planning, but they must not contradict this file.

## Testing Philosophy

The AI test system must:

- Use deterministic synthetic audio fixtures.
- Test local and remote transcription flows.
- Test server API behavior.
- Test worker behavior through the selected lifecycle/handoff mechanism.
- Test policy behavior.
- Test auth/credential behavior.
- Test quota/rate-limit behavior.
- Test desktop UI state where practical.
- Test failure modes intentionally.
- Produce machine-readable results.
- Produce human-readable summaries.
- Avoid requiring real customer audio.
- Avoid requiring GPU for deterministic development E2E.
- Avoid requiring a real microphone for autonomous tests.

## Required Test Layers

### Layer 1: Static Validation

Runs without launching the app.

Checks:

- TypeScript typecheck.
- Rust check/clippy where applicable.
- Formatting checks.
- Lint checks.
- Translation key checks for new UI strings.
- Secret scanning for obvious committed secrets.
- Documentation link/file existence checks for spec files.

### Layer 2: Unit Tests

Covers pure logic.

Required areas:

- Desktop mode selection.
- Policy merge/precedence.
- Remote config validation.
- API request validation.
- Authz checks.
- Quota checks.
- Worker retry classification.
- Error code mapping.
- Retention cleanup decisions.

### Layer 3: API Integration Tests

Runs server API with test dependencies.

Required scenarios:

- Health endpoint works.
- Authenticated policy fetch works.
- Unauthenticated transcription rejected.
- Valid transcription job accepted.
- Oversized audio rejected.
- Too-long audio rejected.
- Unsupported audio rejected.
- Quota exceeded rejected.
- Job result returned.
- Failed job returns safe error.
- Logs do not contain synthetic audio marker.
- Logs do not contain synthetic transcript marker by default.

### Layer 4: Worker Integration Tests

Runs worker against the selected test handoff mechanism: in-process, queue, internal RPC, storage-backed handoff, or streaming.

Required scenarios:

- Worker receives/claims synthetic work through the selected mechanism.
- Worker processes known fixture.
- Worker writes or returns completed result.
- Worker handles corrupt audio.
- Worker handles missing model.
- Worker handles retryable failure.
- Worker handles cancellation if supported.
- Worker cleans temp files after success/failure/cancellation.
- Worker emits safe metrics/logs.
- Worker health/capability output identifies real versus fake mode.

### Layer 5: Desktop Integration Tests

Runs desktop app or desktop backend in test mode.

Required scenarios:

- Local mode remains default after clean install.
- Remote server can be configured.
- Authentication state is represented.
- Policy is fetched and cached.
- Remote-required policy blocks local fallback.
- Remote unavailable shows correct error.
- Remote success inserts/pastes or reports final text through test harness.
- History obeys policy.

### Layer 6: End-To-End System Tests

Runs desktop test harness + API + selected handoff/lifecycle + worker + synthetic audio.

Required happy path:

1. Start server API in test mode.
2. Start selected handoff/storage/database test dependencies if applicable.
3. Start worker with test model or deterministic fake model if the selected lifecycle uses a worker process.
4. Start desktop in test mode.
5. Configure server and test credential.
6. Load policy.
7. Submit synthetic audio.
8. Worker or in-process test backend returns deterministic transcript.
9. Desktop receives result.
10. Desktop routes text to a test paste target or captured output.
11. Test verifies expected text.
12. Test verifies no sensitive fixture markers appear in logs or support output.

Required failure paths:

- Server down.
- Credential expired.
- Credential/device revoked.
- Policy blocks action.
- Worker unavailable if worker exists.
- Handoff/backlog overloaded if selected lifecycle has backlog.
- Audio too large.
- Transcription timeout.
- Cancellation if supported.
- Quota/rate-limit exceeded.

### Layer 7: AI Agent Regression Script

A single command should run the appropriate autonomous suite for the current development stage.

Examples of desired commands:

- `bun run test:enterprise:unit`
- `bun run test:enterprise:api`
- `bun run test:enterprise:worker`
- `bun run test:enterprise:e2e`
- `bun run test:enterprise:ai-smoke`

Exact commands can change during implementation, but the final system must provide simple entry points.

## Synthetic Audio Fixtures

The test system must not depend on a human microphone.

Required fixtures:

- Short valid speech audio.
- Silence audio.
- Too-long generated audio.
- Too-large generated audio.
- Corrupt audio file.
- Unsupported format file.
- Fixture with known metadata: sample rate, channels, duration, byte size.
- Fixture that can exercise language/model metadata if needed.

Preferred content:

- Synthetic or openly licensed fixture.
- Deterministic phrase such as: “MotsDits enterprise test phrase”.
- No personal or customer data.
- No real customer audio.

Fixture rules:

- Fixtures must be checked into repo only if licensing permits it.
- Generated fixtures must be reproducible by command.
- Oversized/too-long fixtures may be generated at test time to avoid large repo files.
- Fixture markers used for leak tests must be unique enough to grep reliably.

If real model transcription is nondeterministic:

- Use a fake deterministic transcription worker for most E2E tests.
- Use real model smoke tests separately.

## Fake Deterministic Worker

A fake worker is required for reliable AI-driven development testing.

Behavior:

- Accepts work through the same selected contract as the real worker.
- Reads work metadata.
- Does not need GPU or real model files.
- Returns deterministic transcript based on fixture name or audio marker.
- Can be configured to fail with specific error codes.
- Can be configured to delay or timeout.
- Emits the same result shape as real worker.
- Marks itself clearly as fake/test mode in health/version/metrics.

Purpose:

- Test API/desktop/policy/handoff behavior without GPU dependency.
- Make CI predictable.
- Let AI agents test quickly.

## Real Model Smoke Tests

Separate from deterministic tests.

Purpose:

- Verify real inference still works.
- Detect model/runtime integration failures.

Constraints:

- May be slower.
- May be platform-specific.
- May be skipped if model/GPU unavailable.
- Must not block all development loops unless required by release gate.

## Desktop Test Mode

The desktop app needs a way to run without human interaction.

Required test-mode capabilities:

- Inject synthetic audio instead of microphone input.
- Capture paste output instead of typing into real apps.
- Use test server URL.
- Use test credential.
- Expose current mode/status for assertions.
- Expose last error code and correlation ID for assertions.
- Expose policy version/freshness for assertions.
- Disable destructive OS interactions.
- Avoid global keyboard shortcut side effects unless explicitly testing shortcuts.
- Produce structured test logs.

Possible mechanisms:

- CLI flags for test mode.
- Tauri commands only available in test builds.
- Environment variables for test harness.
- Dedicated integration test binary.

## Browser/UI Automation

If admin console or desktop UI needs visual testing:

- Use automated browser/UI tooling where possible.
- Test core flows through stable selectors.
- Avoid brittle pixel-perfect tests unless validating layout.

Required UI checks:

- Remote/local mode indicator visible.
- Policy locked setting visible.
- Authentication status visible.
- Error banner visible.
- Connection test result visible.

## Log Safety Tests

Every autonomous suite touching audio/transcript must include marker-based leak detection.

Test method:

- Use synthetic unique marker in audio fixture metadata or fake transcript.
- Run flow.
- Scan logs/support output.
- Fail if marker appears where not allowed.

Required forbidden markers:

- Fake raw audio marker.
- Fake transcript marker.
- Fake credential/token marker.
- Fake secret marker.
- Fake prompt/custom-word marker if those features are under test.

Leak scan targets:

- API logs.
- Worker logs.
- Desktop logs.
- Test reports.
- Support bundles.
- Metrics/traces if exported in test.

## Environment Isolation And Cleanup

Autonomous tests must not pollute a real user environment.

Requirements:

- Use isolated test config directories.
- Use isolated test database/storage/handoff namespace.
- Use synthetic credentials only.
- Clean temporary audio/artifacts after tests.
- Clean support bundles after tests.
- Avoid writing to real clipboard or active apps in test mode.
- Avoid registering real global shortcuts unless explicitly testing shortcut behavior.
- Fail safely if test mode would touch production config or production server URL.

## Flake Handling

Tests must distinguish product failure from environmental flake.

Rules:

- Retry only known flaky infrastructure setup steps, not failed assertions.
- Report retry count.
- Preserve logs for failed attempts.
- Never hide a privacy leak failure behind retry.
- Timeouts must be explicit and reported with scenario names.

## Test Reports

Every AI-runnable suite must output:

- Exit code.
- Machine-readable result file if possible.
- Human-readable summary.
- Failed scenario names.
- Relevant correlation IDs.
- Log file paths.
- Artifact paths.
- Environment/test mode summary.
- Whether fake or real worker/model was used.
- Whether leak scan passed.

## Release And Stage Gates

A development stage may be considered complete only when its relevant test layer passes.

Minimum gates:

- Desktop behavior change: desktop test mode or UI automation covers it.
- API contract change: API integration tests cover happy and failure paths.
- Worker change: fake/deterministic worker tests pass; real smoke runs if relevant and available.
- Security/privacy change: leak tests pass.
- Policy/auth/quota change: unit and integration enforcement tests pass.
- Infrastructure/operations change: smoke health and cleanup tests pass.

## AI Agent Operating Rules

During development, the AI agent should:

1. Run the smallest relevant test first.
2. Run broader integration tests after changes cross service boundaries.
3. Run E2E smoke before declaring a feature path complete.
4. If UI changed, run the UI path, not only typecheck.
5. If security/privacy behavior changed, run leak-detection tests.
6. If worker/model behavior changed, run deterministic worker tests and real model smoke if available.
7. If auth/credential behavior changed, run revoked/expired/disabled access tests.
8. If quota/rate-limit behavior changed, run accounting and enforcement tests.
9. If infrastructure cleanup changed, run cleanup and artifact-retention tests.

## Open Decisions For Future Planning

These decisions are intentionally not forced by this spec:

1. Exact test framework.
2. Exact command names.
3. Exact browser/UI automation tool.
4. Whether desktop test mode is dev-only or available through hidden diagnostics.
5. Exact fake worker configuration mechanism.
6. Exact real model used for smoke tests.
7. Which tests run in CI versus local-only.
8. How large generated fixtures are produced/cached.
9. Whether admin console UI tests are required in the first MVP.

The implementation plan must resolve these before development starts.

## Acceptance Checklist

This spec is satisfied when:

- AI can test without microphone input.
- AI can test without GPU for deterministic E2E.
- AI can test without touching real clipboard/apps by default.
- Real model smoke remains possible.
- Desktop test mode can capture output.
- Fake deterministic worker follows the selected lifecycle/handoff contract.
- Failure modes are automated.
- Auth/policy/quota/security failure paths are automated.
- Log/support/metrics/trace leak detection exists where applicable.
- Test environment isolation and cleanup are defined.
- Flake handling rules are defined.
- One-command test entry points exist.
- Reports are useful for autonomous debugging.
- Stage/release gates are explicit.
- Open decisions are listed instead of hidden.
