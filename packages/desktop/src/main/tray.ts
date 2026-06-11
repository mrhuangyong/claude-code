import { Tray, Menu, nativeImage } from 'electron'
import { join } from 'node:path'

export function createTray(mainWindow: Electron.BrowserWindow): Tray {
  const icon = nativeImage.createFromPath(
    join(__dirname, '../../resources/icon.png'),
  )
  const tray = new Tray(icon.resize({ width: 16, height: 16 }))

  tray.setToolTip('Claude Code Best')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
      },
    },
    {
      label: '新对话',
      click: () => {
        mainWindow.webContents.send('action:new-conversation')
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        mainWindow.close()
      },
    },
  ])

  tray.setContextMenu(contextMenu)
  tray.on('double-click', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  return tray
}
