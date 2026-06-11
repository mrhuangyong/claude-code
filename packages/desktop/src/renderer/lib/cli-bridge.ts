const IPC_CHANNEL = 'desktop-api'

interface WindowApi {
  invoke: (channel: string, args?: unknown) => Promise<unknown>
  onStreamEvent: (
    callback: (data: { sessionId: string; event: unknown }) => void,
  ) => () => void
  channel: string
}

declare global {
  interface Window {
    api: WindowApi
  }
}

function getApi(): WindowApi {
  return window.api
}

class CliBridge {
  private streamListener:
    | ((data: { sessionId: string; event: unknown }) => void)
    | null = null

  async sendMessage(
    sessionId: string,
    content: string,
    attachments?: Array<{
      type: 'image' | 'file'
      name: string
      data: string
      mediaType?: string
    }>,
  ): Promise<{ success: boolean; sessionId: string }> {
    const api = getApi()

    // Set up stream listener
    if (!this.streamListener) {
      this.streamListener = () => {}
      api.onStreamEvent(data => {
        if (this.streamListener) {
          this.streamListener(data)
        }
      })
    }

    return api.invoke(`${IPC_CHANNEL}:chat.sendMessage`, {
      sessionId,
      content,
      attachments,
    }) as Promise<{ success: boolean; sessionId: string }>
  }

  onStreamEvent(
    callback: (data: { sessionId: string; event: unknown }) => void,
  ): void {
    this.streamListener = callback
  }

  async abortStream(sessionId: string): Promise<{ success: boolean }> {
    return getApi().invoke(`${IPC_CHANNEL}:chat.abort`, {
      sessionId,
    }) as Promise<{ success: boolean }>
  }

  async getConfig(): Promise<Record<string, unknown>> {
    return getApi().invoke(`${IPC_CHANNEL}:config.get`) as Promise<
      Record<string, unknown>
    >
  }

  async setConfig(
    config: Record<string, unknown>,
  ): Promise<{ success: boolean }> {
    return getApi().invoke(`${IPC_CHANNEL}:config.set`, config) as Promise<{
      success: boolean
    }>
  }

  async listSessions(): Promise<
    Array<{ id: string; title: string; updatedAt: string }>
  > {
    return getApi().invoke(`${IPC_CHANNEL}:session.list`) as Promise<
      Array<{ id: string; title: string; updatedAt: string }>
    >
  }

  async createSession(): Promise<{
    id: string
    title: string
    createdAt: string
    updatedAt: string
  }> {
    return getApi().invoke(`${IPC_CHANNEL}:session.create`) as Promise<{
      id: string
      title: string
      createdAt: string
      updatedAt: string
    }>
  }

  async deleteSession(id: string): Promise<{ success: boolean }> {
    return getApi().invoke(`${IPC_CHANNEL}:session.delete`, { id }) as Promise<{
      success: boolean
    }>
  }

  async getHistory(id: string): Promise<unknown> {
    return getApi().invoke(`${IPC_CHANNEL}:session.getHistory`, { id })
  }
}

export const cliBridge = new CliBridge()

export interface CliStreamEvent {
  type: string
  id?: string
  delta?: { text?: string }
  block?: { type: string; text?: string }
  tool?: string
  input?: Record<string, unknown>
  output?: string
  error?: string
  message?: {
    role: string
    content: Array<{
      type: string
      text?: string
      name?: string
      input?: Record<string, unknown>
    }>
    model?: string
    usage?: { input_tokens: number; output_tokens: number }
  }
}
