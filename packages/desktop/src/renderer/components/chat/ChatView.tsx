import React from 'react';
import { MessageSquare, Sparkles } from 'lucide-react';
import { MessageList } from './MessageList';
import type { ChatMessage } from './MessageList';
import { ChatInput } from './ChatInput';
import type { AttachedFile } from './FileUploader';
import { useChatStore } from '@renderer/stores/chat-store';

export function ChatView(): React.ReactElement {
  const activeSessionId = useChatStore(s => s.activeSessionId);
  const messages = useChatStore(s => s.messages);
  const isStreaming = useChatStore(s => s.isStreaming);
  const model = useChatStore(s => s.model);
  const sendMessage = useChatStore(s => s.sendMessage);
  const abortStream = useChatStore(s => s.abortStream);
  const setModel = useChatStore(s => s.setModel);

  if (!activeSessionId) {
    return <WelcomeScreen />;
  }

  // Adapt store messages to the ChatMessage interface expected by MessageList
  const chatMessages: ChatMessage[] = messages.map(m => ({
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: m.timestamp,
    isStreaming: m.isStreaming,
    thinkingContent: m.thinkingContent,
    toolCalls: m.toolCalls,
    attachments: m.attachments,
  }));

  const handleSend = (content: string, attachments?: AttachedFile[]): void => {
    sendMessage(
      content,
      attachments?.map(a => ({
        name: a.name,
        type: a.type,
        data: a.data,
        mediaType: a.mediaType,
      })),
    );
  };

  return (
    <div className="flex h-full flex-col">
      <MessageList messages={chatMessages} />
      <div className="shrink-0 border-t border-[var(--color-border)] p-4">
        <ChatInput
          onSend={handleSend}
          onAbort={abortStream}
          isStreaming={isStreaming}
          model={model}
          onModelChange={setModel}
        />
      </div>
    </div>
  );
}

function WelcomeScreen(): React.ReactElement {
  const createSession = useChatStore(s => s.createSession);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="mb-4 flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-[var(--color-surface-1)]">
            <Sparkles className="size-8 text-[var(--color-brand)]" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Claude Code Desktop</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          AI 辅助编程助手，支持代码编写、调试、重构等任务
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: 'var(--color-brand)' }}
            onClick={() => {
              createSession();
            }}
          >
            <MessageSquare className="size-4" />
            开始新对话
          </button>
          <p className="text-xs text-[var(--color-text-tertiary)]">或使用左侧边栏的「新建对话」按钮</p>
        </div>
      </div>
    </div>
  );
}
