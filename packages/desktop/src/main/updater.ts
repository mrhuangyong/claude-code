import { autoUpdater } from 'electron-updater'
import { BrowserWindow } from 'electron'
import { is } from '@electron-toolkit/utils'

export function setupAutoUpdater(mainWindow: BrowserWindow): void {
  // Only check for updates in production
  if (is.dev) return

  autoUpdater.autoDownload = false

  autoUpdater.on('update-available', info => {
    mainWindow.webContents.send('update:available', info)
  })

  autoUpdater.on('download-progress', progress => {
    mainWindow.webContents.send('update:progress', progress)
  })

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update:downloaded')
  })

  autoUpdater.on('error', err => {
    console.error('[AutoUpdater] Error:', err.message)
  })

  autoUpdater.checkForUpdates()
}
