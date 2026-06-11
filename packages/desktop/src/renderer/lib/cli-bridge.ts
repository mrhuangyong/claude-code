import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { ipcLink } from 'electron-trpc/renderer'
import type { AppRouter } from '../../main/ipc/router'
import type { CliStreamEvent } from '../../main/cli-protocol'

type AppRouterType = AppRouter

/**
 * Renderer-side API client that communicates with the main process.
 *
 * Uses electron-trpc's ipcLink to tunnel tRPC calls over Electron IPC.
 * Falls back to a no-op client when running outside Electron (e.g. storybook).
 */
class CliBridge {
  private client: ReturnType<typeof createTRPCClient<AppRouterType>> | null =
    null

  private getClient(): ReturnType<typeof createTRPCClient<AppRouterType>> {
    if (this.client) return this.client

    // Check if we are inside Electron with electronTRPC exposed by the preload script
    const hasElectronTRPC =
      typeof globalThis !== 'undefined' && 'electronTRPC' in globalThis

    if (hasElectronTRPC) {
      this.client = createTRPCClient<AppRouterType>({
        links: [ipcLink()],
      })
    } else {
      // Fallback: create a dummy client that throws on any call.
      // This keeps the UI functional for development outside Electron.
      this.client = createTRPCClient<AppRouterType>({
        links: [
          httpBatchLink({
            url: 'http://localhost:0',
          }),
        ],
      })
    }

    return this.client
  }

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
    return this.getClient().chat.sendMessage.mutate({
      id: sessionId,
      content,
      attachments,
    })
  }

  async abortStream(sessionId: string): Promise<{ success: boolean }> {
    return this.getClient().chat.abort.mutate({ id: sessionId })
  }

  async getConfig(): Promise<{
    provider: string
    apiKeys: Record<string, string>
    model: string
    baseUrl: string
    theme: string
    fontSize: number
    language: string
    sendOnEnter: boolean
  }> {
    return this.getClient().config.get.query()
  }

  async setConfig(
    config: Partial<{
      provider: string
      apiKeys: Record<string, string>
      model: string
      baseUrl: string
      theme: string
      fontSize: number
      language: string
      sendOnEnter: boolean
    }>,
  ): Promise<{ success: boolean }> {
    return this.getClient().config.set.mutate(config)
  }

  async listSessions(): Promise<Array<{ id: string; createdAt: number }>> {
    return this.getClient().session.list.query()
  }

  async createSession(): Promise<{ id: string }> {
    return this.getClient().session.create.mutate()
  }

  async deleteSession(id: string): Promise<{ success: boolean }> {
    return this.getClient().session.delete.mutate({ id })
  }

  async getHistory(
    id: string,
  ): Promise<Array<{ role: string; content: string }> | null> {
    return this.getClient().session.getHistory.query({ id })
  }
}

export const cliBridge = new CliBridge()
export type { CliStreamEvent }
