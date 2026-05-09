import React from "react";
import { useTranslation } from "react-i18next";
import { ToggleSwitch } from "../ui/ToggleSwitch";
import { useSettings } from "../../hooks/useSettings";

interface PostProcessingAutoToggleProps {
  descriptionMode?: "inline" | "tooltip";
  grouped?: boolean;
}

export const PostProcessingAutoToggle: React.FC<PostProcessingAutoToggleProps> =
  React.memo(({ descriptionMode = "tooltip", grouped = false }) => {
    const { t } = useTranslation();
    const { getSetting, updateSetting, isUpdating } = useSettings();

    const enabled = getSetting("post_process_auto") || false;
    const postProcessEnabled = getSetting("post_process_enabled") || false;

    return (
      <ToggleSwitch
        checked={enabled}
        onChange={(value) => updateSetting("post_process_auto", value)}
        isUpdating={isUpdating("post_process_auto")}
        disabled={!postProcessEnabled}
        label={t("settings.debug.postProcessingAutoToggle.label", {
          defaultValue: "Auto post-processing",
        })}
        description={t("settings.debug.postProcessingAutoToggle.description", {
          defaultValue:
            "Apply post-processing to every transcription automatically (no separate hotkey needed). Requires post-processing to be enabled.",
        })}
        descriptionMode={descriptionMode}
        grouped={grouped}
      />
    );
  });
