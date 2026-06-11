import * as React from 'react';
import { CodeBlock } from '@renderer/components/chat/CodeBlock';

interface CodePreviewProps {
  code: string;
  language?: string;
}

export function CodePreview({ code, language }: CodePreviewProps): React.ReactElement {
  return (
    <div className="flex-1 overflow-auto p-4">
      <CodeBlock code={code} language={language} />
    </div>
  );
}
