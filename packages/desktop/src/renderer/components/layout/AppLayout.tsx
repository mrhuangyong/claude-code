import React from 'react';
import { Separator } from '@renderer/components/ui/separator';
import { useLayoutStore } from '@renderer/stores/layout-store';
import { cn } from '@renderer/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  sidebarContent?: React.ReactNode;
  artifactsPanel?: React.ReactNode;
}

export function AppLayout({ children, sidebarContent, artifactsPanel }: AppLayoutProps): React.ReactElement {
  const sidebarOpen = useLayoutStore(s => s.sidebarOpen);
  const sidebarWidth = useLayoutStore(s => s.sidebarWidth);
  const artifactsOpen = useLayoutStore(s => s.artifactsOpen);
  const artifactsWidth = useLayoutStore(s => s.artifactsWidth);

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Sidebar */}
      {sidebarOpen && (
        <>
          <div className="shrink-0 overflow-hidden" style={{ width: sidebarWidth }}>
            {sidebarContent}
          </div>
          <Separator orientation="vertical" />
        </>
      )}

      {/* Main content */}
      <div className={cn('flex-1 overflow-auto', !artifactsOpen && !sidebarOpen && 'w-full')}>{children}</div>

      {/* Artifacts panel */}
      {artifactsOpen && (
        <>
          <Separator orientation="vertical" />
          <div className="shrink-0 overflow-auto" style={{ width: artifactsWidth }}>
            {artifactsPanel}
          </div>
        </>
      )}
    </div>
  );
}
