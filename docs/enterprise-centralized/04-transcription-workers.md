# 04 - Transcription Workers Spec

## Purpose

Define the worker infrastructure that performs centralized transcription work for MotsDits Enterprise.

The worker layer is where audio becomes text. It must be reliable, observable, secure, scalable, and compatible with MotsDits' model strategy.

This file must be usable on its own after a long pause in development. A future implementation plan must be able to answer how work reaches a worker, how a worker validates audio/model/policy metadata, how inference runs, how results are returned, how failures/retries/cancellation work, and how sensitive content stays out of logs.

## Scope

This spec defines:

- Worker responsibilities and non-responsibilities.
- Supported worker deployment models.
- Work handoff options without forcing a specific queue product.
- Worker lifecycle, model management, audio validation, inference, result handling, retry, cancellation, security, observability, and test requirements.
- Fake deterministic worker requirements for autonomous AI testing.

This spec does not define:

- Exact queue/job handoff product.
- Exact model runtime.
- Exact GPU vendor/runtime.
- Exact server API route shapes.
- Exact deployment platform.

Those details belong in implementation planning or other spec sheets, but they must not contradict this file.

## Worker Responsibilities

A transcription worker must:

- Receive or claim transcription work through the selected handoff mechanism.
- Fetch or receive audio safely.
- Validate work metadata.
- Validate server/API-provided policy-relevant fields defensively.
- Load the requested/allowed model.
- Run transcription inference or deterministic fake inference in test mode.
- Apply server-side correction/post-processing only if configured.
- Return result or failure state through the selected result contract.
- Report health, version, capacity, and metrics.
- Avoid leaking sensitive content into logs.

A worker must not:

- Accept jobs directly from unauthenticated desktop clients.
- Expose a public transcription endpoint unless the whole API/worker architecture explicitly makes the worker the authenticated API boundary.
- Bypass organization policy.
- Trust client-provided metadata without API/auth context.
- Keep raw audio longer than retention allows.
- Log raw audio.
- Log transcript text by default.
- Execute client-provided commands, scripts, model paths, or prompts as code.
- Crash the whole fleet because one job fails.

## Worker Deployment Models

### In-Process Pilot Worker

A pilot can start with worker logic running in the same process as the API if the first lifecycle is synchronous or simple.

Requirements:

- The boundary between API validation and worker inference remains explicit in code/design.
- Worker logic exposes version/capability information internally.
- Worker failures are converted to stable API errors.
- Sensitive logging restrictions still apply.

### Single External Worker Pilot

A pilot can start with one external worker process on the same machine as the API.

Requirements:

- Queue, direct RPC, filesystem handoff, or another explicit job handoff exists.
- Worker can be restarted independently if possible.
- Worker exposes health/version/capability information.
- Worker logs state transitions safely.

### Dedicated Worker Host

The API and worker run on separate machines or containers.

Requirements:

- Shared job handoff backend or authenticated internal RPC.
- Shared temporary storage if needed.
- Worker authentication to internal services.
- Metrics per worker.
- Version reporting per worker.

### GPU Worker Pool

Multiple workers run on GPU hosts.

Requirements:

- Worker capacity reporting.
- GPU availability reporting.
- Job handoff backlog/depth monitoring where applicable.
- Model preload/cache strategy.
- Concurrency limits.
- Backpressure when overloaded.

### CPU Worker Pool

CPU-only processing may exist for fallback or low-volume deployments.

Requirements:

- Clear performance expectations.
- Different backlog/concurrency limits from GPU workers.
- Ability to reject workloads too large for CPU SLA.

## Work Handoff Requirements

The implementation must choose an explicit work handoff mechanism. This spec does not force a queue product.

Allowed handoff patterns:

- In-process function call for a narrow synchronous pilot.
- Queue-backed asynchronous jobs.
- Authenticated internal RPC from API to worker.
- Filesystem/object-storage handoff with metadata record.
- Streaming handoff if a streaming lifecycle is explicitly selected.

If queue-backed handoff is used, it must support:

- Job creation.
- Job claiming.
- Job acknowledgment.
- Job failure.
- Retry policy.
- Dead-letter or failed job state.
- Visibility timeout or lease.
- Job cancellation if supported.
- Backlog/depth metrics.

If internal RPC handoff is used, it must support:

- Authentication between API and worker.
- Request timeout.
- Backpressure/overload response.
- Stable failure mapping.
- Correlation ID propagation.

Work payload should include references, not raw audio, when possible.

Required work fields:

