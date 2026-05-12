import React from "react";
import { useTranslation } from "react-i18next";
import { SettingsGroup } from "../../ui/SettingsGroup";
import { CustomWords } from "../CustomWords";

export const WordsSettings: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-3xl w-full mx-auto space-y-6">
      <SettingsGroup
        title={t("settings.advanced.customWords.title", {
          defaultValue: "Liste de mots",
        })}
      >
        <CustomWords descriptionMode="inline" grouped={true} />
      </SettingsGroup>
    </div>
  );
};
