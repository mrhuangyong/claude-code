import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  showNotification: (title: string, body: string) => {
    return ipcRenderer.invoke('show-notification', title, body);
  },
});

// 类型定义
declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => Promise<string>;
      showNotification: (title: string, body: string) => Promise<boolean>;
    };
  }
}