- Job/work ID if asynchronous.
- Organization ID from authenticated server context.
- User/device ID from authenticated server context if needed for policy/usage.
- Correlation ID.
- Audio location, stream, or inline payload reference.
- Audio format metadata.
- Sample rate.
- Channel count.
- Duration.
- Byte size.
- Requested model or model policy.
- Policy version used.
- Language hint if any.
- Post-processing flag if any.
- Created timestamp.
- Deadline/timeout.
- Retry count if applicable.
- Idempotency reference if applicable.

## Worker Work Lifecycle

Required states when asynchronous work is used:

1. queued or pending handoff.
2. claimed or accepted by worker.
3. audio_loading.
4. audio_validating.
5. model_loading.
6. transcribing.
7. post_processing if enabled.
8. result_writing.
9. completed, failed, cancelled, or expired.

Required states when synchronous in-process work is used:

1. accepted.
2. audio_validating.
3. model_loading.
4. transcribing.
5. post_processing if enabled.
6. completed, failed, or timed_out.

Every state transition should be observable with correlation ID and job/work ID when available.

## Model Management

Workers need access to approved transcription models.

Requirements:

- Model catalog or configured model list.
- Model version reporting.
- Model runtime/backend reporting.
- Model integrity verification if downloaded.
- Model cache directory.
- Startup validation for required models when configured.
- Lazy-load option for large models if selected.
- Ability to reject unsupported requested model.
- Clear error when model is missing.
- Clear error when model runtime/backend is unavailable.
- Model cache cleanup strategy.

Policy interaction:

- User requested model must be checked against organization policy by the API before work handoff.
- If no model is requested, API/worker uses policy default according to the selected contract.
- Worker should not trust only the client; API should validate first, worker should still defensively validate work metadata.
- Worker must report the actual model used so the API/client can record accurate diagnostics/history.
- Worker must not load arbitrary client-provided model paths or URLs.

## Audio Input Requirements

Supported audio formats must be explicit.

Pilot should support one simple internal format first.

Required metadata:

- Encoding.
- Sample rate.
- Channels.
- Duration.
- Byte size.

Validation:

- Reject unsupported format.
- Reject too large.
- Reject too long.
- Reject corrupted/unreadable audio.
- Reject mismatched metadata if detected.
- Reject missing audio reference/payload.
- Reject audio that exceeds worker capability even if API validation missed it.

Temporary file handling:

- Use safe temp directories.
- Avoid predictable file names.
- Delete temp files after processing.
- Delete temp files after cancellation, timeout, or validation failure.
- Do not leave audio in crash-prone paths without cleanup.
- Cleanup failures must be logged safely and surfaced as operational metrics.

## Inference Requirements

Worker inference must report:

- Model used.
- Model version if available.
- Runtime/backend used.
- Inference start/end.
- Processing duration.
- Real-time factor if possible.
- Device type: CPU/GPU/fake.
- Worker version.
- Worker ID.

Failure categories:

- model_missing.
- model_load_failed.
- model_runtime_unavailable.
- audio_decode_failed.
- audio_invalid_metadata.
- transcription_failed.
- post_processing_failed if server-side post-processing is enabled.
- worker_timeout.
- gpu_unavailable.
- out_of_memory.
- cancelled.
- result_write_failed.

## GPU Requirements

GPU use is not just “install a GPU”. It requires operating constraints.

Required decisions:

- Which GPU vendor is supported first.
- Which runtime/backend is supported first.
- Whether multiple jobs can share one GPU.
- Max concurrent jobs per GPU.
- Whether models are preloaded.
- How GPU memory exhaustion is handled.

Required metrics:

- GPU available/unavailable.
- Active jobs per GPU.
- Model load time.
- Inference time.
- Worker memory usage if available.
- GPU memory usage if available.

## Result Handling

Worker returns or writes result through the selected API/database/storage contract.

Result must include:

- Job/work ID if available.
- Transcript text when completed.
- Language if detected.
- Model used.
- Model version if available.
- Runtime/backend used.
- Worker ID.
- Processing duration.
- Error code if failed.
- Safe failure message if failed.
- Retryable true/false if worker can classify it.
- Cancellation status if cancelled.

Text privacy:

- Transcript text may be stored only if policy allows.
- Worker logs must not include full transcript text by default.
- Debug mode may include truncated/synthetic-safe output only if explicitly enabled and safe.

## Retry Policy

Not every failure should retry.

Retryable examples:

- Temporary worker crash.
- Queue lease timeout if queue handoff is selected.
- Internal RPC timeout if RPC handoff is selected.
- Temporary storage read failure.
- GPU temporarily unavailable.
- Temporary result write failure.

Non-retryable examples:

