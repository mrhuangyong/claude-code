import * as React from 'react';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, FileIcon, ImageIcon } from 'lucide-react';
import { cn } from '@renderer/lib/utils';

export interface AttachedFile {
  name: string;
  type: 'image' | 'file';
  data: string; // base64
  mediaType: string;
}

interface FileUploaderProps {
  files: AttachedFile[];
  onFilesChange: (files: AttachedFile[]) => void;
  className?: string;
}

function fileType(mimeType: string): 'image' | 'file' {
  if (mimeType.startsWith('image/')) return 'image';
  return 'file';
}

function readFileAsBase64(file: File): Promise<AttachedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] ?? '';
      resolve({
        name: file.name,
        type: fileType(file.type),
        data: base64,
        mediaType: file.type,
      });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function FileUploader({ files, onFilesChange, className }: FileUploaderProps): React.ReactElement | null {
  const onDrop = useCallback(
    async (accepted: File[]) => {
      const newFiles = await Promise.all(accepted.map(readFileAsBase64));
      onFilesChange([...files, ...newFiles]);
    },
    [files, onFilesChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  });

  const removeFile = useCallback(
    (index: number) => {
      const next = files.filter((_, i) => i !== index);
      onFilesChange(next);
    },
    [files, onFilesChange],
  );

  if (files.length === 0 && !isDragActive) return null;

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border border-dashed border-[var(--color-border)] rounded-lg p-2',
        isDragActive && 'border-[var(--color-brand)] bg-[var(--color-brand)]/5',
        className,
      )}
    >
      <input {...getInputProps()} />
      {isDragActive && (
        <p className="text-xs text-[var(--color-text-secondary)] text-center py-2">Drop files here...</p>
      )}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-1.5 rounded-md bg-[var(--color-surface-1)] px-2 py-1 text-xs text-[var(--color-text-secondary)]"
            >
              {file.type === 'image' ? <ImageIcon className="h-3 w-3" /> : <FileIcon className="h-3 w-3" />}
              <span className="max-w-[120px] truncate">{file.name}</span>
              <button
                type="button"
                className="ml-0.5 rounded-sm hover:bg-[var(--color-surface-2)] p-0.5"
                onClick={() => removeFile(index)}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
