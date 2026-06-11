import * as React from 'react';
import { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@renderer/lib/utils';

interface ThinkingBlockProps {
  content: string;
}

export function ThinkingBlock({ content }: ThinkingBlockProps): React.ReactElement {
  const [expanded, setExpanded] = useState(false);

  const toggle = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  return (
    <div className="mx-4 my-1">
      <button
        type="button"
        onClick={toggle}
        className={cn(
          'flex items-center gap-1.5 rounded-lg px-3 py-1.5 w-full text-left',
          'text-xs text-[var(--color-text-secondary)]',
          'hover:bg-[var(--color-surface-1)] transition-colors',
          'border border-[var(--color-border)]',
        )}
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="font-medium">Thinking</span>
        {!expanded && <span className="truncate opacity-70 ml-1">({content.length} chars)</span>}
      </button>
      {expanded && (
        <div className="mt-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-1)] p-3">
          <pre className="whitespace-pre-wrap text-xs text-[var(--color-text-secondary)] font-mono leading-relaxed max-h-64 overflow-y-auto">
            {content}
          </pre>
        </div>
      )}
    </div>
  );
}
