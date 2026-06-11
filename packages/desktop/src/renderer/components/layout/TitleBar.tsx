import React from 'react';
import { Button } from '@renderer/components/ui/button';
import { useLayoutStore } from '@renderer/stores/layout-store';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export function TitleBar(): React.ReactElement {
  const sidebarOpen = useLayoutStore(s => s.sidebarOpen);
  const toggleSidebar = useLayoutStore(s => s.toggleSidebar);

  return (
    <div className="flex h-11 items-center border-b border-[var(--color-border)] bg-[var(--color-surface-0)] px-2">
      <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Toggle sidebar">
        {sidebarOpen ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
      </Button>
      <span className="ml-2 text-sm font-semibold" style={{ color: 'var(--color-brand)' }}>
        Claude Code Best
      </span>
    </div>
  );
}
