# 02 - Desktop Client Spec

## Purpose

Define all required changes to the MotsDits desktop application so it can support enterprise centralized transcription while preserving the current local-first experience.

This file must be usable on its own after a long pause in development. A future implementation plan must be able to answer what the desktop app must store, show, enforce, send, receive, test, and refuse without relying on memory.

## Scope

This spec defines:

- Desktop configuration required for remote/enterprise mode.
- Desktop authentication and enrollment behavior.
- Desktop policy fetching, caching, freshness, and enforcement.
- Desktop audio capture and upload behavior for remote transcription.
- Desktop result handling, paste behavior, history behavior, and post-processing boundaries.
- Desktop UI states required to avoid hidden privacy changes.
- Desktop fallback, retry, revocation, and failure behavior.
- Desktop test-mode requirements needed for autonomous AI testing.

This spec does not define:

- Exact server API endpoint shapes.
- Exact authentication protocol.
- Exact worker implementation.
- Exact admin console UI.
- Exact pricing, quotas, or licensing.

Those details belong in the other spec sheets, but they must not contradict this file.

## Current Desktop Responsibilities

The desktop app currently owns:

- Microphone capture.
- Voice activity detection.
- Local transcription pipeline.
- Model selection and downloads.
- Custom words, aliases, blacklist, and corrections.
- Optional post-processing.
- Clipboard/paste insertion.
- Local settings.
- Local history.
- Shortcuts.
- Platform-specific audio, clipboard, overlay, shortcut, tray, and ONNX runtime behavior.

Enterprise centralized mode must integrate with this app without breaking these responsibilities.

## Required New Desktop Capabilities

### Local-First Upgrade Safety

The desktop app must preserve existing behavior after enterprise code is added.

Requirements:

- Fresh install defaults to personal local mode.
- Upgrade of an existing install keeps local mode.
- No migration may enable remote mode automatically.
- No enterprise login screen may block personal local use.
- No audio may be sent to a server unless remote mode is explicitly configured by the user or by a managed enterprise enrollment.
- Existing shortcuts and CLI controls must continue to work for local mode.
- Existing local history behavior must continue unless changed by an explicit local setting or enterprise policy.

### Remote Server Configuration

The desktop app must be able to store and use enterprise server configuration.

Required fields:

- Server URL.
- Server display name.
- Deployment type if known: personal remote, self-hosted enterprise, managed single-tenant, or managed multi-tenant.
- Organization identifier if applicable.
- Organization display name if applicable.
- Authentication status.
- Device identifier if applicable.
- Current policy version if applicable.
- Policy cache freshness/expiration if applicable.
- Remote mode enabled/disabled state.
- Active processing mode: local, remote, or hybrid.
- Fallback configuration and fallback direction if applicable.
- Last successful connection timestamp.
- Last policy fetch timestamp.
- Last error summary.

Security requirements:

- Secrets must be stored in an OS-appropriate secure storage when available.
- Tokens must not be logged.
- Server URL must be validated before use.
- Production remote mode must require HTTPS unless explicitly running in local development mode.
- Development-mode insecure URLs must be visibly marked as development-only.
- Exported diagnostics must redact server credentials and tokens.

### Enrollment And Configuration Sources

The desktop app must support explicit entry into remote/enterprise mode.

Allowed configuration sources:

- Manual user entry for personal remote mode.
- Enrollment link or device code for enterprise mode.
- Admin-provided configuration file.
- Managed installer/profile in a future enterprise deployment.
- Environment variables or CLI flags only for development/testing unless explicitly productized.

Requirements:

- The app must show the source of enterprise configuration when available.
- Personal remote configuration must be user-removable.
- Managed enterprise configuration may be locked by policy.
- If multiple configuration sources exist, precedence must be deterministic and visible in diagnostics.
- A managed enterprise configuration must not be silently overridden by personal user settings.
- A personal remote configuration must not claim to be organization-managed.

### Authentication Flow

The desktop app must support at least one pilot authentication method and leave room for stronger enterprise methods.

Pilot acceptable options:

- User enters a server-issued pilot credential.
- User signs in through browser/device code.
- Admin pre-provisions a config file with enrollment/session/device credentials.

MVP expected options:

- User login.
- Device/session token.
- Refresh flow or re-authentication flow.
- Logout/revoke locally stored token.

Enterprise future options:

- OIDC.
- SSO through browser.
- Device approval.
- Managed deployment profile.

Desktop requirements:

