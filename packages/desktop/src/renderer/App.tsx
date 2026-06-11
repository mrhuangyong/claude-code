import React from 'react';
import { TitleBar } from '@renderer/components/layout/TitleBar';
import { Sidebar } from '@renderer/components/layout/Sidebar';
import { AppLayout } from '@renderer/components/layout/AppLayout';
import { ChatView } from '@renderer/components/chat/ChatView';
import { useChatStore } from '@renderer/stores/chat-store';
import { useLayoutStore } from '@renderer/stores/layout-store';

export function App(): React.ReactElement {
  const sessions = useChatStore(s => s.sessions);
  const activeSessionId = useChatStore(s => s.activeSessionId);
  const createSession = useChatStore(s => s.createSession);
  const switchSession = useChatStore(s => s.switchSession);
  const deleteSession = useChatStore(s => s.deleteSession);
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
        <ChatView />
      </AppLayout>
    </div>
  );
}
