# Release Checklist

Use this before publishing a GitHub release.

## Version

- Update `package.json`.
- Update `src-tauri/Cargo.toml`.
- Update `src-tauri/tauri.conf.json`.
- Run `bun run check:windows` or `cargo check` so `Cargo.lock` records the app
  version.

## Local Checks

```bash
bun run build
```

```powershell
bun run check:windows
```

This also downloads ignored Windows ONNX Runtime resources into
`src-tauri\resources\onnxruntime\windows-x64`.

For text correction changes:

```bash
cd src-tauri
cargo test audio_toolkit::text::tests --lib
```

## Windows Build

```powershell
bun run build:windows
```

Expected artifacts:

- `src-tauri\target\release\motsdits.exe`
- `src-tauri\target\release\resources\onnxruntime\windows-x64\onnxruntime.dll`
- `src-tauri\target\release\bundle\msi\MotsDits_<version>_x64_en-US.msi`
- `src-tauri\target\release\bundle\nsis\MotsDits_<version>_x64-setup.exe`

## GitHub Release

- Confirm release workflows use the `motsdits` asset prefix.
- Confirm Windows release workflows run `scripts/setup-onnxruntime-windows.ps1`
  before `tauri-action`.
- Confirm signing secrets exist before enabling signed release builds.
- Keep update checks disabled by default until `latest.json` updater artifacts
  are signed and published intentionally.

## Manual Smoke Test

- Launch the app.
- Start and stop recording.
- Confirm the overlay returns to idle.
- Confirm CPU drops after transcription.
- Confirm the About/Footer version matches the release version.
- Test at least one custom word alias.
- Test one Whisper model and one ONNX model such as Canary.
