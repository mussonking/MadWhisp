use crate::tray::TrayIconState;
use tauri::{AppHandle, Manager, Theme};

#[derive(Clone, Debug, PartialEq)]
pub enum TrayTheme {
    Dark,
    Light,
    Colored,
}

pub fn uses_system_tray() -> bool {
    !cfg!(target_os = "linux")
}

pub fn current_theme(app: &AppHandle) -> TrayTheme {
    if cfg!(target_os = "linux") {
        return TrayTheme::Colored;
    }

    if let Some(main_window) = app.get_webview_window("main") {
        match main_window.theme().unwrap_or(Theme::Dark) {
            Theme::Light => TrayTheme::Light,
            Theme::Dark => TrayTheme::Dark,
            _ => TrayTheme::Dark,
        }
    } else {
        TrayTheme::Dark
    }
}

pub fn icon_path(theme: TrayTheme, state: &TrayIconState) -> &'static str {
    match (theme, state) {
        (TrayTheme::Dark, TrayIconState::Idle) => "resources/tray_idle.png",
        (TrayTheme::Dark, TrayIconState::Recording) => "resources/tray_recording.png",
        (TrayTheme::Dark, TrayIconState::Transcribing) => "resources/tray_transcribing.png",
        (TrayTheme::Light, TrayIconState::Idle) => "resources/tray_idle_dark.png",
        (TrayTheme::Light, TrayIconState::Recording) => "resources/tray_recording_dark.png",
        (TrayTheme::Light, TrayIconState::Transcribing) => "resources/tray_transcribing_dark.png",
        (TrayTheme::Colored, TrayIconState::Idle) => "resources/motsdits.png",
        (TrayTheme::Colored, TrayIconState::Recording) => "resources/recording.png",
        (TrayTheme::Colored, TrayIconState::Transcribing) => "resources/transcribing.png",
    }
}

pub fn initial_icon_path(app: &AppHandle) -> &'static str {
    icon_path(current_theme(app), &TrayIconState::Idle)
}

pub fn menu_accelerators() -> (Option<&'static str>, Option<&'static str>) {
    if cfg!(target_os = "macos") {
        (Some("Cmd+,"), Some("Cmd+Q"))
    } else {
        (Some("Ctrl+,"), Some("Ctrl+Q"))
    }
}
