export interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  showNotification: (title: string, body: string) => Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
