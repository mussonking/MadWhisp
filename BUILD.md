# Build Instructions

This guide covers local development and release builds for MadWhisp.

## Prerequisites

All platforms:

- Rust stable from https://rustup.rs/
- Bun from https://bun.sh/
- Tauri system prerequisites from https://tauri.app/start/prerequisites/

Windows:

- Visual Studio 2019/2022 Build Tools with the C++ desktop workload
- Vulkan-capable GPU driver for the Whisper Vulkan backend
- Network access during the first build so the Windows script can download
  ONNX Runtime and DirectML runtime DLLs from NuGet

Linux:

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install build-essential libasound2-dev pkg-config libssl-dev libvulkan-dev vulkan-tools glslc libgtk-3-dev libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev libgtk-layer-shell0 libgtk-layer-shell-dev patchelf cmake

# Fedora/RHEL
sudo dnf groupinstall "Development Tools"
sudo dnf install alsa-lib-devel pkgconf openssl-devel vulkan-devel gtk3-devel webkit2gtk4.1-devel libappindicator-gtk3-devel librsvg2-devel gtk-layer-shell gtk-layer-shell-devel cmake

# Arch Linux
sudo pacman -S base-devel alsa-lib pkgconf openssl vulkan-devel gtk3 webkit2gtk-4.1 libappindicator-gtk3 librsvg gtk-layer-shell cmake
```

macOS:

```bash
xcode-select --install
```

## Setup

```bash
git clone https://github.com/mussonking/MadWhisp.git
cd MadWhisp
bun install
```

## Development

```bash
bun run tauri dev
```

## Production Builds

Linux/macOS:

```bash
bun run tauri build
```

Windows:

```powershell
bun run check:windows
bun run build:windows
```

The Windows script enters the Visual Studio C++ environment and uses
`C:\mwtarget` as `CARGO_TARGET_DIR`. That short target path avoids MSBuild path
length failures while building the Vulkan Whisper dependency. It also prepares
the ignored `src-tauri\resources\onnxruntime\windows-x64` directory with the
runtime DLLs needed by ONNX models such as Canary, Parakeet, Moonshine,
SenseVoice, and GigaAM.

After a successful release build it syncs `madwhisp.exe`, runtime resources,
the MSI, and the NSIS installer back to `src-tauri\target\release`.

For Windows ARM64 packaging, prepare ARM64 runtime resources first:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-onnxruntime-windows.ps1 -Arch arm64
```

## Nix

MadWhisp exposes the official flake package as `madwhisp`:

```bash
nix build .#madwhisp
```

The old `.#handy` package name remains as a temporary compatibility alias.

## Linux AppImage Note

On rolling-release distros, linuxdeploy can fail while processing newer system
libraries. If AppImage bundling fails but deb/rpm builds are fine, build only the
deb bundle:

```bash
bun run tauri build -- --bundles deb
```
