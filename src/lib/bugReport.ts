import * as Sentry from "@sentry/react";
import { getVersion } from "@tauri-apps/api/app";
import { type as osType } from "@tauri-apps/plugin-os";
import { useSettingsStore } from "@/stores/settingsStore";

export async function sendBugReport(
  description?: string,
  error?: Error,
): Promise<void> {
  const version = await getVersion().catch(() => "unknown");
  const os = osType();
  const settings = useSettingsStore.getState().settings;

  Sentry.withScope((scope) => {
    scope.setTag("app.version", version);
    scope.setTag("os.type", os);
    scope.setContext("app_settings", {
      selected_model: settings?.selected_model ?? null,
      whisper_accelerator: settings?.whisper_accelerator ?? null,
      ort_accelerator: settings?.ort_accelerator ?? null,
      log_level: settings?.log_level ?? null,
      debug_mode: settings?.debug_mode ?? false,
      selected_language: settings?.selected_language ?? null,
      translate_to_english: settings?.translate_to_english ?? false,
      post_process_enabled: settings?.post_process_enabled ?? false,
    });

    if (description) {
      scope.setExtra("user_description", description);
    }

    if (error) {
      Sentry.captureException(error);
    } else {
      Sentry.captureMessage(description?.trim() || "(no description)", "info");
    }
  });
}
