import { app } from 'electron'
import { createMainWindow } from './window'

app.whenReady().then(() => {
  createMainWindow()

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
