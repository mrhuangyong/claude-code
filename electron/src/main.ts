import { app, BrowserWindow, ipcMain, Tray, Menu, Notification, nativeImage } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../src/index.html'));
  }
};

const createTray = () => {
  try {
    // 创建系统托盘图标
    const iconPath = path.join(__dirname, '../src/assets/icon.svg');
    tray = new Tray(nativeImage.createFromPath(iconPath));
  } catch (error) {
    // 如果图标文件不存在，使用默认图标
    tray = new Tray(nativeImage.createEmpty());
  }
  
  // 创建托盘菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        if (!mainWindow) createWindow();
        mainWindow?.show();
      },
    },
    {
      label: '退出应用',
      click: () => app.quit(),
    },
  ]);
  
  // 设置托盘提示和菜单
  tray.setToolTip('Claude Code Best');
  tray.setContextMenu(contextMenu);
  
  // 托盘点击事件
  tray.on('click', () => {
    if (!mainWindow) createWindow();
    mainWindow?.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
};

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 防止应用在关闭窗口后退出
app.on('window-all-closed', (e) => {
  if (process.platform !== 'darwin') {
    // 阻止默认行为，让应用保持运行
    e.preventDefault();
    // 隐藏所有窗口但不退出应用
    BrowserWindow.getAllWindows().forEach(window => window.hide());
  }
});

// 处理通知请求
ipcMain.handle('show-notification', (_, title: string, body: string) => {
  new Notification({
    title,
    body,
    icon: path.join(__dirname, '../src/assets/icon.svg'),
  }).show();
  return true;
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});