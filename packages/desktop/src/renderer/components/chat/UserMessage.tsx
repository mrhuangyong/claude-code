import * as React from 'react';
import { cn } from '@renderer/lib/utils';

interface UserMessageProps {
  content: string;
  attachments?: Array<{ name: string; type: string }>;
}

export function UserMessage({ content, attachments }: UserMessageProps): React.ReactElement {
  return (
    <div className="flex justify-end px-4 py-1">
      <div className="max-w-[80%] flex flex-col items-end gap-1.5">
        {/* Attachment tags */}
        {attachments && attachments.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-end">
            {attachments.map(att => (
              <span
                key={att.name}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs',
                  'bg-[var(--color-brand)]/20 text-white border border-white/20',
                )}
              >
                <span className="opacity-70">{att.type === 'image' ? 'IMG' : 'FILE'}</span>
                <span className="max-w-[120px] truncate">{att.name}</span>
              </span>
            ))}
          </div>
        )}
        {/* Message bubble */}
        <div
          className={cn(
            'rounded-2xl rounded-tr-sm px-4 py-2.5',
            'bg-[var(--color-brand)] text-white',
            'text-sm leading-relaxed whitespace-pre-wrap',
          )}
        >
          {content}
        </div>
      </div>
    </div>
  );
}
