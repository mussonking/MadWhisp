#[cfg(target_os = "windows")]
use std::path::Path;

#[cfg(target_os = "windows")]
use tauri::Manager;

#[cfg(target_os = "windows")]
pub fn configure(app: &tauri::AppHandle) {
    let dll_path = match app.path().resolve(
        format!("{}/onnxruntime.dll", resource_dir()),
        tauri::path::BaseDirectory::Resource,
    ) {
        Ok(path) => path,
        Err(err) => {
            log::warn!("Could not resolve bundled ONNX Runtime DLL: {err}");
            return;
        }
    };

    if !dll_path.exists() {
        log::warn!(
            "Bundled ONNX Runtime DLL is missing at {}. ONNX models may fail to load.",
            dll_path.display()
        );
        return;
    }

    std::env::set_var("ORT_DYLIB_PATH", &dll_path);
    if let Some(dir) = dll_path.parent() {
        prepend_path(dir);
    }

    log::info!("Using bundled ONNX Runtime DLL: {}", dll_path.display());
}

#[cfg(not(target_os = "windows"))]
pub fn configure(_app: &tauri::AppHandle) {}

#[cfg(target_os = "windows")]
fn resource_dir() -> &'static str {
    #[cfg(target_arch = "aarch64")]
    {
        "resources/onnxruntime/windows-arm64"
    }

    #[cfg(not(target_arch = "aarch64"))]
    {
        "resources/onnxruntime/windows-x64"
    }
}

#[cfg(target_os = "windows")]
fn prepend_path(dir: &Path) {
    let Some(existing_path) = std::env::var_os("PATH") else {
        std::env::set_var("PATH", dir);
        return;
    };

    let mut paths = Vec::with_capacity(1);
    paths.push(dir.to_path_buf());
    paths.extend(std::env::split_paths(&existing_path));

    match std::env::join_paths(paths) {
        Ok(path) => std::env::set_var("PATH", path),
        Err(err) => log::warn!("Could not add ONNX Runtime directory to PATH: {err}"),
    }
}
