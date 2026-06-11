import React from 'react';
import { Button } from '@renderer/components/ui/button';
import { useLayoutStore } from '@renderer/stores/layout-store';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export function TitleBar(): React.ReactElement {
  const sidebarOpen = useLayoutStore(s => s.sidebarOpen);
  const toggleSidebar = useLayoutStore(s => s.toggleSidebar);

  return (
    <div
      className="flex h-11 items-center border-b border-[var(--color-border)] bg-[var(--color-surface-0)]"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* macOS traffic light 占位 — 不放任何可点击元素 */}
      <div className="w-[68px] shrink-0" />
      <div className="shrink-0" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Toggle sidebar">
          {sidebarOpen ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
        </Button>
      </div>
      <span className="flex-1 text-center text-sm font-semibold select-none" style={{ color: 'var(--color-brand)' }}>
        Claude Code Best
      </span>
      {/* 右侧占位保持标题居中 */}
      <div className="w-[68px] shrink-0" />
    </div>
  );
}
