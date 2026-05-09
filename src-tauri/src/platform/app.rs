use crate::commands;
#[cfg(target_os = "windows")]
use crate::managers::model::ModelManager;
#[cfg(not(target_os = "linux"))]
use crate::portable;
#[cfg(target_os = "macos")]
use crate::settings;
#[cfg(target_os = "windows")]
use std::sync::Arc;
use tauri::{AppHandle, Manager};

pub fn initialize_frontendless_input(app: &AppHandle) {
    #[cfg(target_os = "linux")]
    {
        if let Err(e) = commands::initialize_enigo(app.clone()) {
            log::error!("Failed to initialize Enigo on Linux: {}", e);
        }
    }

    #[cfg(not(target_os = "linux"))]
    {
        let _ = app;
    }
}

pub fn initialize_frontendless_shortcuts(app: &AppHandle) {
    #[cfg(target_os = "linux")]
    {
        if let Err(e) = commands::initialize_shortcuts(app.clone()) {
            log::error!("Failed to initialize shortcuts on Linux: {}", e);
        }
    }

    #[cfg(not(target_os = "linux"))]
    {
        let _ = app;
    }
}

pub fn create_main_window(app: &mut tauri::App) -> tauri::Result<()> {
    #[cfg(target_os = "linux")]
    {
        tauri::WebviewWindowBuilder::new(app, "main", tauri::WebviewUrl::App("about:blank".into()))
            .title("")
            .inner_size(1.0, 1.0)
            .visible(false)
            .skip_taskbar(true)
            .build()?;
    }

    #[cfg(not(target_os = "linux"))]
    {
        let mut win_builder =
            tauri::WebviewWindowBuilder::new(app, "main", tauri::WebviewUrl::App("/".into()))
                .title("MotsDits")
                .inner_size(680.0, 570.0)
                .min_inner_size(680.0, 570.0)
                .resizable(true)
                .maximizable(false)
                .visible(false);

        if let Some(data_dir) = portable::data_dir() {
            win_builder = win_builder.data_directory(data_dir.join("webview"));
        }

        win_builder.build()?;
    }

    Ok(())
}

pub fn apply_start_hidden_activation_policy(app: &AppHandle) {
    #[cfg(target_os = "macos")]
    {
        let settings = settings::get_settings(app);
        if settings.start_hidden && settings.show_tray_icon {
            let _ = app.set_activation_policy(tauri::ActivationPolicy::Accessory);
        }
    }

    #[cfg(not(target_os = "macos"))]
    {
        let _ = app;
    }
}

pub fn show_main_window(app: &AppHandle) {
    if let Some(main_window) = app.get_webview_window("main") {
        if let Err(e) = main_window.unminimize() {
            log::error!("Failed to unminimize webview window: {}", e);
        }
        if let Err(e) = main_window.show() {
            log::error!("Failed to show webview window: {}", e);
        }
        if let Err(e) = main_window.set_focus() {
            log::error!("Failed to focus webview window: {}", e);
        }
        #[cfg(target_os = "macos")]
        {
            if let Err(e) = app.set_activation_policy(tauri::ActivationPolicy::Regular) {
                log::error!("Failed to set activation policy to Regular: {}", e);
            }
        }
        return;
    }

    let webview_labels = app.webview_windows().keys().cloned().collect::<Vec<_>>();
    log::error!(
        "Main window not found. Webview labels: {:?}",
        webview_labels
    );
}

pub fn should_force_show_permissions_window(app: &AppHandle) -> bool {
    #[cfg(target_os = "windows")]
    {
        let model_manager = app.state::<Arc<ModelManager>>();
        let has_downloaded_models = model_manager
            .get_available_models()
            .iter()
            .any(|model| model.is_downloaded);

        if !has_downloaded_models {
            return false;
        }

        let status = commands::audio::get_windows_microphone_permission_status();
        if status.supported && status.overall_access == commands::audio::PermissionAccess::Denied {
            log::info!(
                "Windows microphone permissions are denied; forcing main window visible for onboarding"
            );
            return true;
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = app;
    }

    false
}

pub fn uses_native_settings_ui() -> bool {
    cfg!(target_os = "linux")
}

pub fn start_native_settings_ui(app: &AppHandle) {
    #[cfg(target_os = "linux")]
    {
        let overlay_state = std::sync::Arc::new(crate::native_overlay::NativeOverlayState::new());
        app.manage(overlay_state.clone());
        crate::native_overlay::spawn_overlay(overlay_state);

        let handle = app.clone();
        std::thread::spawn(move || {
            if let Err(e) = crate::native_ui::run_settings_window(handle) {
                log::error!("Settings UI error: {}", e);
            }
            std::process::exit(0);
        });
    }

    #[cfg(not(target_os = "linux"))]
    {
        let _ = app;
    }
}

pub fn should_show_initial_webview(
    should_force_show: bool,
    should_hide: bool,
    tray_available: bool,
) -> bool {
    !uses_native_settings_ui() && (should_force_show || !should_hide || !tray_available)
}

pub fn after_main_window_hidden(app: &AppHandle) {
    #[cfg(target_os = "macos")]
    {
        let settings = settings::get_settings(app);
        let tray_visible = settings.show_tray_icon && !app.state::<crate::CliArgs>().no_tray;
        if tray_visible {
            let res = app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            if let Err(e) = res {
                log::error!("Failed to set activation policy: {}", e);
            }
        }
    }

    #[cfg(not(target_os = "macos"))]
    {
        let _ = app;
    }
}

pub fn handle_reopen_event(app: &AppHandle, event: &tauri::RunEvent) {
    #[cfg(target_os = "macos")]
    {
        if let tauri::RunEvent::Reopen { .. } = event {
            show_main_window(app);
        }
    }

    #[cfg(not(target_os = "macos"))]
    {
        let _ = (app, event);
    }
}
