import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

export enum BridgeFunctions {
  'getVideoRecordingSources' = 'getVideoRecordingSources',
  'useMenu' = 'useMenu',
  'isOSX' = 'isOSX',
  'isWindows' = 'isWindows',
  'isLinux' = 'isLinux',
  'getScreenAccess' = 'getScreenAccess',
  'scriptStart' = 'scriptStart',
  'scriptStop' = 'scriptStop',
  'isAuth' = 'isAuth',
  'close' = 'close',
  'minimize' = 'minimize',
  'resize' = 'resize',
  'handleCapture' = 'handleCapture'
}

// Custom APIs for renderer
// eslint-disable-next-line @typescript-eslint/ban-types
const api: Record<BridgeFunctions, Function> = {
  getVideoRecordingSources: (types: Array<'window' | 'screen'>) =>
    ipcRenderer.invoke('getVideoRecordingSource', types),
  useMenu: (template: string[]) => ipcRenderer.invoke('useMenu', template),

  isOSX: () => process.platform === 'darwin',
  isWindows: () => process.platform === 'win32',
  isLinux: () => /linux/.test(process.platform),
  getScreenAccess: () => ipcRenderer.invoke('getScreenAccess'),
  scriptStart: () => ipcRenderer.invoke('scriptStart'),
  scriptStop: () => ipcRenderer.invoke('scriptStop'),
  isAuth: () => ipcRenderer.invoke('isAuth'),

  close: () => ipcRenderer.invoke('close'),
  minimize: () => ipcRenderer.invoke('minimize'),
  resize: (arg: { width: number; height: number }) => ipcRenderer.invoke('resize', arg),

  handleCapture: (data: any) => ipcRenderer.invoke('handleCapture', data)
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
