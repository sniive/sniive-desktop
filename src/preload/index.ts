import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api: any = {
  getVideoRecordingSources: (types: Array<'window' | 'screen'>) =>
    ipcRenderer.invoke('getVideoRecordingSource', types),

  useMenu: (template: string[]) => ipcRenderer.invoke('useMenu', template),

  isOSX: () => process.platform === 'darwin',
  isWindows: () => process.platform === 'win32',
  isLinux: () => /linux/.test(process.platform),
  getScreenAccess: () => ipcRenderer.invoke('getScreenAccess'),
  scriptStart: () => ipcRenderer.invoke('scriptStart'),
  scriptStop: () => ipcRenderer.invoke('scriptStop'),
  getLink: () => ipcRenderer.invoke('getLink'),

  close: () => ipcRenderer.invoke('close'),
  minimize: () => ipcRenderer.invoke('minimize'),
  resize: (arg: { width: number; height: number }) => ipcRenderer.invoke('resize', arg)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
