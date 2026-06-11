import { create } from 'zustand'
import { cliBridge } from '@renderer/lib/cli-bridge'
import type { CliStreamEvent } from '../../main/cli-protocol'

export interface ToolCall {
  tool: string
  input: Record<string, unknown>
  output?: string
  status: 'running' | 'success' | 'error'
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  isStreaming?: boolean
  thinkingContent?: string
  toolCalls?: ToolCall[]
  attachments?: Array<{ name: string; type: string }>
  model?: string
  usage?: { inputTokens: number; outputTokens: number }
}

export interface Session {
  id: string
  title: string
  updatedAt: string
}

interface ChatState {
  sessions: Session[]
  activeSessionId: string | null
  messages: ChatMessage[]
  isStreaming: boolean
  model: string

  // Session management
  loadSessions: () => Promise<void>
  createSession: () => Promise<void>
  deleteSession: (id: string) => Promise<void>
  switchSession: (id: string) => Promise<void>

  // Chat
  sendMessage: (
    content: string,
    attachments?: Array<{
      name: string
      type: string
      data: string
      mediaType?: string
    }>,
  ) => Promise<void>
  abortStream: () => Promise<void>
  setModel: (model: string) => void

  // Internal
  handleStreamEvent: (event: CliStreamEvent) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  messages: [],
  isStreaming: false,
  model: 'claude-sonnet-4-6',

  loadSessions: async () => {
    try {
      const result = await cliBridge.listSessions()
      const sessions: Session[] = result.map(s => ({
        id: s.id,
        title: '新对话',
        updatedAt: new Date(s.createdAt).toISOString(),
      }))
      set({ sessions })
    } catch {
      // If the bridge is unavailable (e.g. outside Electron), silently ignore
    }
  },

  createSession: async () => {
    try {
      const result = await cliBridge.createSession()
      const id = result.id
      set(state => ({
        sessions: [
          { id, title: '新对话', updatedAt: new Date().toISOString() },
          ...state.sessions,
        ],
        activeSessionId: id,
        messages: [],
        isStreaming: false,
      }))
    } catch {
      // Fallback: create a local-only session
      const id = crypto.randomUUID()
      set(state => ({
        sessions: [
          { id, title: '新对话', updatedAt: new Date().toISOString() },
          ...state.sessions,
        ],
        activeSessionId: id,
        messages: [],
        isStreaming: false,
      }))
    }
  },

  deleteSession: async (id: string) => {
    try {
      await cliBridge.deleteSession(id)
    } catch {
      // Continue with local deletion even if remote fails
    }
    set(state => {
      const sessions = state.sessions.filter(s => s.id !== id)
      const isActive = state.activeSessionId === id
      return {
        sessions,
        ...(isActive
          ? {
              activeSessionId: sessions.length > 0 ? sessions[0].id : null,
              messages: [],
              isStreaming: false,
            }
          : {}),
      }
    })
  },

  switchSession: async (id: string) => {
    set({ activeSessionId: id, isStreaming: false })

    try {
      const history = await cliBridge.getHistory(id)
      if (history) {
        const messages: ChatMessage[] = history.map((entry, idx) => ({
          id: `${id}-${idx}`,
          role: entry.role as 'user' | 'assistant',
          content: entry.content,
          timestamp: new Date().toISOString(),
        }))
        set({ messages })
      } else {
        set({ messages: [] })
      }
    } catch {
      set({ messages: [] })
    }
  },

