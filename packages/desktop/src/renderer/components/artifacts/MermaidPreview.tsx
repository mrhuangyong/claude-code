import * as React from 'react';

interface MermaidPreviewProps {
  code: string;
}

export function MermaidPreview({ code }: MermaidPreviewProps): React.ReactElement {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    async function renderMermaid(): Promise<void> {
      try {
        const mermaid = await import('mermaid');
        mermaid.default.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'strict',
        });

        if (cancelled || !containerRef.current) return;

        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.default.render(id, code);

        if (cancelled || !containerRef.current) return;

        containerRef.current.innerHTML = svg;
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to render mermaid diagram');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    renderMermaid();

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <span className="text-sm text-[var(--color-text-secondary)]">Rendering diagram...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <span className="text-sm text-[var(--color-error)]">{error}</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-1 items-center justify-center overflow-auto p-4 [&>svg]:max-w-full [&>svg]:h-auto"
    />
  );
}
