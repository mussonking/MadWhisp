import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { getVersion } from "@tauri-apps/api/app";
import { type as osType } from "@tauri-apps/plugin-os";
import { toast } from "sonner";
import { Sentry } from "@/lib/sentry";
import { useSettingsStore } from "@/stores/settingsStore";
import { SettingContainer } from "../../ui/SettingContainer";
import { Button } from "../../ui/Button";

interface BugReportButtonProps {
  grouped?: boolean;
}

export const BugReportButton: React.FC<BugReportButtonProps> = ({
  grouped = false,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const settings = useSettingsStore((s) => s.settings);

  const handleSend = async () => {
    setSending(true);
    try {
      const version = await getVersion().catch(() => "unknown");
      const os = osType();

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
        Sentry.captureMessage(description.trim() || "(no description)", "info");
      });

      toast.success(t("settings.about.bugReport.success"));
      setOpen(false);
      setDescription("");
    } catch {
      toast.error(t("settings.about.bugReport.error"));
    } finally {
      setSending(false);
    }
  };

  return (
    <SettingContainer
      title={t("settings.about.bugReport.title")}
      description={t("settings.about.bugReport.description")}
      grouped={grouped}
      layout="stacked"
    >
      {!open ? (
        <Button variant="secondary" size="md" onClick={() => setOpen(true)}>
          {t("settings.about.bugReport.button")}
        </Button>
      ) : (
        <div className="space-y-3">
          <textarea
            className="w-full rounded-lg border border-mid-gray/20 bg-mid-gray/10 px-3 py-2 text-sm text-text placeholder:text-text/40 focus:outline-none focus:ring-1 focus:ring-background-ui resize-none"
            rows={4}
            placeholder={t("settings.about.bugReport.placeholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={sending}
          />
          <p className="text-xs text-text/50">
            {t("settings.about.bugReport.disclosure")}
          </p>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="md"
              onClick={handleSend}
              disabled={sending}
            >
              {sending
                ? t("settings.about.bugReport.sending")
                : t("settings.about.bugReport.send")}
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                setOpen(false);
                setDescription("");
              }}
              disabled={sending}
            >
              {t("settings.about.bugReport.cancel")}
            </Button>
          </div>
        </div>
      )}
    </SettingContainer>
  );
};
