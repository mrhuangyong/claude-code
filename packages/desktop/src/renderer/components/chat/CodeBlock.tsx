import * as React from 'react';
import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@renderer/lib/utils';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language }: CodeBlockProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: do nothing if clipboard API fails
    }
  }, [code]);

  return (
    <div className="my-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-1)] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
        <span className="text-xs font-medium text-[var(--color-text-secondary)] font-mono">{language || 'text'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-colors',
            'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-3)]',
          )}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-[var(--color-success)]" />
              <span className="text-[var(--color-success)]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto">
        <code className="text-xs leading-relaxed text-[var(--color-text-primary)] font-mono">{code}</code>
      </pre>
    </div>
  );
}
