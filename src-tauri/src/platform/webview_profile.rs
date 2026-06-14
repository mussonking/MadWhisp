use std::path::PathBuf;

#[cfg(target_os = "windows")]
use chrono::Local;
#[cfg(target_os = "windows")]
use std::fs;
#[cfg(target_os = "windows")]
use std::time::Duration;
#[cfg(target_os = "windows")]
use tauri::Manager;

#[cfg(target_os = "windows")]
pub fn data_dir(app: &tauri::AppHandle) -> Option<PathBuf> {
    if let Some(data_dir) = crate::portable::data_dir() {
        return Some(data_dir.join("webview"));
    }

    app.path()
        .app_local_data_dir()
        .ok()
        .map(|dir| dir.join("EBWebView"))
}

#[cfg(not(target_os = "windows"))]
pub fn data_dir(_app: &tauri::AppHandle) -> Option<PathBuf> {
    crate::portable::data_dir().map(|dir| dir.join("webview"))
}

#[cfg(target_os = "windows")]
pub fn error_suggests_profile_corruption(error: &tauri::Error) -> bool {
    let message = error.to_string().to_lowercase();
    message.contains("0x8007139f")
        || message.contains("hresult(0x8007139f)")
        || message.contains("the group or resource is not in the correct state")
}

#[cfg(target_os = "windows")]
pub fn pending_recovery_reason(app: &tauri::AppHandle) -> Option<String> {
    let path = recovery_marker_path(app)?;
    fs::read_to_string(path).ok()
}

#[cfg(target_os = "windows")]
pub fn recovery_allowed(app: &tauri::AppHandle) -> bool {
    let Some(path) = recovery_marker_path(app) else {
        return true;
    };

    let Ok(metadata) = fs::metadata(&path) else {
        return true;
    };
    let Ok(modified) = metadata.modified() else {
        return true;
    };
    let Ok(elapsed) = modified.elapsed() else {
        return true;
    };

    elapsed > Duration::from_secs(600)
}

#[cfg(target_os = "windows")]
pub fn mark_recovery_attempt(app: &tauri::AppHandle, reason: &str) {
    let Some(path) = recovery_marker_path(app) else {
        return;
    };
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let _ = fs::write(path, reason);
}

#[cfg(target_os = "windows")]
pub fn clear_recovery_attempt(app: &tauri::AppHandle) {
    let Some(path) = recovery_marker_path(app) else {
        return;
    };
    let _ = fs::remove_file(path);
}

#[cfg(target_os = "windows")]
fn recovery_marker_path(app: &tauri::AppHandle) -> Option<PathBuf> {
    app.path()
        .app_local_data_dir()
        .ok()
        .map(|dir| dir.join("webview-recovery.marker"))
}

#[cfg(target_os = "windows")]
pub fn quarantine(app: &tauri::AppHandle, reason: &str) -> Result<Option<PathBuf>, String> {
    let Some(path) = data_dir(app) else {
        return Ok(None);
    };

    if !path.exists() {
        return Ok(None);
    }

    let timestamp = Local::now().format("%Y%m%d-%H%M%S");
    let file_name = path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("webview");
    let backup = path.with_file_name(format!("{file_name}.backup-{reason}-{timestamp}"));

    fs::rename(&path, &backup).map_err(|e| {
        format!(
            "failed to quarantine WebView profile {}: {e}",
            path.display()
        )
    })?;

    prune_old_backups(app);

    Ok(Some(backup))
}

#[cfg(target_os = "windows")]
fn prune_old_backups(app: &tauri::AppHandle) {
    let Some(path) = data_dir(app) else {
        return;
    };
    let Some(parent) = path.parent() else {
        return;
    };
    let Some(prefix) = path.file_name().and_then(|name| name.to_str()) else {
        return;
    };

    let mut backups = match fs::read_dir(parent) {
        Ok(entries) => entries
            .flatten()
            .filter_map(|entry| {
                let name = entry.file_name();
                let name = name.to_string_lossy();
                if name.starts_with(&format!("{prefix}.backup-")) {
                    let modified = entry.metadata().and_then(|meta| meta.modified()).ok()?;
                    Some((modified, entry.path()))
                } else {
                    None
                }
            })
            .collect::<Vec<_>>(),
        Err(_) => return,
    };

    backups.sort_by_key(|(modified, _)| *modified);
    let remove_count = backups.len().saturating_sub(3);

    for (_, path) in backups.into_iter().take(remove_count) {
        let result = if path.is_dir() {
            fs::remove_dir_all(&path)
        } else {
            fs::remove_file(&path)
        };

        if let Err(e) = result {
            log::warn!(
                "Failed to remove old WebView profile backup {}: {}",
                path.display(),
                e
            );
        }
    }
}
