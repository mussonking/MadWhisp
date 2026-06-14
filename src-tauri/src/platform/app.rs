use crate::commands;
#[cfg(target_os = "windows")]
use crate::managers::model::ModelManager;
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

    #[cfg(all(not(target_os = "linux"), not(target_os = "windows")))]
    {
        let mut win_builder =
            tauri::WebviewWindowBuilder::new(app, "main", tauri::WebviewUrl::App("/".into()))
                .title("MotsDits")
                .inner_size(1100.0, 760.0)
                .min_inner_size(960.0, 640.0)
                .resizable(true)
                .maximizable(true)
                .visible(false);

        if let Some(data_dir) = crate::platform::webview_profile::data_dir(app.handle()) {
            win_builder = win_builder.data_directory(data_dir);
        }

        win_builder.build()?;
    }

    #[cfg(target_os = "windows")]
    {
        build_windows_main_window(app)?;
    }

    Ok(())
}

#[cfg(target_os = "windows")]
fn build_windows_main_window(app: &mut tauri::App) -> tauri::Result<()> {
    let build = |app: &mut tauri::App| {
        let mut win_builder =
            tauri::WebviewWindowBuilder::new(app, "main", tauri::WebviewUrl::App("/".into()))
                .title("MotsDits")
                .inner_size(1100.0, 760.0)
                .min_inner_size(960.0, 640.0)
                .resizable(true)
                .maximizable(true)
                .visible(false);

        if let Some(data_dir) = crate::platform::webview_profile::data_dir(app.handle()) {
            log::info!("Using WebView2 profile at {}", data_dir.display());
            win_builder = win_builder.data_directory(data_dir);
        }

        win_builder.build()
    };

    if let Some(reason) = crate::platform::webview_profile::pending_recovery_reason(app.handle()) {
        log::warn!(
            "Recovering WebView2 profile from previous startup: {}",
            reason
        );
        match crate::platform::webview_profile::quarantine(app.handle(), "pending") {
            Ok(Some(path)) => log::warn!("Quarantined WebView2 profile at {}", path.display()),
            Ok(None) => log::warn!("No WebView2 profile found to quarantine for pending recovery"),
            Err(e) => log::warn!("{}", e),
        }
    }

    match build(app) {
        Ok(_) => Ok(()),
        Err(error)
            if crate::platform::webview_profile::error_suggests_profile_corruption(&error) =>
        {
            log::warn!(
                "WebView2 profile error while creating main window: {}",
                error
            );
            match crate::platform::webview_profile::quarantine(app.handle(), "startup") {
                Ok(Some(path)) => log::warn!(
                    "Quarantined WebView2 profile at {}; retrying main window creation",
                    path.display()
                ),
                Ok(None) => log::warn!(
                    "No WebView2 profile found to quarantine; retrying main window creation"
                ),
                Err(e) => log::warn!("{}", e),
            }
            build(app).map(|_| ())
        }
        Err(error) => Err(error),
    }
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

#[cfg(target_os = "windows")]
pub fn start_frontend_ready_watchdog(app: AppHandle) {
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_secs(12));

        let Some(state) = app.try_state::<crate::FrontendReadyState>() else {
            return;
        };
        if state.is_ready() {
            crate::platform::webview_profile::clear_recovery_attempt(&app);
            return;
        }

        if !crate::platform::webview_profile::recovery_allowed(&app) {
            log::error!("Frontend did not mark ready, but WebView2 recovery already ran recently");
            return;
        }

        log::warn!("Frontend did not mark ready; scheduling WebView2 profile recovery");
        crate::platform::webview_profile::mark_recovery_attempt(&app, "blank startup");

        match std::env::current_exe() {
            Ok(exe) => {
                if let Err(e) = std::process::Command::new(exe).spawn() {
                    log::error!("Failed to relaunch MotsDits after WebView2 recovery: {}", e);
                    return;
                }
                std::process::exit(0);
            }
            Err(e) => log::error!(
                "Failed to locate MotsDits executable for WebView2 recovery: {}",
                e
            ),
        }
    });
}

#[cfg(not(target_os = "windows"))]
pub fn start_frontend_ready_watchdog(_app: AppHandle) {}

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
