import * as React from 'react';
import { useEffect, useRef, useCallback } from 'react';
import { useStickToBottom } from 'use-stick-to-bottom';
import { UserMessage } from './UserMessage';
import { AssistantMessage } from './AssistantMessage';
import { ThinkingBlock } from './ThinkingBlock';
import { ToolCallCard } from './ToolCallCard';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  thinkingContent?: string;
  toolCalls?: Array<{
    tool: string;
    input: Record<string, unknown>;
    output?: string;
    status: 'running' | 'success' | 'error';
  }>;
  attachments?: Array<{ name: string; type: string }>;
}

export interface MessageListProps {
  messages: ChatMessage[];
}

function ThinkingIndicator(): React.ReactElement {
  return (
    <div className="flex justify-start px-4 py-3">
      <div className="flex items-center gap-1.5">
        <span
          className="h-2 w-2 rounded-full bg-[var(--color-text-tertiary)] animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="h-2 w-2 rounded-full bg-[var(--color-text-tertiary)] animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="h-2 w-2 rounded-full bg-[var(--color-text-tertiary)] animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </div>
    </div>
  );
}

function ScrollableMessageList({ messages }: MessageListProps): React.ReactElement {
  const { scrollRef, contentRef } = useStickToBottom();

  const isStreaming = messages.some(m => m.isStreaming);
  const lastMessage = messages[messages.length - 1];
  const showThinkingIndicator = isStreaming && lastMessage?.role === 'user';

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <div ref={contentRef} className="py-4 flex flex-col gap-2 min-h-full">
        {messages.map(msg => (
          <React.Fragment key={msg.id}>
            {msg.role === 'user' ? (
              <UserMessage content={msg.content} attachments={msg.attachments} />
            ) : (
              <>
                {msg.thinkingContent && <ThinkingBlock content={msg.thinkingContent} />}
                <AssistantMessage content={msg.content} isStreaming={msg.isStreaming} />
                {msg.toolCalls?.map((tc, idx) => (
                  <ToolCallCard
                    key={`${msg.id}-tool-${idx}`}
                    tool={tc.tool}
                    input={tc.input}
                    output={tc.output}
                    status={tc.status}
                  />
                ))}
              </>
            )}
          </React.Fragment>
        ))}
        {showThinkingIndicator && <ThinkingIndicator />}
      </div>
    </div>
  );
}

function FallbackMessageList({ messages }: MessageListProps): React.ReactElement {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const isStreaming = messages.some(m => m.isStreaming);
  const lastMessage = messages[messages.length - 1];
  const showThinkingIndicator = isStreaming && lastMessage?.role === 'user';

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      <div className="py-4 flex flex-col gap-2 min-h-full">
        {messages.map(msg => (
          <React.Fragment key={msg.id}>
            {msg.role === 'user' ? (
              <UserMessage content={msg.content} attachments={msg.attachments} />
            ) : (
              <>
                {msg.thinkingContent && <ThinkingBlock content={msg.thinkingContent} />}
                <AssistantMessage content={msg.content} isStreaming={msg.isStreaming} />
                {msg.toolCalls?.map((tc, idx) => (
                  <ToolCallCard
                    key={`${msg.id}-tool-${idx}`}
                    tool={tc.tool}
                    input={tc.input}
                    output={tc.output}
                    status={tc.status}
                  />
                ))}
              </>
            )}
          </React.Fragment>
        ))}
        {showThinkingIndicator && <ThinkingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export function MessageList(props: MessageListProps): React.ReactElement {
  // use-stick-to-bottom is available, use it directly
  return <ScrollableMessageList {...props} />;
}

export { FallbackMessageList };
