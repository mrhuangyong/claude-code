import React from 'react';
import { TitleBar } from '@renderer/components/layout/TitleBar';
import { Sidebar } from '@renderer/components/layout/Sidebar';
import { AppLayout } from '@renderer/components/layout/AppLayout';
import { useChatStore } from '@renderer/stores/chat-store';
import { useLayoutStore } from '@renderer/stores/layout-store';
import { MessageSquare } from 'lucide-react';

export function App(): React.ReactElement {
  const sessions = useChatStore(s => s.sessions);
  const activeSessionId = useChatStore(s => s.activeSessionId);
  const createSession = useChatStore(s => s.createSession);
  const switchSession = useChatStore(s => s.switchSession);
  const sidebarOpen = useLayoutStore(s => s.sidebarOpen);

  return (
    <div className="flex h-screen w-screen flex-col">
      <TitleBar />
      <AppLayout
        sidebarContent={
          <Sidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={switchSession}
            onCreateSession={createSession}
            onOpenSettings={() => {
              // TODO: open settings dialog
            }}
          />
        }
      >
        <div className="flex h-full items-center justify-center">
          {activeSessionId ? (
            <div className="text-center">
              <p className="text-[var(--color-text-secondary)]">对话区域（后续任务实现）</p>
            </div>
          ) : (
            <div className="text-center">
              <MessageSquare className="mx-auto mb-3 size-10 text-[var(--color-text-tertiary)]" />
              <p className="text-sm text-[var(--color-text-secondary)]">
                {sidebarOpen ? '点击「新建对话」开始' : '开始新对话'}
              </p>
              {!sidebarOpen && (
                <button
                  type="button"
                  className="mt-3 text-sm font-medium"
                  style={{ color: 'var(--color-brand)' }}
                  onClick={createSession}
                >
                  新建对话
                </button>
              )}
            </div>
          )}
        </div>
      </AppLayout>
    </div>
  );
}