- Unsupported audio format.
- Audio too large.
- Policy violation.
- Missing required model unless operator intervention is expected.
- Corrupted audio.

Requirements:

- Max retry count.
- Backoff policy.
- Dead-letter/failed state or equivalent terminal failure state.
- Retry reason recorded.
- Avoid duplicate billing/usage for retried same work.
- Preserve correlation ID across retries.
- Avoid retry storms when GPU/model/storage is globally unavailable.

## Cancellation

Eventually workers should support cancellation.

Required behavior if implemented:

- Client/API can mark job cancelled.
- Worker checks cancellation between major steps.
- Worker stops processing if safe.
- Temporary audio is cleaned up.
- Result state becomes cancelled.

Pilot may omit active cancellation if jobs are short.

## Worker Health, Capacity, And Versioning

Workers must report enough state for API/operator decisions.

Required fields:

- Worker ID.
- Worker version.
- Supported worker protocol version.
- Supported models.
- Supported audio formats.
- Supported lifecycle/handoff modes.
- CPU/GPU/fake capability.
- Current capacity or concurrency limit.
- Current active work count.
- Readiness state.

Readiness must fail if the worker cannot process configured required models or cannot access required storage/handoff dependencies.

## Fake Deterministic Worker

A fake deterministic worker is required for autonomous AI testing.

Requirements:

- Accept the same work contract as the real worker for the selected lifecycle.
- Return deterministic transcript text without requiring GPU or real model files.
- Support configured failure modes.
- Support configured delay/timeout scenarios.
- Emit the same result shape as real workers.
- Respect sensitive logging rules.
- Be clearly marked as fake/test mode in health/version/metrics.

The fake worker must not be usable accidentally as a production transcription backend unless explicitly configured for development/test.

## Worker Security

Requirements:

- Workers only trust work from the authenticated API, selected internal handoff mechanism, or explicitly configured in-process boundary.
- Workers authenticate to storage/database if needed.
- Workers run with minimal permissions.
- Workers do not expose public transcription endpoints unless explicitly designed as the authenticated API boundary.
- Workers do not execute client-provided scripts.
- Workers do not load client-provided arbitrary model paths or URLs.
- Model files come from trusted sources.
- Temporary audio paths are isolated.
- Worker logs redact secrets and avoid transcript/audio content by default.

## Open Decisions For Future Planning

These decisions are intentionally not forced by this spec:

1. First worker shape: in-process, external process, dedicated host, or pool.
2. First handoff mechanism: function call, queue, internal RPC, storage-backed handoff, or streaming.
3. First real model/runtime/backend.
4. First GPU vendor/runtime, if any.
5. Whether the pilot uses fake worker only, real worker only, or both.
6. Whether cancellation is active in the first pilot.
7. Whether server-side post-processing runs in the worker or elsewhere.
8. Whether models are preloaded or lazy-loaded.
9. How many concurrent jobs one worker can process.

The implementation plan must resolve these before development starts.

## Required Worker Tests

### Unit Tests

- Work metadata validation.
- Retry classification.
- Error mapping.
- Model selection rules.
- Capability reporting.
- Temp file cleanup logic.
- Sensitive log redaction.
- Cancellation state handling.

### Integration Tests

- Worker processes synthetic audio work.
- Fake worker returns deterministic transcript.
- Fake worker emits configured failure.
- Worker handles unsupported audio.
- Worker handles missing model.
- Worker handles retry for selected handoff mechanism.
- Worker handles cancellation if supported.
- Worker cleans temporary files after success/failure/cancellation.
- Worker writes or returns completed result.
- Worker writes or returns failed result.
- Worker health/readiness reports unavailable dependency.
- Worker logs do not contain audio/transcript/token markers.

### Performance Tests

- Measure transcription latency for reference audio.
- Measure handoff-to-result latency for the selected lifecycle.
- Measure concurrent work behavior.
- Measure model load time.
- Measure GPU memory behavior if available.
- Measure fake worker E2E speed for development feedback loop.

## Acceptance Checklist

This spec is satisfied when:

- Worker responsibilities are explicit.
- Work handoff options are defined without forcing a queue product.
- Worker lifecycle is defined for asynchronous and synchronous work.
- Model handling is defined.
- Audio validation is defined.
- GPU/CPU/fake expectations are defined.
- Health, capacity, and version reporting are defined.
- Retry, cancellation, and failure behavior are defined.
- Sensitive data logging constraints are explicit.
- Fake deterministic worker requirements are defined.
- Tests can prove worker behavior without human speech input or GPU dependency.
- Open decisions are listed instead of hidden.