- Show signed-in user or device identity.
- Show organization name when organization-managed.
- Show whether the connection is personal remote or organization-managed.
- Support logout/disconnect when policy allows it.
- Detect expired credentials.
- Detect revoked credentials when the server returns a revoked status.
- Do not retry authentication forever.
- Do not paste raw auth errors containing secrets.
- Do not expose raw token values in settings, logs, support bundles, screenshots, or error details.
- After logout/disconnect, return to local mode unless a managed policy still controls the device.

### Revocation And Access Loss

The desktop app must handle access loss explicitly.

Requirements:

- If user/device credentials are revoked, remote transcription must stop.
- Cached policy must not be used to bypass revoked access.
- The UI must show that access was revoked or disabled.
- Stored credentials must be cleared or invalidated when revocation is confirmed.
- If organization access is disabled, the app must not silently continue as personal remote mode.
- Local mode may remain available only if policy and enrollment state allow it.

### Policy Fetching

The app must fetch organization policy from the server when authenticated.

Policy controls may include:

- Local transcription allowed.
- Remote transcription allowed.
- Remote transcription required.
- User can choose mode.
- Local fallback allowed.
- Fallback direction: remote to local, local to remote, or both.
- History allowed.
- Server history allowed.
- Audio retention allowed.
- Allowed models.
- Default model.
- Allowed post-processing providers.
- Custom words policy.
- Organization word list policy.
- Maximum recording duration.
- Maximum upload size.
- Maximum policy cache age.
- Debug logging level.
- Support bundle permissions.

Requirements:

- Policy must be cached for offline display.
- Policy cache must have a freshness indicator.
- Policy cache must have an expiration/freshness rule.
- If policy requires remote and server is unreachable, the app must fail closed unless cached policy explicitly allows fallback and is still valid.
- If policy is expired or missing while the device is organization-managed, the app must not silently revert to unmanaged personal behavior.
- Policy conflicts must produce clear errors.
- Policy-controlled settings must be visibly locked in the UI.
- The app must record the policy version used for each remote transcription attempt in diagnostics and history metadata if history is enabled.

### Mode Resolution

The desktop app must make one mode decision before each transcription attempt.

Inputs:

- Enrollment state.
- Server configuration.
- Authentication state.
- Current policy.
- User preference when unmanaged.
- Fallback settings.
- Server availability where relevant.

Rules:

- Managed policy beats local user preference.
- Unmanaged user preference beats auto-detection.
- Local mode is the safe default when no remote server is configured.
- If the app cannot determine the active mode safely, it must not start transcription.
- The chosen mode must be available to UI, logs, diagnostics, and test assertions.

### Audio Capture And Preparation

Remote mode still starts with local capture.

Requirements:

- Microphone capture remains platform-specific/local.
- Recording controls and cancellation must behave consistently across local and remote modes.
- Audio sent to a server must respect maximum duration and upload-size policy before upload.
- The app must know or derive audio format, sample rate, channels, duration, and byte size before request validation where possible.
- The app must not write raw captured audio to normal logs.
- Temporary audio buffers/files must be deleted after success, failure, cancellation, or retry expiration according to policy.
- If a retry would change processing location, the user/admin policy must explicitly allow reusing the captured audio under that different privacy expectation.

### Remote Transcription Request Flow

The app must support sending recorded audio to the enterprise server.

Required request metadata:

- Client app version.
- Platform.
- Processing mode.
- Organization/user/device identity through auth token when authenticated.
- Policy version when organization-managed.
- Audio format.
- Sample rate.
- Channel count.
- Duration.
- Byte size.
- Requested language if known.
- Requested model or policy default.
- Whether post-processing is requested.
- Whether client-side corrections should still run.
- Correlation ID for logs.
- Idempotency key if the server supports retry-safe job creation.

Audio handling requirements:

- Audio must be encoded in a server-supported format.
- Audio duration must respect policy limits.
- Upload byte size must respect policy limits.
- App must not keep temporary audio longer than needed.
- App must delete retry buffers after success/failure/cancellation according to policy.
- App must not write raw audio to normal logs.
- App must not include transcript/audio data in error telemetry unless explicitly allowed by policy.
- The app must clearly distinguish upload failure, queue/job failure, worker failure, and result retrieval failure.

### Progress And Cancellation

The desktop app must expose remote transcription progress states.

Required states:

- Recording.
- Preparing upload.
- Uploading.
- Queued.
- Processing remotely.
- Receiving result.
- Completed.
- Failed.
- Cancelled.

Requirements:

- User cancellation must stop recording if still recording.
- User cancellation must stop upload if possible.
- User cancellation must request server/job cancellation if a cancellable remote job already exists.
- If server-side cancellation is not supported in the first pilot, the UI must still stop waiting and explain that the server may finish/discard the job according to policy.
- The desktop must not paste a result from a job the user cancelled locally unless the user explicitly retries or accepts it.

