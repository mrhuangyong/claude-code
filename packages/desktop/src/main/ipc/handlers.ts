import { ipcMain } from 'electron'
import type { CliProcessPool } from '../cli-pool'
import type { CliMessage, CliStreamEvent } from '../cli-protocol'

const IPC_CHANNEL = 'desktop-api'

export interface IpcContext {
  cliPool: CliProcessPool
  getConfig: () => Record<string, unknown>
  setConfig: (key: string, value: unknown) => void
  sessionStore: {
    listSessions: () => Array<{ id: string; title: string; updatedAt: string }>
    createSession: (title?: string) => {
      id: string
      title: string
      createdAt: string
      updatedAt: string
    }
    deleteSession: (id: string) => void
    getHistory: (id: string) => unknown
  }
}

export function registerIpcHandlers(ctx: IpcContext): void {
  // Chat: send message
  ipcMain.handle(
    `${IPC_CHANNEL}:chat.sendMessage`,
    async (
      _event,
      args: {
        sessionId: string
        content: string
        attachments?: CliMessage['attachments']
      },
    ) => {
      const { sessionId, content, attachments } = args

      if (!ctx.cliPool.has(sessionId)) {
        await ctx.cliPool.spawn(sessionId)
      }

      const senderWebContents = _event.sender

      ctx.cliPool.onData(sessionId, (event: CliStreamEvent) => {
        if (!senderWebContents.isDestroyed()) {
          senderWebContents.send(`${IPC_CHANNEL}:chat.streamEvent`, {
            sessionId,
            event,
          })
        }
      })

      const message: CliMessage = {
        type: 'user_message',
        content,
        ...(attachments ? { attachments } : {}),
      }

      await ctx.cliPool.send(sessionId, message)

      return { success: true, sessionId }
    },
  )

  // Chat: abort stream
  ipcMain.handle(
    `${IPC_CHANNEL}:chat.abort`,
    async (_event, args: { sessionId: string }) => {
      await ctx.cliPool.kill(args.sessionId).catch(() => {})
      return { success: true }
    },
  )

  // Config: get
  ipcMain.handle(`${IPC_CHANNEL}:config.get`, async () => {
    return ctx.getConfig()
  })

  // Config: set
  ipcMain.handle(
    `${IPC_CHANNEL}:config.set`,
    async (_event, args: Record<string, unknown>) => {
      for (const [key, value] of Object.entries(args)) {
        if (value !== undefined) {
          ctx.setConfig(key, value)
        }
      }
      return { success: true }
    },
  )

  // Session: list
  ipcMain.handle(`${IPC_CHANNEL}:session.list`, async () => {
    return ctx.sessionStore.listSessions()
  })

  // Session: create
  ipcMain.handle(`${IPC_CHANNEL}:session.create`, async () => {
    return ctx.sessionStore.createSession()
  })

  // Session: delete
  ipcMain.handle(
    `${IPC_CHANNEL}:session.delete`,
    async (_event, args: { id: string }) => {
      await ctx.cliPool.kill(args.id).catch(() => {})
      ctx.sessionStore.deleteSession(args.id)
      return { success: true }
    },
  )

  // Session: getHistory
  ipcMain.handle(
    `${IPC_CHANNEL}:session.getHistory`,
    async (_event, args: { id: string }) => {
      return ctx.sessionStore.getHistory(args.id)
    },
  )
}
