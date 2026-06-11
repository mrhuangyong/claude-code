import * as React from 'react';

interface HtmlPreviewProps {
  content: string;
  type: 'html' | 'react' | 'svg';
}

export function HtmlPreview({ content, type }: HtmlPreviewProps): React.ReactElement {
  const srcDoc = React.useMemo(() => {
    if (type === 'svg') {
      return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:transparent;}</style></head>
<body>${content}</body>
</html>`;
    }
    // type === 'html' | 'react'
    return content;
  }, [content, type]);

  return (
    <div className="flex-1 overflow-hidden">
      <iframe srcDoc={srcDoc} sandbox="allow-scripts" className="h-full w-full border-0 bg-white" title="Preview" />
    </div>
  );
}
