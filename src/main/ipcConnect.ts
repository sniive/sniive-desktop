import { is } from '@electron-toolkit/utils'
import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import {
  App,
  BrowserWindow,
  DesktopCapturerSource,
  desktopCapturer,
  ipcMain,
  systemPreferences
} from 'electron'
import { join } from 'path'
import { Auth, handleMenu } from './utils'
import axios from 'axios'
import { Buffer } from 'buffer'

type ConnectIpcParams = {
  mainWindow: BrowserWindow
  app: App
  scriptSubprocess: ChildProcessWithoutNullStreams | null
  killScriptSubprocess: (scriptSubprocess: ChildProcessWithoutNullStreams | null) => boolean
  auth: Auth
}

const domain = is.dev ? 'http://localhost:3000' : 'https://sniive.com'

export function connectIpc({
  mainWindow,
  scriptSubprocess,
  killScriptSubprocess,
  auth,
  app
}: ConnectIpcParams) {
  ipcMain.handle('scriptStart', async () => {
    if (scriptSubprocess === null || scriptSubprocess === undefined) {
      try {
        const extension = process.platform === 'win32' ? 'exe' : 'bin'
        const scriptPath = join(__dirname, `../../resources/script.${extension}`).replace(
          'app.asar',
          'app.asar.unpacked'
        )
        scriptSubprocess = spawn(scriptPath)
        scriptSubprocess.stdout.on('data', (data) => {
          mainWindow.webContents.send('scriptData', data.toString())
        })
        scriptSubprocess.stderr.on('data', (data) => {
          console.error(data.toString())
        })
        return true
      } catch (error) {
        console.error(error)
        return false
      }
    } else {
      return true
    }
  })

  ipcMain.handle('resize', (_, arg: { width: number; height: number }) => {
    const { width, height } = arg
    mainWindow.setResizable(true)
    mainWindow.setSize(Math.floor(width), Math.floor(height), true)
    mainWindow.setResizable(false)
  })

  ipcMain.handle(
    'getScreenAccess',
    () =>
      process.platform !== 'darwin' ||
      systemPreferences.getMediaAccessStatus('screen') === 'granted'
  )

  ipcMain.handle(
    'getVideoRecordingSource',
    async (_, types: Array<'window' | 'screen'>): Promise<DesktopCapturerSource | null> =>
      await desktopCapturer
        .getSources({ types })
        .then(async (sources) => {
          if (sources.length === 0) return null
          if (sources.length > 1) {
            const template = sources
              .filter((source) => source.id && source.name)
              .map((source) => source.name)
            const id = await handleMenu(template)
            if (id !== -1) {
              return sources[id]
            } else {
              return null
            }
          } else {
            return sources[0]
          }
        })
        .catch(() => null)
  )

  ipcMain.handle('useMenu', (_, template: string[]) => handleMenu(template))

  ipcMain.handle('scriptStop', () => killScriptSubprocess(scriptSubprocess))

  ipcMain.handle('close', () => {
    killScriptSubprocess(scriptSubprocess)
    app.quit()
  })

  ipcMain.handle('minimize', () => BrowserWindow.getFocusedWindow()?.minimize())

  ipcMain.handle('isAuth', () => {
    if (is.dev) return true
    return auth.access !== '' && auth.spaceName !== ''
  })

  ipcMain.handle('handleCapture', async (_, capture: { base64Image: string; data: string }) => {
    const requestContent = { ...capture, ...auth }
    const response = await axios
      .post<boolean>(`${domain}/api/dashboard/populateSpace`, requestContent, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .catch(() => null)

    if (response === null) {
      return false
    }

    return response.data
  })

  ipcMain.handle('handleAudio', async (_, audioBase64: string) => {
    const audioBuffer = Buffer.from(audioBase64, 'base64')
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' })

    const formData = new FormData()
    formData.append('audio', audioBlob, 'audio.webm')
    formData.append('spaceName', auth.spaceName)
    formData.append('access', auth.access)

    const response = await axios
      .post<boolean>(`${domain}/api/dashboard/uploadAudio`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress(progressEvent) {
          const progress = Math.round(progressEvent.loaded / (progressEvent.total ?? 1))
          mainWindow.webContents.send('uploadProgress', progress)
        }
      })
      .catch(() => null)

    if (response === null) {
      return false
    }

    return response.data
  })
}
