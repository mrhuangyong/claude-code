import { useState, useEffect } from 'react';
import { Input } from '@renderer/components/ui/input';
import { Button } from '@renderer/components/ui/button';
import { cliBridge } from '@renderer/lib/cli-bridge';

const PROVIDERS = [
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'grok', label: 'Grok' },
] as const;

type ProviderValue = (typeof PROVIDERS)[number]['value'];

export function ProviderConfig() {
  const [provider, setProvider] = useState<ProviderValue>('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    cliBridge
      .getConfig()
      .then(config => {
        if (config.provider) {
          setProvider(config.provider as ProviderValue);
        }
        if (config.apiKeys) {
          const key = config.apiKeys[config.provider] ?? '';
          setApiKey(key);
        }
        if (config.baseUrl) {
          setBaseUrl(config.baseUrl);
        }
      })
      .catch(() => {
        // Config not available yet (e.g. outside Electron)
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await cliBridge.setConfig({
        provider,
        apiKeys: { [provider]: apiKey },
        baseUrl,
      });
      setSaved(true);
    } catch {
      // Silently handle save errors
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="provider-select" className="text-sm font-medium text-[var(--color-text-primary)]">
          Provider
        </label>
        <select
          id="provider-select"
          value={provider}
          onChange={e => setProvider(e.target.value as ProviderValue)}
          className="flex h-9 w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-brand)]"
        >
          {PROVIDERS.map(p => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="api-key-input" className="text-sm font-medium text-[var(--color-text-primary)]">
          API Key
        </label>
        <Input
          id="api-key-input"
          type="password"
          placeholder="sk-..."
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="base-url-input" className="text-sm font-medium text-[var(--color-text-primary)]">
          Base URL
        </label>
        <Input
          id="base-url-input"
          type="text"
          placeholder="https://api.anthropic.com (optional)"
          value={baseUrl}
          onChange={e => setBaseUrl(e.target.value)}
        />
        <span className="text-xs text-[var(--color-text-tertiary)]">
          Leave empty to use the default endpoint for the selected provider.
        </span>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
        {saved && <span className="text-sm text-green-500">Saved</span>}
      </div>
    </div>
  );
}
