import * as React from 'react';
import { Button } from '@renderer/components/ui/button';
import { ChevronDown } from 'lucide-react';

const MODELS = [
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'anthropic' },
  { id: 'claude-opus-4-7', name: 'Claude Opus 4.7', provider: 'anthropic' },
  { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', provider: 'anthropic' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
  { id: 'deepseek-r1', name: 'DeepSeek R1', provider: 'openai' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'gemini' },
  { id: 'grok-3', name: 'Grok 3', provider: 'grok' },
];

interface ModelSelectorProps {
  value: string;
  onChange: (model: string) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps): React.ReactElement {
  const current = MODELS.find(m => m.id === value) ?? MODELS[0];

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 text-xs text-[var(--color-text-secondary)]"
        onClick={() => {
          const nextIndex = (MODELS.findIndex(m => m.id === value) + 1) % MODELS.length;
          onChange(MODELS[nextIndex < 0 ? 0 : nextIndex].id);
        }}
      >
        {current.name}
        <ChevronDown className="h-3 w-3" />
      </Button>
    </div>
  );
}
