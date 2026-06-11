import React from 'react';
import { Button } from '@renderer/components/ui/button';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { Separator } from '@renderer/components/ui/separator';
import { Input } from '@renderer/components/ui/input';
import { Plus, Search, Settings, MessageSquare } from 'lucide-react';
import { cn } from '@renderer/lib/utils';

interface Session {
  id: string;
  title: string;
  updatedAt: string;
}

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onOpenSettings: () => void;
}

export function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onOpenSettings,
}: SidebarProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredSessions = sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex h-full flex-col bg-[var(--color-surface-1)]">
      <div className="p-2">
        <Button className="w-full justify-start gap-2" onClick={onCreateSession}>
          <Plus className="size-4" />
          新建对话
        </Button>
      </div>

      <div className="px-2 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <Input
            className="h-8 pl-8 text-xs"
            placeholder="搜索对话..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <div className="p-1">
          {filteredSessions.length === 0 && (
            <div className="px-3 py-8 text-center text-xs text-[var(--color-text-tertiary)]">
              {sessions.length === 0 ? '暂无对话' : '无匹配结果'}
            </div>
          )}
          {filteredSessions.map(session => (
            <button
              type="button"
              key={session.id}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                session.id === activeSessionId
                  ? 'bg-[var(--color-surface-2)] text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]',
              )}
              onClick={() => onSelectSession(session.id)}
            >
              <MessageSquare className="size-3.5 shrink-0" />
              <span className="truncate">{session.title}</span>
            </button>
          ))}
        </div>
      </ScrollArea>

      <Separator />

      <div className="p-2">
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={onOpenSettings}>
          <Settings className="size-4" />
          设置
        </Button>
      </div>
    </div>
  );
}