### Result Handling

The desktop must handle server results consistently with local transcription.

Required result fields:

- Transcript text.
- Final/partial status if streaming exists.
- Language if detected.
- Model used.
- Processing mode.
- Server job ID.
- Error code if failed.
- Safe user-facing message if failed.

Behavior:

- Final text is pasted through existing paste mechanism.
- Local history records result only if allowed.
- History entry must include processing mode if history exists.
- History entry must include server job ID and policy version if remote and if history is enabled.
- If server returns corrections/post-processing already applied, desktop must avoid applying duplicate transformations.
- If server returns partial results, the desktop must not paste unstable partial text into the active app unless a specific streaming UX is designed.
- If the active app/paste target changed during a long remote job, the desktop must follow a defined paste policy instead of blindly pasting into an unintended target.

### Paste Target Safety

Remote transcription can take longer than local transcription, so paste target handling must be explicit.

Required decision before implementation:

- Paste into the currently focused app at completion.
- Paste into the app that was focused when recording started.
- Ask/confirm if focus changed.
- Store result in history/clipboard without auto-paste if focus changed.

Minimum safe requirement:

- The app must not ignore focus-change risk for long remote jobs.
- Test mode must capture paste output without typing into a real application.

### Remote Status UI

The user must understand what mode is active.

Required UI surfaces:

- Settings page remote server status.
- Recording/transcribing indicator showing local vs remote.
- Error banner for remote unavailable.
- Policy lock indicator if organization controls a setting.
- Connection test result.

Required states:

- Not configured.
- Configured but not authenticated.
- Authenticated.
- Personal remote server connected.
- Connected to organization.
- Policy loaded.
- Policy cached.
- Policy expired.
- Policy unavailable.
- Remote server unreachable.
- Token expired.
- Credential/token or device revoked.
- Organization disabled access.
- Remote transcription in progress.
- Local fallback available.
- Local fallback active.
- Fallback blocked by organization policy.
- Transcription disabled by organization policy.

### Remote Failure UX

Failure messages must be actionable without exposing sensitive internals.

Examples of required error categories:

- Server unreachable.
- Authentication expired.
- Token/device revoked.
- Organization disabled.
- Policy unavailable.
- Policy expired.
- Organization policy blocks action.
- Recording too long.
- Upload too large.
- Unsupported audio format.
- Upload failed.
- Queue overloaded.
- Worker unavailable.
- Worker failed.
- Transcription timed out.
- Job cancelled.
- Quota exceeded.
- Paste target changed or unavailable.

Each category needs:

- User-facing message.
- Machine-readable error code.
- Log correlation ID.
- Whether retry is allowed.
- Whether local fallback is allowed.
- Whether remote retry is allowed.
- Whether captured audio is still retained for retry.
- Whether user action or admin action is needed.

### Local Fallback

Fallback must be explicit and policy-driven.

Rules:

- If remote is required by policy, local fallback is not allowed.
- If fallback is allowed, app may offer local retry.
- App must not silently switch from local to remote because that changes privacy.
- App may switch from remote to local only if policy and user settings allow it, and the UI must explicitly show the mode change before or during the retry.
- Fallback direction must be explicit: remote to local, local to remote, or both.
- If a recording has already been captured under one privacy expectation, it must not be reused under a different processing location unless policy/user consent explicitly allows that retry.
- Fallback must not hide the original failure.

### Settings Schema Changes

The settings schema must support remote configuration without breaking existing local settings.

New setting categories:

- Enterprise server.
- Configuration source.
- Deployment type.
- Authentication.
- Organization/device identity.
- Policy cache.
- Processing mode.
- Fallback behavior.
- Remote privacy summary.
- Audio upload limits.
- History policy.
- Post-processing policy.
- Diagnostic logging.
- Support bundle permissions.

Migration requirement:

- Existing users must keep local mode after upgrade.
- No migration may enable remote mode automatically.
- Existing local history must not become server-synced automatically.
- Existing post-processing settings must not become organization-wide automatically.

### Diagnostics And Support

The desktop app must help support remote failures without leaking sensitive content.

Required diagnostic fields:

- App version.
- Platform.
- Active mode.
- Server display name and URL with secrets redacted.
- Organization name/ID if applicable.
- Device ID if applicable.
- Authentication status without token value.
- Policy version and freshness.
- Last correlation ID.
- Last error code.
- Last connection test result.

Support bundle rules:

- No raw audio by default.
- No transcript text by default.
- No tokens/secrets ever.
- Include logs only after redaction.
- Include policy summary only without secrets.

### Desktop Test Mode

The desktop app must support autonomous AI testing.

Required capabilities:

