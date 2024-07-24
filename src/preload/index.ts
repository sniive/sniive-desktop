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
  'getLocale' = 'getLocale',
  'close' = 'close',
  'minimize' = 'minimize',
  'resize' = 'resize',
  'handleCapture' = 'handleCapture',
  'handleAudio' = 'handleAudio',
  'handleMetadata' = 'handleMetadata'
}

// Custom APIs for renderer
// eslint-disable-next-line @typescript-eslint/ban-types
const api: Record<BridgeFunctions, Function> = {
  getVideoRecordingSources: () => ipcRenderer.invoke('getVideoRecordingSource'),
  useMenu: (template: string[]) => ipcRenderer.invoke('useMenu', template),

  isOSX: () => process.platform === 'darwin',
  isWindows: () => process.platform === 'win32',
  isLinux: () => /linux/.test(process.platform),
  getScreenAccess: () => ipcRenderer.invoke('getScreenAccess'),
  scriptStart: (displayString: string) => ipcRenderer.invoke('scriptStart', displayString),
  scriptStop: () => ipcRenderer.invoke('scriptStop'),
  isAuth: () => ipcRenderer.invoke('isAuth'),
  getLocale: () => ipcRenderer.invoke('getLocale'),

  close: () => ipcRenderer.invoke('close'),
  minimize: () => ipcRenderer.invoke('minimize'),
  resize: (arg: { width: number; height: number }) => ipcRenderer.invoke('resize', arg),

  handleCapture: (data: { base64Image: string; data: string }) =>
    ipcRenderer.invoke('handleCapture', data),
  handleAudio: (wavBuffer: ArrayBuffer) => ipcRenderer.invoke('handleAudio', wavBuffer),
  handleMetadata: (metadata: { recordingStartTime: number; recordingEndTime: number }) =>
    ipcRenderer.invoke('handleMetadata', metadata)
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
