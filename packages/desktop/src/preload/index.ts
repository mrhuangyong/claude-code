import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const IPC_CHANNEL = 'desktop-api'

const api = {
  invoke: (channel: string, args?: unknown) =>
    ipcRenderer.invoke(channel, args),
  onStreamEvent: (
    callback: (data: { sessionId: string; event: unknown }) => void,
  ) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      data: { sessionId: string; event: unknown },
    ) => callback(data)
    ipcRenderer.on(`${IPC_CHANNEL}:chat.streamEvent`, handler)
    return () => {
      ipcRenderer.removeListener(`${IPC_CHANNEL}:chat.streamEvent`, handler)
    }
  },
  channel: IPC_CHANNEL,
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error dev fallback
  window.electron = electronAPI
  // @ts-expect-error dev fallback
  window.api = api
}