- Inject synthetic audio instead of microphone input.
- Configure test server and test credential without manual UI entry.
- Capture paste output without typing into a real app.
- Expose current mode/status for assertions.
- Expose last error code and correlation ID for assertions.
- Disable destructive OS interactions.
- Produce structured test logs.

This test mode is required so future development can validate remote transcription without a human speaking into a microphone every turn.

### CLI Integration

Existing CLI controls must work with remote mode.

Existing commands such as transcription toggle and post-process toggle must:

- Respect enterprise policy.
- Use the resolved active mode; remote mode is used only when selected, configured, or required by valid policy.
- Report remote-mode errors through app events/logs.
- Not require a visible main window if start-hidden is used.
- Return or expose failure status in a way automation can observe.
- Preserve cancellation behavior for local and remote jobs.

Enterprise/test CLI additions may eventually include:

- Configure remote server for test/dev.
- Run connection test.
- Print current mode/policy summary with secrets redacted.
- Inject synthetic audio in test mode.
- Capture transcription output in test mode.

### Platform Considerations

Remote mode must preserve platform-specific behavior boundaries.

Still local/platform-specific:

- Microphone capture.
- Shortcut handling.
- Clipboard/paste.
- Overlay behavior.
- Tray behavior.

Shared/core remote logic:

- Server config.
- Auth state.
- Policy resolution.
- Mode resolution.
- Request creation.
- Result handling.
- History policy enforcement.
- Diagnostics and redaction.

Platform-specific testing requirement:

- Any change to microphone capture, shortcut handling, paste behavior, tray behavior, or overlay behavior must be tested on the affected platform, not only through server/API tests.

## Open Decisions For Future Planning

These decisions are intentionally not forced by this spec:

1. First desktop platform target for enterprise remote mode.
2. First enrollment method.
3. First authentication method.
4. First remote transport: sync upload, async polling, chunked upload, or streaming.
5. Paste target behavior when focus changes during a remote job.
6. Whether local fallback is allowed in the first enterprise pilot.
7. Whether server-side or client-side post-processing owns final correction in the first pilot.
8. Whether remote mode supports partial transcripts in the first pilot.
9. Whether test mode is exposed only in dev builds or also through hidden diagnostics in production.

The implementation plan must resolve these before development starts.

## Required Desktop Tests

### Unit Tests

- Mode selection precedence.
- Policy conflict resolution.
- Policy cache freshness and expiration.
- Remote config validation.
- Configuration-source precedence.
- Error code mapping.
- History allowed/blocked behavior.
- Fallback decision logic.
- Revocation/access-loss handling.
- Diagnostic redaction.
- Paste target policy decision.

### Integration Tests

- Remote server connection test.
- Successful remote transcription with mocked server.
- Authentication failure.
- Token/device revoked.
- Policy requires remote.
- Policy unavailable.
- Policy expired.
- Policy blocks local history.
- Remote quota exceeded.
- Remote unavailable with fallback allowed.
- Remote unavailable with fallback blocked.
- Upload too large.
- Recording too long.
- Cancellation before upload.
- Cancellation after job creation.
- Focus/paste target changed if paste policy is implemented.
- Test mode synthetic audio to captured output.

### Manual or AI-Assisted UI Tests

- User can configure remote server.
- User can see remote/local status.
- User can authenticate.
- User can disconnect when allowed.
- User can record and receive remote transcript.
- User sees clear error when server is down.
- User sees policy-locked settings.
- User sees policy cached/expired/unavailable state.
- User sees revoked/disabled access state.
- User sees whether retry will use remote or local fallback.
- User sees safe privacy summary before enabling remote mode.

## Acceptance Checklist

This spec is satisfied when:

- Desktop can represent local, remote, managed, and hybrid mode states.
- Desktop can preserve local-first behavior after upgrade.
- Desktop can configure/enroll into a remote server explicitly.
- Desktop can authenticate to a server.
- Desktop can detect expired, revoked, and disabled access.
- Desktop can fetch, cache, expire, and enforce policy.
- Desktop can resolve mode before each transcription attempt.
- Desktop can capture audio locally and prepare it safely for remote upload.
- Desktop can send audio and receive transcript.
- Desktop can display processing location and fallback direction.
- Desktop can handle progress, cancellation, retry, and failure states.
- Desktop can enforce history/post-processing policy boundaries.
- Desktop can avoid duplicate correction/post-processing.
- Desktop can provide safe diagnostics without audio/transcript/token leakage.
- Desktop test mode can inject synthetic audio and capture output.
- Existing local mode remains unchanged by default.
- CLI and shortcut behavior still work.
- Failure behavior is predictable and testable.
- Open decisions are listed instead of hidden.
