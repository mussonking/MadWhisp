pub fn whisper_inference_threads() -> i32 {
    if cfg!(target_os = "windows") {
        std::thread::available_parallelism()
            .map(|threads| threads.get().min(8) as i32)
            .unwrap_or(4)
    } else {
        0
    }
}
