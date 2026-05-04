import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "../../hooks/useSettings";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { SettingContainer } from "../ui/SettingContainer";
import type { CustomWordEntry } from "../../bindings";

interface CustomWordsProps {
  descriptionMode?: "inline" | "tooltip";
  grouped?: boolean;
}

type TokenField = "aliases" | "blacklist";

const sanitizeText = (value: string) => value.trim().replace(/[<>"'&]/g, "");

const withDefaults = (entry: CustomWordEntry): CustomWordEntry => ({
  ...entry,
  aliases: entry.aliases ?? [],
  blacklist: entry.blacklist ?? [],
});

export const CustomWords: React.FC<CustomWordsProps> = React.memo(
  ({ descriptionMode = "tooltip", grouped = false }) => {
    const { t } = useTranslation();
    const { getSetting, updateSetting, isUpdating } = useSettings();
    const [newWord, setNewWord] = useState("");
    const [aliasDrafts, setAliasDrafts] = useState<Record<string, string>>({});
    const [blacklistDrafts, setBlacklistDrafts] = useState<
      Record<string, string>
    >({});

    const customWords: CustomWordEntry[] = (
      getSetting("custom_words") || []
    ).map(withDefaults);
    const isBusy = isUpdating("custom_words");

    const tokenConfig = {
      aliases: {
        title: t("settings.advanced.customWords.aliases", {
          defaultValue: "Aliases",
        }),
        hint: t("settings.advanced.customWords.aliasesHint", {
          defaultValue: "Exact replacements.",
        }),
        placeholder: t("settings.advanced.customWords.aliasPlaceholder", {
          defaultValue: "add alias...",
        }),
        className: "text-yellow-300 border-yellow-300/30 bg-yellow-300/10",
      },
      blacklist: {
        title: t("settings.advanced.customWords.blacklist", {
          defaultValue: "Blacklist",
        }),
        hint: t("settings.advanced.customWords.blacklistHint", {
          defaultValue: "Never fuzzy-match these.",
        }),
        placeholder: t("settings.advanced.customWords.blacklistPlaceholder", {
          defaultValue: "add blacklist...",
        }),
        className: "text-red-300 border-red-300/30 bg-red-300/10",
      },
    } as const;

    const updateWords = (nextWords: CustomWordEntry[]) => {
      updateSetting("custom_words", nextWords.map(withDefaults));
    };

    const updateEntry = (
      word: string,
      updater: (entry: CustomWordEntry) => CustomWordEntry,
    ) => {
      updateWords(
        customWords.map((entry) =>
          entry.word === word ? updater(withDefaults(entry)) : entry,
        ),
      );
    };

    const handleAddWord = () => {
      const sanitizedWord = sanitizeText(newWord);
      if (!sanitizedWord || sanitizedWord.length > 80) return;

      if (
        customWords.some(
          (entry) => entry.word.toLowerCase() === sanitizedWord.toLowerCase(),
        )
      ) {
        toast.error(
          t("settings.advanced.customWords.duplicate", {
            word: sanitizedWord,
          }),
        );
        return;
      }

      updateWords([
        ...customWords,
        { word: sanitizedWord, aliases: [], blacklist: [] },
      ]);
      setNewWord("");
    };

    const handleRemoveWord = (wordToRemove: string) => {
      updateWords(customWords.filter((entry) => entry.word !== wordToRemove));
    };

    const getDraft = (word: string, field: TokenField) =>
      field === "aliases"
        ? (aliasDrafts[word] ?? "")
        : (blacklistDrafts[word] ?? "");

    const setDraft = (word: string, field: TokenField, value: string) => {
      const setter = field === "aliases" ? setAliasDrafts : setBlacklistDrafts;
      setter((drafts) => ({ ...drafts, [word]: value }));
    };

    const clearDraft = (word: string, field: TokenField) => {
      const setter = field === "aliases" ? setAliasDrafts : setBlacklistDrafts;
      setter((drafts) => {
        const next = { ...drafts };
        delete next[word];
        return next;
      });
    };

    const handleAddToken = (word: string, field: TokenField) => {
      const token = sanitizeText(getDraft(word, field));
      if (!token || token.length > 80) return;

      updateEntry(word, (entry) => {
        const values = entry[field] ?? [];
        const exists = values.some(
          (value) => value.toLowerCase() === token.toLowerCase(),
        );

        if (exists) return entry;
        return { ...entry, [field]: [...values, token] };
      });
      clearDraft(word, field);
    };

    const handleRemoveToken = (
      word: string,
      field: TokenField,
      tokenToRemove: string,
    ) => {
      updateEntry(word, (entry) => ({
        ...entry,
        [field]: (entry[field] ?? []).filter(
          (token) => token !== tokenToRemove,
        ),
      }));
    };

    const handleWordKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddWord();
      }
    };

    const handleTokenKeyDown = (
      e: React.KeyboardEvent,
      word: string,
      field: TokenField,
    ) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddToken(word, field);
      }
    };

    const renderTokenSection = (entry: CustomWordEntry, field: TokenField) => {
      const values = entry[field] ?? [];
      const config = tokenConfig[field];
      const draft = getDraft(entry.word, field);

      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono ${config.className}`}>
              {config.title}
            </span>
            <span className="text-xs text-mid-gray">{config.hint}</span>
          </div>

          <div className="flex flex-wrap gap-1">
            {values.length === 0 ? (
              <span className="text-xs italic text-mid-gray">
                {t("settings.advanced.customWords.none", {
                  defaultValue: "none",
                })}
              </span>
            ) : (
              values.map((token) => (
                <button
                  key={`${entry.word}-${field}-${token}`}
                  type="button"
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-mono transition-colors hover:bg-red-500/10 ${config.className}`}
                  onClick={() => handleRemoveToken(entry.word, field, token)}
                  disabled={isBusy}
                  aria-label={t("settings.advanced.customWords.remove", {
                    word: token,
                  })}
                >
                  <span>{token}</span>
                  <X className="h-3 w-3" />
                </button>
              ))
            )}
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="text"
              className="min-w-0 flex-1"
              value={draft}
              onChange={(e) => setDraft(entry.word, field, e.target.value)}
              onKeyDown={(e) => handleTokenKeyDown(e, entry.word, field)}
              placeholder={config.placeholder}
              variant="compact"
              disabled={isBusy}
            />
            <Button
              onClick={() => handleAddToken(entry.word, field)}
              disabled={!draft.trim() || draft.trim().length > 80 || isBusy}
              variant="secondary"
              size="sm"
              aria-label={t("common.add")}
              className="inline-flex h-8 w-8 items-center justify-center p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    };

    return (
      <>
        <SettingContainer
          title={t("settings.advanced.customWords.title")}
          description={t("settings.advanced.customWords.description")}
          descriptionMode={descriptionMode}
          grouped={grouped}
        >
          <div className="flex items-center gap-2">
            <Input
              type="text"
              className="max-w-48"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={handleWordKeyDown}
              placeholder={t("settings.advanced.customWords.placeholder")}
              variant="compact"
              disabled={isBusy}
            />
            <Button
              onClick={handleAddWord}
              disabled={!newWord.trim() || newWord.trim().length > 80 || isBusy}
              variant="primary"
              size="md"
              className="inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t("settings.advanced.customWords.add")}
            </Button>
          </div>
        </SettingContainer>

        <div
          className={`px-4 p-2 ${grouped ? "" : "rounded-lg border border-mid-gray/20"} space-y-3`}
        >
          {customWords.length === 0 ? (
            <p className="text-sm italic text-mid-gray">
              {t("settings.advanced.customWords.empty", {
                defaultValue: "No custom words yet.",
              })}
            </p>
          ) : (
            customWords.map((entry) => {
              const aliases = entry.aliases ?? [];
              const blacklist = entry.blacklist ?? [];
              const summary = `${aliases.length}a | ${blacklist.length}b`;

              return (
                <div
                  key={entry.word}
                  className="space-y-3 rounded-md border border-logo-stroke/25 bg-[#0a0f1a] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-mono text-sm font-semibold text-logo-primary">
                        {entry.word}
                      </div>
                      <div className="text-xs text-mid-gray">{summary}</div>
                    </div>
                    <Button
                      onClick={() => handleRemoveWord(entry.word)}
                      disabled={isBusy}
                      variant="danger-ghost"
                      size="sm"
                      className="inline-flex h-8 w-8 items-center justify-center p-0"
                      aria-label={t("settings.advanced.customWords.remove", {
                        word: entry.word,
                      })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {renderTokenSection(entry, "aliases")}
                  {renderTokenSection(entry, "blacklist")}
                </div>
              );
            })
          )}
        </div>
      </>
    );
  },
);
