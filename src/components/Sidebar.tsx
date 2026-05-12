import React from "react";
import { useTranslation } from "react-i18next";
import {
  AudioLines,
  BookOpenText,
  Cog,
  FlaskConical,
  History,
  Info,
  Sparkles,
  Settings2,
} from "lucide-react";
import { useSettings } from "../hooks/useSettings";
import BrandLogo from "./BrandLogo";
import {
  GeneralSettings,
  AdvancedSettings,
  HistorySettings,
  DebugSettings,
  AboutSettings,
  PostProcessingSettings,
  ListeningQuality,
  WordsSettings,
} from "./settings";

export type SidebarSection = keyof typeof SECTIONS_CONFIG;

interface IconProps {
  width?: number | string;
  height?: number | string;
  size?: number | string;
  className?: string;
  [key: string]: any;
}

interface SectionConfig {
  labelKey: string;
  defaultLabel: string;
  icon: React.ComponentType<IconProps>;
  component: React.ComponentType;
  enabled: (settings: any) => boolean;
}

export const SECTIONS_CONFIG = {
  listening: {
    labelKey: "sidebar.listening",
    defaultLabel: "Écoute",
    icon: AudioLines,
    component: ListeningQuality,
    enabled: () => true,
  },
  words: {
    labelKey: "sidebar.words",
    defaultLabel: "Mots",
    icon: BookOpenText,
    component: WordsSettings,
    enabled: () => true,
  },
  history: {
    labelKey: "sidebar.history",
    defaultLabel: "Historique",
    icon: History,
    component: HistorySettings,
    enabled: () => true,
  },
  general: {
    labelKey: "sidebar.general",
    defaultLabel: "Réglages",
    icon: Settings2,
    component: GeneralSettings,
    enabled: () => true,
  },
  postprocessing: {
    labelKey: "sidebar.postProcessing",
    defaultLabel: "Texte",
    icon: Sparkles,
    component: PostProcessingSettings,
    enabled: () => true,
  },
  advanced: {
    labelKey: "sidebar.advanced",
    defaultLabel: "Avancé",
    icon: Cog,
    component: AdvancedSettings,
    enabled: () => true,
  },
  debug: {
    labelKey: "sidebar.debug",
    defaultLabel: "Diagnostic",
    icon: FlaskConical,
    component: DebugSettings,
    enabled: (settings) => settings?.debug_mode ?? false,
  },
  about: {
    labelKey: "sidebar.about",
    defaultLabel: "À propos",
    icon: Info,
    component: AboutSettings,
    enabled: () => true,
  },
} as const satisfies Record<string, SectionConfig>;

interface SidebarProps {
  activeSection: SidebarSection;
  onSectionChange: (section: SidebarSection) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const { t } = useTranslation();
  const { settings } = useSettings();

  const availableSections = Object.entries(SECTIONS_CONFIG)
    .filter(([_, config]) => config.enabled(settings))
    .map(([id, config]) => ({ id: id as SidebarSection, ...config }));

  return (
    <aside className="paper-sidebar" aria-label={t("sidebar.navigation", { defaultValue: "Navigation" })}>
      <BrandLogo className="paper-sidebar-logo" size="md" />
      <nav className="paper-sidebar-nav">
        {availableSections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          const label = t(section.labelKey, {
            defaultValue: section.defaultLabel,
          });

          return (
            <button
              key={section.id}
              type="button"
              className={`paper-sidebar-item ${isActive ? "is-active" : ""}`}
              onClick={() => onSectionChange(section.id)}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon width={19} height={19} className="paper-sidebar-icon" />
              <span className="paper-sidebar-label" title={label}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
