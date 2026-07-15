import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X, ChevronDown, ChevronRight } from "lucide-react";
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

// Trim only -- alias and word strings flow through React (auto-escaped) and a
// literal-string matcher in Rust, so there's no XSS or regex-injection surface
// to defend against. Stripping characters here was breaking legitimate input
// like French aliases ("l'app", "j'ai", "n'importe").
const sanitizeText = (value: string) => value.trim();

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
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const toggleExpanded = (word: string) => {
      setExpanded((prev) => ({ ...prev, [word]: !prev[word] }));
    };

    const customWords: CustomWordEntry[] = (
      getSetting("custom_words") || []
    ).map(withDefaults);
    const sortedCustomWords = [...customWords].sort((a, b) =>
      a.word.localeCompare(b.word, undefined, { sensitivity: "base" }),
    );
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
        className: "words-token words-token-alias",
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
        className: "words-token words-token-blocked",
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

      // Case-sensitive: "Hello", "hello" and "heLlo" are distinct entries, so
      // the user can register every casing variant they need.
      if (customWords.some((entry) => entry.word === sanitizedWord)) {
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
        // Case-sensitive: "xI" and "Xi" are distinct tokens, so both casings can
        // coexist (e.g. to map several transcriptions onto the same target).
        const exists = values.some((value) => value === token);

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
        <div className="words-token-section">
          <div className="words-token-heading">
            <span className={config.className}>{config.title}</span>
            <span className="words-token-hint">{config.hint}</span>
          </div>

          <div className="words-token-list">
            {values.length === 0 ? (
              <span className="words-token-empty">
                {t("settings.advanced.customWords.none", {
                  defaultValue: "none",
                })}
              </span>
            ) : (
              values.map((token) => (
                <button
                  key={`${entry.word}-${field}-${token}`}
                  type="button"
                  className={config.className}
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

          <div className="words-token-input-row">
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
          layout="stacked"
        >
          <div className="words-add-row">
            <Input
              type="text"
              className="flex-1 min-w-0"
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
              className="inline-flex items-center gap-2 flex-shrink-0"
            >
              <Plus className="h-4 w-4" />
              {t("settings.advanced.customWords.add")}
            </Button>
          </div>
        </SettingContainer>

        <div
          className={grouped ? "words-list words-list-grouped" : "words-list"}
        >
          {sortedCustomWords.length === 0 ? (
            <p className="words-empty-state">
              {t("settings.advanced.customWords.empty", {
                defaultValue: "No custom words yet.",
              })}
            </p>
          ) : (
            sortedCustomWords.map((entry) => {
              const aliases = entry.aliases ?? [];
              const blacklist = entry.blacklist ?? [];
              const summary = `${aliases.length}a | ${blacklist.length}b`;
              const isOpen = !!expanded[entry.word];

              return (
                <div key={entry.word} className="words-entry-card">
                  <div className="words-entry-row">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(entry.word)}
                      className="words-entry-toggle"
                      aria-expanded={isOpen}
                    >
                      {isOpen ? (
                        <ChevronDown className="words-entry-icon" />
                      ) : (
                        <ChevronRight className="words-entry-icon" />
                      )}
                      <span className="words-entry-word">{entry.word}</span>
                      <span className="words-entry-summary">{summary}</span>
                    </button>
                    <Button
                      onClick={() => handleRemoveWord(entry.word)}
                      disabled={isBusy}
                      variant="danger-ghost"
                      size="sm"
                      className="inline-flex h-7 w-7 items-center justify-center p-0"
                      aria-label={t("settings.advanced.customWords.remove", {
                        word: entry.word,
                      })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {isOpen && (
                    <div className="words-entry-details">
                      {renderTokenSection(entry, "aliases")}
                      {renderTokenSection(entry, "blacklist")}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </>
    );
  },
);