  sendMessage: async (
    content: string,
    attachments?: Array<{
      name: string
      type: string
      data: string
      mediaType?: string
    }>,
  ) => {
    const state = get()
    let sessionId = state.activeSessionId

    // Auto-create session if none active
    if (!sessionId) {
      try {
        const result = await cliBridge.createSession()
        sessionId = result.id
        set(state => ({
          sessions: [
            {
              id: sessionId!,
              title: '新对话',
              updatedAt: new Date().toISOString(),
            },
            ...state.sessions,
          ],
          activeSessionId: sessionId,
        }))
      } catch {
        sessionId = crypto.randomUUID()
        set(state => ({
          sessions: [
            {
              id: sessionId!,
              title: '新对话',
              updatedAt: new Date().toISOString(),
            },
            ...state.sessions,
          ],
          activeSessionId: sessionId,
        }))
      }
    }

    const userMessage: ChatMessage = {
      id: `${sessionId}-user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      attachments: attachments?.map(a => ({ name: a.name, type: a.type })),
    }

    const assistantMessage: ChatMessage = {
      id: `${sessionId}-assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
      toolCalls: [],
    }

    set(state => ({
      messages: [...state.messages, userMessage, assistantMessage],
      isStreaming: true,
    }))

    // Update session title from first message
    const isFirstMessage = state.messages.length === 0
    if (isFirstMessage) {
      const title = content.length > 30 ? `${content.slice(0, 30)}...` : content
      set(state => ({
        sessions: state.sessions.map(s =>
          s.id === sessionId
            ? { ...s, title, updatedAt: new Date().toISOString() }
            : s,
        ),
      }))
    }

    try {
      // Build attachments in the format expected by the CLI
      const cliAttachments = attachments?.map(a => ({
        type: a.type as 'image' | 'file',
        name: a.name,
        data: a.data,
        mediaType: a.mediaType,
      }))

      await cliBridge.sendMessage(sessionId, content, cliAttachments)
    } catch (error) {
      // Mark assistant message as error
      set(state => ({
        messages: state.messages.map(m =>
          m.id === assistantMessage.id
            ? {
                ...m,
                isStreaming: false,
                content:
                  m.content ||
                  `发送失败: ${error instanceof Error ? error.message : String(error)}`,
              }
            : m,
        ),
        isStreaming: false,
      }))
    }
  },

  abortStream: async () => {
    const state = get()
    if (!state.activeSessionId) return

    try {
      await cliBridge.abortStream(state.activeSessionId)
    } catch {
      // Ignore abort errors
    }

    // Mark all streaming messages as complete
    set(state => ({
      messages: state.messages.map(m =>
        m.isStreaming ? { ...m, isStreaming: false } : m,
      ),
      isStreaming: false,
    }))
  },

  setModel: (model: string) => {
    set({ model })
  },

  handleStreamEvent: (event: CliStreamEvent) => {
    set(state => {
      const streamingMsg = [...state.messages]
        .reverse()
        .find(m => m.role === 'assistant' && m.isStreaming)

      if (!streamingMsg) return state

      const updatedMessages = state.messages.map(m => {
        if (m.id !== streamingMsg.id) return m

        const updated = { ...m }

        switch (event.type) {
          case 'content_block_delta': {
            if (event.delta?.text) {
              updated.content = m.content + event.delta.text
            }
            break
          }

          case 'content_block_start': {
            if (event.block?.type === 'thinking' && event.block.text) {
              updated.thinkingContent =
                (updated.thinkingContent ?? '') + event.block.text
            }
            break
          }

          case 'content_block_stop': {
            break
          }

          case 'tool_use': {
            if (event.tool && event.input) {
              const toolCalls = [...(updated.toolCalls ?? [])]
              toolCalls.push({
                tool: event.tool,
                input: event.input,
                status: 'running',
              })
              updated.toolCalls = toolCalls
            }
            break
          }

          case 'tool_result': {
            if (updated.toolCalls && updated.toolCalls.length > 0) {
              const toolCalls = [...updated.toolCalls]
              const lastRunning = toolCalls.findIndex(
                tc => tc.status === 'running',
              )
              if (lastRunning >= 0) {
                toolCalls[lastRunning] = {
                  ...toolCalls[lastRunning],
                  output: event.output,
                  status: event.error ? 'error' : 'success',
                }
              }
              updated.toolCalls = toolCalls
            }
            break
          }

          case 'message_stop': {
            updated.isStreaming = false
            if (event.message?.model) {
              updated.model = event.message.model
            }
            if (event.message?.usage) {
              updated.usage = {
                inputTokens: event.message.usage.input_tokens,
                outputTokens: event.message.usage.output_tokens,
              }
            }
            break
          }

          case 'error': {
            updated.isStreaming = false
            updated.content = m.content || `错误: ${event.error ?? '未知错误'}`
            break
          }

          default:
            break
        }

        return updated
      })

      // Check if any assistant message is still streaming
      const stillStreaming = updatedMessages.some(m => m.isStreaming)

      return {
        messages: updatedMessages,
        isStreaming: stillStreaming,
      }
    })
  },
}))
