import * as React from 'react';
import { useCallback, useRef, useState } from 'react';
import { SendHorizontal, Square, Paperclip } from 'lucide-react';
import { cn } from '@renderer/lib/utils';
import { Button } from '@renderer/components/ui/button';
import { ModelSelector } from '@renderer/components/chat/ModelSelector';
import { FileUploader, type AttachedFile } from '@renderer/components/chat/FileUploader';

interface ChatInputProps {
  onSend: (content: string, attachments?: AttachedFile[]) => void;
  onAbort: () => void;
  isStreaming: boolean;
  model: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  onAbort,
  isStreaming,
  model,
  onModelChange,
  disabled = false,
}: ChatInputProps): React.ReactElement {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && files.length === 0) return;
    onSend(trimmed, files.length > 0 ? files : undefined);
    setText('');
    setFiles([]);
    // Reset textarea height after send
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    });
  }, [text, files, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!isStreaming && !disabled) {
          handleSend();
        }
      }
    },
    [handleSend, isStreaming, disabled],
  );

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
      adjustHeight();
    },
    [adjustHeight],
  );

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const reads = Array.from(selectedFiles).map(
      file =>
        new Promise<AttachedFile>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1] ?? '';
            resolve({
              name: file.name,
              type: file.type.startsWith('image/') ? 'image' : 'file',
              data: base64,
              mediaType: file.type,
            });
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        }),
    );

    Promise.all(reads).then(newFiles => {
      setFiles(prev => [...prev, ...newFiles]);
    });

    // Reset input value so the same file can be re-selected
    e.target.value = '';
  }, []);

  // Drag-and-drop on the entire input area
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files;
    if (dropped.length === 0) return;

    const reads = Array.from(dropped).map(
      file =>
        new Promise<AttachedFile>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1] ?? '';
            resolve({
              name: file.name,
              type: file.type.startsWith('image/') ? 'image' : 'file',
              data: base64,
              mediaType: file.type,
            });
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        }),
    );

    Promise.all(reads).then(newFiles => {
      setFiles(prev => [...prev, ...newFiles]);
    });
  }, []);

  const canSend = !disabled && !isStreaming && (text.trim().length > 0 || files.length > 0);

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-0)] p-3 transition-colors',
        isDragOver && 'border-[var(--color-brand)] bg-[var(--color-brand)]/5',
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* File list */}
      <FileUploader files={files} onFilesChange={setFiles} />

      {/* Textarea row */}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          rows={1}
          className={cn(
            'flex-1 resize-none bg-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]',
            'focus:outline-none',
            'max-h-[200px]',
            disabled && 'opacity-50',
          )}
        />

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Attach file button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[var(--color-text-secondary)]"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />

          {/* Send / Abort button */}
          {isStreaming ? (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--color-error)]" onClick={onAbort}>
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!canSend} onClick={handleSend}>
              <SendHorizontal className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Bottom bar: model selector + hint */}
      <div className="flex items-center justify-between">
        <ModelSelector value={model} onChange={onModelChange} />
        <span className="text-[10px] text-[var(--color-text-tertiary)]">Enter to send, Shift+Enter for new line</span>
      </div>
    </div>
  );
}
