import * as React from 'react';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderMarkdown(text: string): string {
  // Extract and protect code blocks first
  const codeBlocks: string[] = [];
  let processed = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const index = codeBlocks.length;
    const langLabel = lang ? `<span class="code-lang">${escapeHtml(lang)}</span>` : '';
    codeBlocks.push(
      `<div class="code-block-wrapper"><div class="code-block-header">${langLabel}</div><pre class="code-block-pre"><code>${escapeHtml(code.trimEnd())}</code></pre></div>`,
    );
    return `​CODEBLOCK${index}​`;
  });

  // Inline code
  processed = processed.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Headers (must come before bold/italic)
  processed = processed.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  processed = processed.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  processed = processed.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  processed = processed.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold + italic
  processed = processed.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold
  processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Unordered list items
  processed = processed.replace(/^[-*] (.+)$/gm, '<li>$1</li>');

  // Line breaks (double newline = paragraph break, single newline = <br>)
  processed = processed.replace(/\n\n/g, '</p><p>');
  processed = processed.replace(/\n/g, '<br>');

  // Wrap in paragraph
  processed = `<p>${processed}</p>`;

  // Restore code blocks
  processed = processed.replace(/​CODEBLOCK(\d+)​/g, (_match, idx) => {
    return codeBlocks[Number(idx)];
  });

  return processed;
}

export function MarkdownRenderer({ content, isStreaming }: MarkdownRendererProps): React.ReactElement {
  if (isStreaming) {
    return (
      <div className="whitespace-pre-wrap text-sm text-[var(--color-text-primary)] font-sans leading-relaxed">
        {content}
        <span className="inline-block w-0.5 h-4 bg-[var(--color-text-primary)] ml-0.5 animate-pulse align-text-bottom" />
      </div>
    );
  }

  const html = renderMarkdown(content);

  return (
    <div
      ref={el => {
        if (el) el.innerHTML = html;
      }}
      className="markdown-content text-sm text-[var(--color-text-primary)] font-sans leading-relaxed prose-sm"
    />
  );
}
