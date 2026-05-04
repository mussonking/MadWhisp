import React from "react";
import { useTranslation } from "react-i18next";
import {
  BookOpenText,
  Cog,
  Cpu,
  FlaskConical,
  History,
  Info,
  Sparkles,
  Terminal,
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
  ModelsSettings,
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
  general: {
    labelKey: "sidebar.general",
    defaultLabel: "General",
    icon: Terminal,
    component: GeneralSettings,
    enabled: () => true,
  },
  models: {
    labelKey: "sidebar.models",
    defaultLabel: "Models",
    icon: Cpu,
    component: ModelsSettings,
    enabled: () => true,
  },
  words: {
    labelKey: "sidebar.words",
    defaultLabel: "Words",
    icon: BookOpenText,
    component: WordsSettings,
    enabled: () => true,
  },
  postprocessing: {
    labelKey: "sidebar.postProcessing",
    defaultLabel: "Process",
    icon: Sparkles,
    component: PostProcessingSettings,
    enabled: () => true,
  },
  advanced: {
    labelKey: "sidebar.advanced",
    defaultLabel: "Advanced",
    icon: Cog,
    component: AdvancedSettings,
    enabled: () => true,
  },
  history: {
    labelKey: "sidebar.history",
    defaultLabel: "History",
    icon: History,
    component: HistorySettings,
    enabled: () => true,
  },
  debug: {
    labelKey: "sidebar.debug",
    defaultLabel: "Debug",
    icon: FlaskConical,
    component: DebugSettings,
    enabled: (settings) => settings?.debug_mode ?? false,
  },
  about: {
    labelKey: "sidebar.about",
    defaultLabel: "About",
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
    <div className="flex flex-col w-44 h-full border-e border-logo-stroke/40 bg-[#080c10] items-center px-2">
      <BrandLogo className="w-full px-3 py-4" size="md" />
      <div className="flex flex-col w-full items-center gap-1 pt-2 border-t border-logo-stroke/40">
        {availableSections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          const label = t(section.labelKey, {
            defaultValue: section.defaultLabel,
          });

          return (
            <div
              key={section.id}
              className={`flex gap-2 items-center p-2 w-full rounded-md cursor-pointer transition-colors font-mono ${
                isActive
                  ? "bg-logo-primary/15 text-logo-primary border border-logo-primary/45"
                  : "border border-transparent hover:bg-logo-primary/10 hover:text-logo-primary opacity-85 hover:opacity-100"
              }`}
              onClick={() => onSectionChange(section.id)}
            >
              <Icon width={20} height={20} className="shrink-0" />
              <p
                className="text-sm font-medium truncate tracking-normal"
                title={label}
              >
                {label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
