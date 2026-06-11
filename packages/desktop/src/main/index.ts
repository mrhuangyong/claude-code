import { app } from 'electron'
import { createMainWindow } from './window'
import { registerIpcHandlers, type IpcContext } from './ipc/handlers'
import { CliProcessPool } from './cli-pool'
import { getConfigStore } from './store'
import { createTray } from './tray'
import { createAppMenu } from './menu'
import { registerGlobalShortcuts, unregisterGlobalShortcuts } from './shortcuts'
import { setupAutoUpdater } from './updater'

app.whenReady().then(() => {
  const mainWindow = createMainWindow()

  const cliPool = new CliProcessPool()
  const configStore = getConfigStore()

  const sessionStore = {
    _sessions: new Map<
      string,
      { id: string; title: string; createdAt: string; updatedAt: string }
    >(),
    listSessions() {
      return Array.from(sessionStore._sessions.values())
    },
    createSession(title?: string) {
      const id = crypto.randomUUID()
      const session = {
        id,
        title: title ?? '新对话',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      sessionStore._sessions.set(id, session)
      return session
    },
    deleteSession(id: string) {
      sessionStore._sessions.delete(id)
    },
    getHistory(id: string) {
      return null
    },
  }

  const ipcContext: IpcContext = {
    cliPool,
    getConfig: () => configStore.store as Record<string, unknown>,
    setConfig: (key, value) => {
      configStore.set(key, value)
    },
    sessionStore,
  }

  registerIpcHandlers(ipcContext)

  createTray(mainWindow)
  createAppMenu(mainWindow)
  registerGlobalShortcuts(mainWindow)
  setupAutoUpdater(mainWindow)

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

app.on('will-quit', () => {
  unregisterGlobalShortcuts()
})
