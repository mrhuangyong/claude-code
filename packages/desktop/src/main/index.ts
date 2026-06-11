import { app } from 'electron'
import { createMainWindow } from './window'
import { createIPCHandler } from 'electron-trpc/main'
import { appRouter } from './ipc/router'
import type { AppContext } from './ipc/context'
import { CliProcessPool } from './cli-pool'
import { getConfigStore } from './store'

function createSessionStore(): AppContext['sessionStore'] {
  const sessions = new Map<
    string,
    {
      id: string
      createdAt: number
      history: Array<{ role: string; content: string }>
    }
  >()

  return {
    listSessions() {
      return Array.from(sessions.values())
    },
    createSession() {
      const id = crypto.randomUUID()
      sessions.set(id, { id, createdAt: Date.now(), history: [] })
      return id
    },
    deleteSession(id: string) {
      sessions.delete(id)
    },
    getHistory(id: string) {
      const session = sessions.get(id)
      return session?.history ?? null
    },
  }
}

app.whenReady().then(() => {
  const mainWindow = createMainWindow()

  const cliPool = new CliProcessPool()
  const configStore = getConfigStore()
  const sessionStore = createSessionStore()

  const context: AppContext = {
    cliPool,
    configStore,
    sessionStore,
  }

  createIPCHandler({
    router: appRouter,
    createContext: async () => context,
    windows: [mainWindow],
  })

  app.on('activate', () => {
    if (process.platform === 'darwin') {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
