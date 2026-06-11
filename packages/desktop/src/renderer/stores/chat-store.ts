import { create } from 'zustand'

interface Session {
  id: string
  title: string
  updatedAt: string
}

interface ChatState {
  sessions: Session[]
  activeSessionId: string | null
  messages: unknown[]
  isStreaming: boolean
  createSession: () => void
  switchSession: (id: string) => void
}

export const useChatStore = create<ChatState>(set => ({
  sessions: [],
  activeSessionId: null,
  messages: [],
  isStreaming: false,
  createSession: () => {
    const id = crypto.randomUUID()
    set(s => ({
      sessions: [
        { id, title: '新对话', updatedAt: new Date().toISOString() },
        ...s.sessions,
      ],
      activeSessionId: id,
    }))
  },
  switchSession: id => set({ activeSessionId: id }),
}))
