import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TriangleAlert } from "lucide-react";
import { useModelStore } from "../../../stores/modelStore";
import { useSettings } from "../../../hooks/useSettings";
import { SettingsGroup } from "../../ui/SettingsGroup";
import { SettingContainer } from "../../ui/SettingContainer";
import { ToggleSwitch } from "../../ui/ToggleSwitch";

interface QualitySliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled: boolean;
  labels: string[];
}

const QualitySlider: React.FC<QualitySliderProps> = ({
  value,
  onChange,
  disabled,
  labels,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const stepCount = labels.length - 1;
  const positionPercent = (value / stepCount) * 100;

  const valueFromClientX = useCallback(
    (clientX: number) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return value;
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const idx = Math.round((x / rect.width) * stepCount);
      return Math.max(0, Math.min(stepCount, idx));
    },
    [stepCount, value],
  );

  const handleTrackPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    const next = valueFromClientX(e.clientX);
    if (next !== value) onChange(next);
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: PointerEvent) => {
      const next = valueFromClientX(e.clientX);
      if (next !== value) onChange(next);
    };
    const handleUp = () => setIsDragging(false);
    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
    document.addEventListener("pointercancel", handleUp);
    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
      document.removeEventListener("pointercancel", handleUp);
    };
  }, [isDragging, valueFromClientX, onChange, value]);

  return (
    <div className={`select-none ${disabled ? "opacity-40" : ""}`}>
      <div
        ref={trackRef}
        className={`relative h-9 touch-none ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
        onPointerDown={handleTrackPointerDown}
      >
        {/* Inactive track */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-mid-gray/30" />

        {/* Active fill -- animated */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-logo-primary/50 transition-[width] duration-300 ease-out"
          style={{ width: `${positionPercent}%` }}
        />

        {/* Step markers (visual) */}
        {labels.map((_, i) => (
          <div
            key={i}
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 transition-colors ${
              i <= value
                ? "bg-logo-primary border-logo-primary"
                : "bg-background border-mid-gray/60"
            }`}
            style={{ left: `${(i / stepCount) * 100}%` }}
          />
        ))}

        {/* Thumb -- animated glide */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-logo-primary border-2 border-background shadow-lg transition-[left] duration-300 ease-out ${
            isDragging ? "scale-110" : "hover:scale-105"
          } ${disabled ? "" : "cursor-grab active:cursor-grabbing"}`}
          style={{
            left: `${positionPercent}%`,
            transitionDuration: isDragging ? "0ms" : "300ms",
          }}
        />
      </div>

      <div className="flex justify-between mt-2 text-xs font-medium">
        {labels.map((label, i) => (
          <button
            key={i}
            type="button"
            onClick={() => !disabled && onChange(i)}
            disabled={disabled}
            className={`flex-1 transition-colors ${
              i === 0
                ? "text-left"
                : i === stepCount
                  ? "text-right"
                  : "text-center"
            } ${
              !disabled && value === i
                ? "text-logo-primary font-semibold"
                : "text-text/50 hover:text-text/70"
            } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

const QC_TIERS = [
  "turbo-fr-quebecois-q4_0",
  "turbo-fr-quebecois-q5_k",
  "turbo-fr-quebecois",
] as const;

const ENGLISH_NATIVE_ID = "parakeet-tdt-0.6b-v2";
const MULTI_LINGUAL_ID = "large";

export const ListeningQuality: React.FC = () => {
  const { t } = useTranslation();
  const {
    currentModel,
    selectModel,
    loading,
    models,
    downloadModel,
    isModelDownloading,
    getDownloadProgress,
  } = useModelStore();
  const { updateSetting } = useSettings();

  const qcIndex = QC_TIERS.indexOf(currentModel as (typeof QC_TIERS)[number]);
  const isQc = qcIndex >= 0;
  const isEnglishNative = currentModel === ENGLISH_NATIVE_ID;
  const isMultiLingual = currentModel === MULTI_LINGUAL_ID;

  const [pendingModel, setPendingModel] = useState<string | null>(null);
  const pendingTranslateRef = useRef(false);

  const sliderValue = isQc ? qcIndex : 1;

  const switchTo = async (
    modelId: string,
    options: { translate?: boolean } = {},
  ) => {
    const info = models.find((m) => m.id === modelId);
    const translate = options.translate ?? false;
    const needsDownload = info && !info.is_downloaded;
    const hasDownloadUrl = info?.url != null && info.url !== "";
    if (needsDownload && hasDownloadUrl) {
      pendingTranslateRef.current = translate;
      setPendingModel(modelId);
      if (!isModelDownloading(modelId)) {
        const ok = await downloadModel(modelId);
        if (!ok) {
          setPendingModel(null);
        }
      }
      return;
    }
    await updateSetting("translate_to_english", translate);
    await selectModel(modelId);
  };

  useEffect(() => {
    if (!pendingModel) return;
    const info = models.find((m) => m.id === pendingModel);
    if (info?.is_downloaded) {
      const translate = pendingTranslateRef.current;
      const id = pendingModel;
      setPendingModel(null);
      void (async () => {
        await updateSetting("translate_to_english", translate);
        await selectModel(id);
      })();
    }
  }, [pendingModel, models, selectModel, updateSetting]);

  const pendingProgress = pendingModel
    ? getDownloadProgress(pendingModel)
    : undefined;
  const pendingModelInfo = pendingModel
    ? models.find((m) => m.id === pendingModel)
    : undefined;

  const handleSliderChange = (idx: number) => {
    void switchTo(QC_TIERS[idx]);
  };

  const handleEnglishToggle = (on: boolean) => {
    if (on) {
      void switchTo(ENGLISH_NATIVE_ID);
    } else {
      void switchTo(QC_TIERS[1]);
    }
  };

  const handleMultiLingualToggle = (on: boolean) => {
    if (on) {
      void switchTo(MULTI_LINGUAL_ID, { translate: true });
    } else {
      void switchTo(QC_TIERS[1]);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl w-full mx-auto">
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-logo-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl w-full mx-auto space-y-6">
      {pendingModel && (
        <div className="p-3 rounded-md border border-logo-primary/30 bg-logo-primary/5 flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-logo-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text">
              {t("settings.listening.autoDownload.title", {
                defaultValue: "Telechargement du modele en cours...",
              })}
            </p>
            <p className="text-xs text-text/60 truncate">
              {pendingModelInfo?.name ?? pendingModel}
              {pendingProgress && pendingProgress.total > 0
                ? " - " + Math.round(pendingProgress.percentage) + "%"
                : ""}
            </p>
          </div>
        </div>
      )}
      <SettingsGroup
        title={t("settings.listening.qualityGroup", {
          defaultValue: "Qualité d'écoute",
        })}
      >
        <SettingContainer
          title={t("settings.listening.qualityTier.title", {
            defaultValue: "Vitesse vs précision",
          })}
          description={t("settings.listening.qualityTier.description", {
            defaultValue:
              "Glisse vers la droite pour plus de précision, vers la gauche pour plus de vitesse.",
          })}
          descriptionMode="inline"
          layout="stacked"
          grouped={true}
        >
          <div className="pt-2 pb-1">
            <QualitySlider
              value={sliderValue}
              onChange={handleSliderChange}
              disabled={!isQc}
              labels={[0, 1, 2].map((i) =>
                t(`settings.listening.qualityTier.tier.${i}`, {
                  defaultValue: ["Vif", "Équilibré", "Précision"][i],
                }),
              )}
            />
            {!isQc && (
              <p className="text-xs text-text/50 mt-3 italic">
                {t("settings.listening.qualityTier.disabledHint", {
                  defaultValue:
                    "Désactive un mode spécial ci-dessous pour utiliser ce réglage.",
                })}
              </p>
            )}
          </div>
        </SettingContainer>
      </SettingsGroup>

      <SettingsGroup
        title={t("settings.listening.specialModes", {
          defaultValue: "Modes spéciaux",
        })}
      >
        <ToggleSwitch
          checked={isEnglishNative}
          onChange={handleEnglishToggle}
          label={t("settings.listening.englishNative.label", {
            defaultValue: "Anglais natif",
          })}
          description={t("settings.listening.englishNative.description", {
            defaultValue:
              "Pour dicter en anglais. Modèle dédié, plus rapide qu'en mode français.",
          })}
          descriptionMode="inline"
          grouped={true}
        />

        <ToggleSwitch
          checked={isMultiLingual}
          onChange={handleMultiLingualToggle}
          label={t("settings.listening.multiLingual.label", {
            defaultValue: "Multi-lingue -> traduction anglais instantanée",
          })}
          description={t("settings.listening.multiLingual.description", {
            defaultValue:
              "Parle dans n'importe quelle langue, le texte sort directement en anglais.",
          })}
          descriptionMode="inline"
          grouped={true}
        />

        {isMultiLingual && (
          <div className="mx-4 mb-2 p-3 rounded-md border border-amber-400/30 bg-amber-400/5 flex items-start gap-2">
            <TriangleAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-text/80">
              {t("settings.listening.multiLingual.warning", {
                defaultValue:
                  "Ce mode est plus lent. Sur un ordinateur modeste, attends-toi à 2-3 secondes par phrase.",
              })}
            </p>
          </div>
        )}
      </SettingsGroup>
    </div>
  );
};
