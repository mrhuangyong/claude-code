import * as React from 'react';
import { useState, useCallback } from 'react';
import { Copy, Check, X } from 'lucide-react';
import { HtmlPreview } from './HtmlPreview';
import { CodePreview } from './CodePreview';
import { MermaidPreview } from './MermaidPreview';
import { cn } from '@renderer/lib/utils';

export interface Artifact {
  id: string;
  type: 'code' | 'html' | 'svg' | 'mermaid' | 'react';
  title: string;
  content: string;
  language?: string;
}

interface ArtifactsPanelProps {
  artifact: Artifact | null;
  onClose: () => void;
}

function ArtifactContent({ artifact }: { artifact: Artifact }): React.ReactElement {
  switch (artifact.type) {
    case 'html':
    case 'svg':
    case 'react':
      return <HtmlPreview content={artifact.content} type={artifact.type} />;
    case 'mermaid':
      return <MermaidPreview code={artifact.content} />;
    case 'code':
    default:
      return <CodePreview code={artifact.content} language={artifact.language} />;
  }
}

export function ArtifactsPanel({ artifact, onClose }: ArtifactsPanelProps): React.ReactElement | null {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!artifact) return;
    try {
      await navigator.clipboard.writeText(artifact.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in some contexts
    }
  }, [artifact]);

  if (!artifact) return null;

  return (
    <div className="flex h-full w-full flex-col border-l border-[var(--color-border)] bg-[var(--color-surface-1)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center rounded bg-[var(--color-surface-3)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
            {artifact.type}
          </span>
          <span className="truncate text-sm font-medium text-[var(--color-text-primary)]">{artifact.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              'flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors',
              'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)]',
            )}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-[var(--color-success)]" />
                <span className="text-[var(--color-success)]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'flex items-center justify-center rounded p-1 transition-colors',
              'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)]',
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <ArtifactContent artifact={artifact} />
    </div>
  );
}
