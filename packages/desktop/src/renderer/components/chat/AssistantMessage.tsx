import * as React from 'react';
import { cn } from '@renderer/lib/utils';
import { MarkdownRenderer } from './MarkdownRenderer';

interface AssistantMessageProps {
  content: string;
  isStreaming?: boolean;
}

export function AssistantMessage({ content, isStreaming }: AssistantMessageProps): React.ReactElement {
  return (
    <div className="flex justify-start px-4 py-1">
      <div
        className={cn(
          'max-w-[90%] rounded-2xl rounded-tl-sm px-4 py-2.5',
          'bg-[var(--color-surface-1)] border border-[var(--color-border)]',
        )}
      >
        <MarkdownRenderer content={content} isStreaming={isStreaming} />
      </div>
    </div>
  );
}
