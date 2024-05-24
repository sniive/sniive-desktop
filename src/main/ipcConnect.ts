import { is } from '@electron-toolkit/utils'
import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import {
  App,
  BrowserWindow,
  DesktopCapturerSource,
  Menu,
  desktopCapturer,
  ipcMain,
  systemPreferences
} from 'electron'
import { join } from 'path'
import { Auth } from './utils'
import axios from 'axios'
import { Buffer } from 'buffer'

type ConnectIpcParams = {
  mainWindow: BrowserWindow
  app: App
  scriptSubprocess: ChildProcessWithoutNullStreams | null
  killScriptSubprocess: (scriptSubprocess: ChildProcessWithoutNullStreams | null) => boolean
  auth: Auth
}

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
        const scriptPath = join(__dirname, '../../resources/script.bin').replace(
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
        .getSources({ types, fetchWindowIcons: true })
        .then((sources) => (sources.length > 0 ? sources[0] : null))
        .catch(() => null)
  )

  ipcMain.handle('useMenu', async (_, template: string[]) => {
    let result: any = null
    let menuClosed = false

    const templateWithClick = template.map((label, index) => ({
      label,
      click: (): void => {
        result = index
      }
    }))
    const menu = Menu.buildFromTemplate(templateWithClick)
    menu.popup()
    menu.on('menu-will-close', () => {
      menuClosed = true
      menu.closePopup()
    })
    // Wait for the menu to be closed
    while (!menuClosed) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    return result
  })

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
      .post<boolean>('http://localhost:3000/api/dashboard/populateSpace', requestContent, {
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
      .post<boolean>('http://localhost:3000/api/dashboard/uploadAudio', formData, {
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
