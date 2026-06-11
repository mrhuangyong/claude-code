import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { exposeElectronTRPC } from 'electron-trpc/main'

const api = {}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    exposeElectronTRPC()
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error dev fallback
  window.electron = electronAPI
  // @ts-expect-error dev fallback
  window.api = api
}
