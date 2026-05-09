import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getVersion } from "@tauri-apps/api/app";
import { openUrl, openPath } from "@tauri-apps/plugin-opener";
import { resolveResource } from "@tauri-apps/api/path";
import { SettingsGroup } from "../../ui/SettingsGroup";
import { SettingContainer } from "../../ui/SettingContainer";
import { Button } from "../../ui/Button";
import { AppDataDirectory } from "../AppDataDirectory";
import { AppLanguageSelector } from "../AppLanguageSelector";
import { LogDirectory } from "../debug";

export const AboutSettings: React.FC = () => {
  const { t } = useTranslation();
  const [version, setVersion] = useState("");

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const appVersion = await getVersion();
        setVersion(appVersion);
      } catch (error) {
        console.error("Failed to get app version:", error);
        setVersion("0.1.2");
      }
    };

    fetchVersion();
  }, []);

  const handleDonateClick = async () => {
    try {
      await openUrl("https://madera.tools");
    } catch (error) {
      console.error("Failed to open donate link:", error);
    }
  };

  const openBundledLegalFile = async (relativePath: string) => {
    try {
      const path = await resolveResource(relativePath);
      await openPath(path);
    } catch (error) {
      console.error("Failed to open legal file:", error);
    }
  };

  return (
    <div className="max-w-3xl w-full mx-auto space-y-6">
      <SettingsGroup title={t("settings.about.title")}>
        <AppLanguageSelector descriptionMode="tooltip" grouped={true} />
        <SettingContainer
          title={t("settings.about.version.title")}
          description={t("settings.about.version.description")}
          grouped={true}
        >
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <span className="text-sm font-mono">v{version}</span>
        </SettingContainer>

        <SettingContainer
          title={t("settings.about.supportDevelopment.title")}
          description={t("settings.about.supportDevelopment.description")}
          grouped={true}
        >
          <Button variant="primary" size="md" onClick={handleDonateClick}>
            {t("settings.about.supportDevelopment.button")}
          </Button>
        </SettingContainer>

        <SettingContainer
          title={t("settings.about.sourceCode.title")}
          description={t("settings.about.sourceCode.description")}
          grouped={true}
        >
          <Button
            variant="secondary"
            size="md"
            onClick={() => openUrl("https://github.com/mussonking/MotsDits")}
          >
            {t("settings.about.sourceCode.button")}
          </Button>
        </SettingContainer>

        <AppDataDirectory descriptionMode="tooltip" grouped={true} />
        <LogDirectory grouped={true} />
      </SettingsGroup>

      <SettingsGroup title={t("settings.about.acknowledgments.title")}>
        <SettingContainer
          title={t("settings.about.acknowledgments.whisper.title")}
          description={t("settings.about.acknowledgments.whisper.description")}
          grouped={true}
          layout="stacked"
        >
          <div className="text-sm text-mid-gray">
            {t("settings.about.acknowledgments.whisper.details")}
          </div>
        </SettingContainer>
      </SettingsGroup>

      <SettingsGroup
        title={t("settings.about.legal.title", { defaultValue: "Legal" })}
      >
        <SettingContainer
          title={t("settings.about.legal.thirdParty.title", {
            defaultValue: "Third-party licenses",
          })}
          description={t("settings.about.legal.thirdParty.description", {
            defaultValue:
              "Open-source components incorporated into MotsDits and their licenses.",
          })}
          grouped={true}
        >
          <Button
            variant="secondary"
            size="md"
            onClick={() => openBundledLegalFile("legal/THIRD-PARTY-LICENSES.md")}
          >
            {t("settings.about.legal.thirdParty.button", {
              defaultValue: "Open",
            })}
          </Button>
        </SettingContainer>

        <SettingContainer
          title={t("settings.about.legal.notice.title", {
            defaultValue: "Notice",
          })}
          description={t("settings.about.legal.notice.description", {
            defaultValue:
              "Copyright, attribution, and trademark information.",
          })}
          grouped={true}
        >
          <Button
            variant="secondary"
            size="md"
            onClick={() => openBundledLegalFile("legal/NOTICE.md")}
          >
            {t("settings.about.legal.notice.button", { defaultValue: "Open" })}
          </Button>
        </SettingContainer>

        <SettingContainer
          title={t("settings.about.legal.handyMit.title", {
            defaultValue: "Upstream MIT license (Handy)",
          })}
          description={t("settings.about.legal.handyMit.description", {
            defaultValue:
              "MIT license of the upstream Handy project from which MotsDits was forked.",
          })}
          grouped={true}
        >
          <Button
            variant="secondary"
            size="md"
            onClick={() => openBundledLegalFile("legal/LICENSE-HANDY-MIT")}
          >
            {t("settings.about.legal.handyMit.button", {
              defaultValue: "Open",
            })}
          </Button>
        </SettingContainer>
      </SettingsGroup>
    </div>
  );
};
