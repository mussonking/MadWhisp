use crate::TranscriptionCoordinator;
#[cfg(unix)]
use log::debug;
use log::warn;
use tauri::{AppHandle, Manager};

#[cfg(unix)]
use signal_hook::consts::{SIGUSR1, SIGUSR2};
#[cfg(unix)]
use signal_hook::iterator::Signals;
#[cfg(unix)]
use std::thread;

#[cfg(unix)]
const SOCKET_PATH: &str = "/tmp/madwhisp.sock";

/// Send a transcription input to the coordinator.
/// Used by signal handlers, CLI flags, and any other external trigger.
pub fn send_transcription_input(app: &AppHandle, binding_id: &str, source: &str) {
    if let Some(c) = app.try_state::<TranscriptionCoordinator>() {
        c.send_input(binding_id, source, true, false);
    } else {
        warn!("TranscriptionCoordinator not initialized");
    }
}

#[cfg(unix)]
pub fn setup_signal_handler(app_handle: AppHandle, mut signals: Signals) {
    debug!("Signal handlers registered (SIGUSR1, SIGUSR2)");
    thread::spawn(move || {
        for sig in signals.forever() {
            let (binding_id, signal_name) = match sig {
                SIGUSR1 => ("transcribe_with_post_process", "SIGUSR1"),
                SIGUSR2 => ("transcribe", "SIGUSR2"),
                _ => continue,
            };
            debug!("Received {signal_name}");
            send_transcription_input(&app_handle, binding_id, signal_name);
        }
    });
}

#[cfg(unix)]
pub fn setup_socket_listener(app_handle: AppHandle) {
    use std::io::{BufRead, BufReader};
    use std::os::unix::net::UnixListener;

    // Remove stale socket if it exists
    let _ = std::fs::remove_file(SOCKET_PATH);

    let listener = match UnixListener::bind(SOCKET_PATH) {
        Ok(l) => l,
        Err(e) => {
            log::error!("Failed to bind socket {}: {}", SOCKET_PATH, e);
            return;
        }
    };

    log::info!("Socket listener started on {}", SOCKET_PATH);

    thread::spawn(move || {
        for stream in listener.incoming() {
            match stream {
                Ok(stream) => {
                    let reader = BufReader::new(stream);
                    for line in reader.lines() {
                        match line {
                            Ok(cmd) => {
                                let cmd = cmd.trim().to_string();
                                if cmd.is_empty() {
                                    continue;
                                }
                                log::info!("Socket received command: {}", cmd);
                                match cmd.as_str() {
                                    "transcribe" => {
                                        send_transcription_input(
                                            &app_handle,
                                            "transcribe",
                                            "socket",
                                        );
                                    }
                                    "transcribe_with_post_process" => {
                                        send_transcription_input(
                                            &app_handle,
                                            "transcribe_with_post_process",
                                            "socket",
                                        );
                                    }
                                    "cancel" => {
                                        crate::utils::cancel_current_operation(&app_handle);
                                    }
                                    _ => {
                                        debug!("Unknown socket command: {}", cmd);
                                    }
                                }
                            }
                            Err(e) => {
                                debug!("Socket read error: {}", e);
                                break;
                            }
                        }
                    }
                }
                Err(e) => {
                    debug!("Socket accept error: {}", e);
                }
            }
        }
    });
}

/// Clean up the socket file on shutdown
#[cfg(unix)]
pub fn cleanup_socket() {
    let _ = std::fs::remove_file(SOCKET_PATH);
}
