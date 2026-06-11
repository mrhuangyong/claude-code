import { globalShortcut, BrowserWindow } from 'electron'

export function registerGlobalShortcuts(mainWindow: BrowserWindow): void {
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

export function unregisterGlobalShortcuts(): void {
  globalShortcut.unregisterAll()
}
