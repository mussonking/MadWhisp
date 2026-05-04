use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use transcribe_rs::{
    get_whisper_accelerator, get_whisper_gpu_device, whisper_cpp::WhisperInferenceParams,
    TranscribeError, TranscriptionResult, TranscriptionSegment,
};
use whisper_rs::{
    FullParams, SamplingStrategy, WhisperContext, WhisperContextParameters, WhisperState,
};

pub struct CancellableWhisperEngine {
    state: WhisperState,
    #[allow(dead_code)]
    context: WhisperContext,
}

impl CancellableWhisperEngine {
    pub fn load(model_path: &Path) -> Result<Self, TranscribeError> {
        if !model_path.exists() {
            return Err(TranscribeError::ModelNotFound(model_path.to_path_buf()));
        }

        let mut context_params = WhisperContextParameters {
            use_gpu: get_whisper_accelerator().use_gpu(),
            flash_attn: true,
            ..Default::default()
        };

        let gpu_device = get_whisper_gpu_device();
        if gpu_device >= 0 {
            context_params.gpu_device = gpu_device;
        }

        let context = WhisperContext::new_with_params(model_path, context_params)
            .map_err(|e| TranscribeError::Inference(e.to_string()))?;
        let state = context
            .create_state()
            .map_err(|e| TranscribeError::Inference(e.to_string()))?;

        Ok(Self { state, context })
    }

    pub fn transcribe_with(
        &mut self,
        samples: &[f32],
        params: &WhisperInferenceParams,
        cancel_requested: Arc<AtomicBool>,
    ) -> Result<TranscriptionResult, TranscribeError> {
        let mut full_params = FullParams::new(sampling_strategy());
        full_params.set_language(params.language.as_deref());
        full_params.set_translate(params.translate);
        full_params.set_print_special(params.print_special);
        full_params.set_print_progress(params.print_progress);
        full_params.set_print_realtime(params.print_realtime);
        full_params.set_print_timestamps(params.print_timestamps);
        full_params.set_suppress_blank(params.suppress_blank);
        full_params.set_suppress_nst(params.suppress_non_speech_tokens);
        full_params.set_no_speech_thold(params.no_speech_thold);
        let abort_cb: Box<dyn FnMut() -> bool> =
            Box::new(move || cancel_requested.load(Ordering::Relaxed));
        full_params
            .set_abort_callback_safe::<Option<Box<dyn FnMut() -> bool>>, Box<dyn FnMut() -> bool>>(
                Some(abort_cb),
            );

        if params.n_threads > 0 {
            full_params.set_n_threads(params.n_threads);
        }

        if let Some(ref prompt) = params.initial_prompt {
            full_params.set_initial_prompt(prompt);
        }

        self.state
            .full(full_params, samples)
            .map_err(|e| TranscribeError::Inference(e.to_string()))?;

        let num_segments = self.state.full_n_segments();
        let mut segments = Vec::new();
        let mut full_text = String::new();

        for i in 0..num_segments {
            let segment = self
                .state
                .get_segment(i)
                .ok_or_else(|| TranscribeError::Inference(format!("segment {i} out of bounds")))?;
            let text = segment
                .to_str()
                .map_err(|e| TranscribeError::Inference(e.to_string()))?;

            segments.push(TranscriptionSegment {
                start: segment.start_timestamp() as f32 / 100.0,
                end: segment.end_timestamp() as f32 / 100.0,
                text: text.to_string(),
            });
            full_text.push_str(text);
        }

        Ok(TranscriptionResult {
            text: full_text.trim().to_string(),
            segments: Some(segments),
        })
    }
}

fn sampling_strategy() -> SamplingStrategy {
    if cfg!(target_os = "windows") {
        SamplingStrategy::Greedy { best_of: 1 }
    } else {
        SamplingStrategy::BeamSearch {
            beam_size: 3,
            patience: -1.0,
        }
    }
}
