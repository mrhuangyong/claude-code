import * as React from 'react';
import { useState, useCallback } from 'react';
import { Loader2, CheckCircle2, XCircle, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@renderer/lib/utils';

interface ToolCallCardProps {
  tool: string;
  input: Record<string, unknown>;
  output?: string;
  status: 'running' | 'success' | 'error';
}

function StatusIcon({ status }: { status: ToolCallCardProps['status'] }): React.ReactElement {
  switch (status) {
    case 'running':
      return <Loader2 className="h-3.5 w-3.5 text-[var(--color-info)] animate-spin shrink-0" />;
    case 'success':
      return <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-success)] shrink-0" />;
    case 'error':
      return <XCircle className="h-3.5 w-3.5 text-[var(--color-error)] shrink-0" />;
  }
}

function formatJson(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

export function ToolCallCard({ tool, input, output, status }: ToolCallCardProps): React.ReactElement {
  const [expanded, setExpanded] = useState(false);

  const toggle = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  const borderColor =
    status === 'error'
      ? 'border-[var(--color-error)]/30'
      : status === 'running'
        ? 'border-[var(--color-info)]/30'
        : 'border-[var(--color-border)]';

  return (
    <div className="mx-4 my-1">
      <div className={cn('rounded-lg border overflow-hidden', borderColor)}>
        <button
          type="button"
          onClick={toggle}
          className={cn(
            'flex items-center gap-2 px-3 py-2 w-full text-left',
            'hover:bg-[var(--color-surface-1)] transition-colors',
          )}
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-tertiary)]" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-tertiary)]" />
          )}
          <StatusIcon status={status} />
          <span className="text-xs font-mono font-medium text-[var(--color-text-primary)] truncate">{tool}</span>
        </button>

        {expanded && (
          <div className="border-t border-[var(--color-border)]">
            <div className="p-3">
              <div className="text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-1">
                Input
              </div>
              <pre className="text-xs text-[var(--color-text-secondary)] font-mono leading-relaxed whitespace-pre-wrap break-all max-h-48 overflow-y-auto bg-[var(--color-surface-2)] rounded p-2">
                {formatJson(input)}
              </pre>
            </div>
            {output !== undefined && (
              <div className="p-3 border-t border-[var(--color-border)]">
                <div className="text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-1">
                  Output
                </div>
                <pre
                  className={cn(
                    'text-xs font-mono leading-relaxed whitespace-pre-wrap break-all max-h-48 overflow-y-auto rounded p-2',
                    status === 'error'
                      ? 'text-[var(--color-error)] bg-[var(--color-error)]/5'
                      : 'text-[var(--color-text-secondary)] bg-[var(--color-surface-2)]',
                  )}
                >
                  {output}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
