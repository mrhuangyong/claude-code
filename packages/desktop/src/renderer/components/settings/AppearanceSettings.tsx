import { useState, useEffect } from 'react';
import { cliBridge } from '@renderer/lib/cli-bridge';

const THEMES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
] as const;

const LANGUAGES = [
  { value: 'zh', label: 'Chinese' },
  { value: 'en', label: 'English' },
] as const;

type ThemeValue = (typeof THEMES)[number]['value'];
type LanguageValue = (typeof LANGUAGES)[number]['value'];

export function AppearanceSettings() {
  const [theme, setTheme] = useState<ThemeValue>('system');
  const [fontSize, setFontSize] = useState(14);
  const [language, setLanguage] = useState<LanguageValue>('en');
  const [sendOnEnter, setSendOnEnter] = useState(true);

  useEffect(() => {
    cliBridge
      .getConfig()
      .then(config => {
        if (config.theme) {
          setTheme(config.theme as ThemeValue);
        }
        if (config.fontSize) {
          setFontSize(config.fontSize);
        }
        if (config.language) {
          setLanguage(config.language as LanguageValue);
        }
        if (typeof config.sendOnEnter === 'boolean') {
          setSendOnEnter(config.sendOnEnter);
        }
      })
      .catch(() => {
        // Config not available yet
      });
  }, []);

  const handleChange = async (changes: {
    theme?: ThemeValue;
    fontSize?: number;
    language?: LanguageValue;
    sendOnEnter?: boolean;
  }) => {
    try {
      await cliBridge.setConfig(changes);
    } catch {
      // Silently handle save errors
    }
  };

  const handleThemeChange = (value: ThemeValue) => {
    setTheme(value);
    handleChange({ theme: value });
  };

  const handleFontSizeChange = (value: number) => {
    setFontSize(value);
    handleChange({ fontSize: value });
  };

  const handleLanguageChange = (value: LanguageValue) => {
    setLanguage(value);
    handleChange({ language: value });
  };

  const handleSendOnEnterChange = (value: boolean) => {
    setSendOnEnter(value);
    handleChange({ sendOnEnter: value });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Theme */}
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-[var(--color-text-primary)]">Theme</legend>
        <div className="flex items-center gap-4">
          {THEMES.map(t => (
            <label
              key={t.value}
              className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] cursor-pointer"
            >
              <input
                type="radio"
                name="theme"
                value={t.value}
                checked={theme === t.value}
                onChange={() => handleThemeChange(t.value)}
                className="accent-[var(--color-brand)]"
              />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Font Size */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="font-size-slider" className="text-sm font-medium text-[var(--color-text-primary)]">
          Font Size: {fontSize}px
        </label>
        <input
          id="font-size-slider"
          type="range"
          min={12}
          max={24}
          step={1}
          value={fontSize}
          onChange={e => handleFontSizeChange(Number(e.target.value))}
          className="w-full accent-[var(--color-brand)]"
        />
        <div className="flex justify-between text-xs text-[var(--color-text-tertiary)]">
          <span>12</span>
          <span>24</span>
        </div>
      </div>

      {/* Language */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="language-select" className="text-sm font-medium text-[var(--color-text-primary)]">
          Language
        </label>
        <select
          id="language-select"
          value={language}
          onChange={e => handleLanguageChange(e.target.value as LanguageValue)}
          className="flex h-9 w-full max-w-48 rounded-md border border-[var(--color-border)] bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-brand)]"
        >
          {LANGUAGES.map(l => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      {/* Send on Enter */}
      <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer">
        <input
          type="checkbox"
          checked={sendOnEnter}
          onChange={e => handleSendOnEnterChange(e.target.checked)}
          className="accent-[var(--color-brand)]"
        />
        Send message on Enter
      </label>
    </div>
  );
}
