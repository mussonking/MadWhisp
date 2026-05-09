# Contributing to MotsDits

Thanks for helping improve MotsDits.

MotsDits is a fork of Handy, but it is now maintained as its own multi-platform
speech-to-text app. The main engineering rule is simple: keep shared behavior in
the core, and put OS-specific behavior behind platform adapters.

## Before You Start

1. Search existing issues and pull requests.
2. Keep changes focused.
3. Mention which platforms you tested.
4. Avoid changing Windows and Linux behavior from the same low-level code path
   unless the change is intentionally shared.

## Local Setup

```bash
git clone https://github.com/mussonking/MotsDits.git
cd MotsDits
bun install
```

For platform-specific dependencies, see [BUILD.md](BUILD.md).

## Architecture

Shared core:

- transcription model loading and inference
- custom words, aliases, blacklist, and text correction
- settings schema and migrations
- history and recordings metadata
- post-processing providers and prompts
- model catalog and downloads

Platform adapters live in `src-tauri/src/platform/`:

- `audio`
- `clipboard`
- `overlay`
- `shortcuts`
- `tray`
- `app`
- `transcription`

When a change mentions Wayland, X11, Windows audio, hotkeys, tray behavior,
clipboard handling, windowing, or overlay quirks, start in the platform layer.

## Checks

Run the smallest useful check first:

```bash
bun run build
cd src-tauri && cargo check
```

On Windows:

```powershell
bun run check:windows
```

For custom words/text correction changes:

```bash
cd src-tauri
cargo test audio_toolkit::text::tests --lib
```

## Pull Requests

Use the PR template. Include:

- what changed
- why it changed
- platforms tested
- any known limitations

## Attribution

MotsDits is forked from Handy by cjpais and remains MIT licensed. Keep upstream
license and attribution intact when moving or adapting upstream code.
