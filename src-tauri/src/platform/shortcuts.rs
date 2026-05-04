use crate::settings::KeyboardImplementation;

pub fn default_keyboard_implementation() -> KeyboardImplementation {
    if cfg!(target_os = "linux") {
        KeyboardImplementation::Tauri
    } else {
        KeyboardImplementation::HandyKeys
    }
}

pub fn default_transcribe_shortcut() -> &'static str {
    if cfg!(target_os = "macos") {
        "option+space"
    } else if cfg!(target_os = "windows") || cfg!(target_os = "linux") {
        "ctrl+space"
    } else {
        "alt+space"
    }
}

pub fn default_post_process_shortcut() -> &'static str {
    if cfg!(target_os = "macos") {
        "option+shift+space"
    } else if cfg!(target_os = "windows") || cfg!(target_os = "linux") {
        "ctrl+shift+space"
    } else {
        "alt+shift+space"
    }
}

pub fn supports_dynamic_cancel_shortcut() -> bool {
    !cfg!(target_os = "linux")
}

pub fn available_typing_tools() -> Vec<String> {
    #[cfg(target_os = "linux")]
    {
        crate::clipboard::get_available_typing_tools()
    }

    #[cfg(not(target_os = "linux"))]
    {
        vec!["auto".to_string()]
    }
}
