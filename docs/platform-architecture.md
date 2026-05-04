# Platform Architecture

MadWhisp should stay one project, but not one identical implementation for every
operating system. The shared app core should remain portable; OS behavior should
live behind explicit platform boundaries.

## Shared Core

Keep these modules platform-neutral whenever possible:

- transcription model loading and inference
- custom words, aliases, blacklist, and text correction
- settings schema and migrations
- history and recordings metadata
- post-processing providers and prompts
- model catalog and downloads

Changes in this layer should compile and behave the same on Linux, Windows, and
macOS unless a platform adapter explicitly opts out.

## Platform Layer

Put OS-specific behavior in `src-tauri/src/platform/`.

Current entry points:

- `platform::app`: startup window creation, frontendless Linux input/shortcut
  initialization, native Linux UI launch, and main-window lifecycle policy.
- `platform::audio`: output mute behavior, microphone-device open policy,
  recording VAD policy, Windows audio-device fallbacks, and Windows microphone
  permission checks.
- `platform::clipboard`: clipboard write/restore behavior, default paste method,
  and Wayland `wl-copy` handling.
- `platform::overlay`: overlay window topmost/hide behavior and native windowing
  quirks.
- `platform::onnx_runtime`: Windows ONNX Runtime DLL resolution for ONNX-based
  transcription models.
- `platform::shortcuts`: default backend/shortcut policy, dynamic cancel
  shortcut support, and available typing-tool policy.
- `platform::tray`: system tray availability, theme/icon path policy, and
  platform-specific menu accelerators.

## Rule Of Thumb

If a change mentions one OS, a windowing system, a keyboard backend, a clipboard
tool, a microphone API, or tray behavior, it belongs in the platform layer first.

If a change mentions transcription quality, model selection, custom words,
history, settings, or post-processing, it belongs in the shared core first.

## Feature Checklist

When adding or fixing a feature:

1. Decide whether it is core or platform behavior.
2. Keep `#[cfg(...)]` at module boundaries or inside platform adapters.
3. Add shared tests for core behavior.
4. Add platform-specific logging around OS adapters.
5. Run at least `cargo check` for the current OS and `bun run build`.
6. Before release, build each target independently.

## Windows Build

Windows uses the same general app core, but the transcription backend should
keep the GPU path through `transcribe-rs` with `ort-directml` and
`whisper-vulkan`. That avoids the CPU-only fallback that can leave the app
appearing stuck on `Transcribing...`.

From Windows, prefer:

```powershell
bun run check:windows
bun run build:windows
```

The script uses Visual Studio Build Tools and `C:\mwtarget` as
`CARGO_TARGET_DIR`. The short target path avoids CMake/MSBuild path-length
failures while building the Vulkan whisper dependency. It also downloads ignored
ONNX Runtime and DirectML DLLs from NuGet and places them under
`src-tauri\resources\onnxruntime\windows-x64`, so ONNX models do not fall back to
stale system DLLs. After a release build, it syncs `madwhisp.exe`, runtime
resources, and the MSI/NSIS bundles back into `src-tauri\target\release` for
normal local testing.

## Migration Plan

Do this incrementally. Avoid large rewrites.

1. Move Windows/Linux audio quirks into `platform::audio`.
2. Move overlay WebView/native window quirks into `platform::overlay`.
3. Move clipboard and paste tools into `platform::clipboard`.
4. Continue moving shortcut backend selection into `platform::shortcuts`.
5. Keep Linux native UI as the reference Linux experience.
6. Keep Windows React/Tauri UI as the Windows port until a native Windows UI is
   intentionally designed.
