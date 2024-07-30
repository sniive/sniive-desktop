import { is } from '@electron-toolkit/utils'
import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import {
  App,
  BrowserWindow,
  DesktopCapturerSource,
  desktopCapturer,
  ipcMain,
  Notification,
  systemPreferences,
  screen
} from 'electron'
import { join } from 'path'
import {
  Auth,
  getUploadLink,
  handleMenu,
  isGetUploadLinkError,
  isNotifyRecordingStatusError,
  notifyRecordingStatus,
  runTutorial
} from './utils'
import axios from 'axios'
import {
  hasPromptedForPermission,
  hasScreenCapturePermission,
  openSystemPreferences
} from 'mac-screen-capture-permissions'

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
  ipcMain.handle('scriptStart', async (_, displayString: string) => {
    if (scriptSubprocess === null || scriptSubprocess === undefined) {
      try {
        const extension = process.platform === 'win32' ? 'exe' : 'bin'
        const scriptPath =
          process.platform === 'darwin'
            ? '/Applications/sniive-script.app/Contents/MacOS/sniive-script'
            : join(__dirname, `../../resources/script.${extension}`).replace(
                'app.asar',
                'app.asar.unpacked'
              )

        // eslint-disable-next-line no-inner-declarations
        function startSubprocess() {
          if (process.platform === 'linux' || process.platform === 'darwin') {
            return spawn(scriptPath)
          }
          const display: DesktopCapturerSource = JSON.parse(displayString)

          if (display.id.startsWith('window')) {
            const id = display.id.split(':')[1]
            return spawn(scriptPath, ['window', id])
          }

          if (display.id.startsWith('screen')) {
            const referenceDisplay = screen
              .getAllDisplays()
              .find((disp) => disp.id.toString() === display.display_id)
            if (referenceDisplay) {
              const {
                scaleFactor,
                nativeOrigin: { x: originX, y: originY },
                bounds: { x, y, width, height }
              } = referenceDisplay
              const rect = {
                top: originX + x * scaleFactor,
                left: originY + y * scaleFactor,
                right: originX + (x + width) * scaleFactor,
                bottom: originY + (y + height) * scaleFactor
              }
              // turn rect into a string of the form "left-top-right-bottom"
              const rectStr = [rect.left, rect.top, rect.right, rect.bottom].join('-')
              return spawn(scriptPath, ['screen', rectStr])
            }
          }

          return spawn(scriptPath)
        }

        scriptSubprocess = startSubprocess()
        scriptSubprocess.stdout.on('data', (data) => {
          console.log(data.toString())
          mainWindow.webContents.send('scriptData', data.toString())
        })
        scriptSubprocess.stderr.on('data', (data) => {
          console.error(data.toString())
        })
        const res = await notifyRecordingStatus({ ...auth, status: 'start' })
        return !isNotifyRecordingStatusError(res)
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

  ipcMain.handle('getVideoRecordingSource', async (): Promise<DesktopCapturerSource | null> => {
    // if platform is linux, return null
    const types: ('screen' | 'window')[] = ['screen', 'window']

    if (process.platform === 'darwin') {
      if (!hasScreenCapturePermission()) {
        if (hasPromptedForPermission()) {
          await openSystemPreferences()
        }
      }
    }

    return await desktopCapturer
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
  })

  ipcMain.handle('useMenu', (_, template: string[]) => handleMenu(template))

  ipcMain.handle('scriptStop', async () => {
    killScriptSubprocess(scriptSubprocess)
    const res = await notifyRecordingStatus({ ...auth, status: 'stop' })
    return !isNotifyRecordingStatusError(res)
  })

  ipcMain.handle('close', () => {
    killScriptSubprocess(scriptSubprocess)
    app.quit()
  })

  ipcMain.handle('minimize', () => BrowserWindow.getFocusedWindow()?.minimize())

  ipcMain.handle('isAuth', () => {
    if (is.dev) return true
    return auth.access !== '' && auth.spaceName !== ''
  })

  ipcMain.handle('getLocale', async () => {
    console.log('getLocale', auth.locale)
    return auth.locale
  })

  ipcMain.handle('handleCapture', async (_, capture: { base64Image: string; data: string }) => {
    const uploadLink = await getUploadLink({ ...auth, fileExtension: 'json' })
    if (isGetUploadLinkError(uploadLink)) {
      new Notification({ title: 'Sniive error', body: uploadLink.error.message }).show()
      return false
    }

    // uploadLink is generated by blockBlobClient.generateSasUrl, post capture to uploadLink
    const response = await axios.put(uploadLink, capture, {
      headers: {
        'Content-Type': 'application/json',
        'x-ms-blob-type': 'BlockBlob'
      }
    })

    if (response.status !== 201) {
      new Notification({ title: 'Sniive error', body: 'Failed to upload capture' }).show()
      return false
    }

    return true
  })

  ipcMain.handle('handleAudio', async (_, wavBuffer: ArrayBuffer) => {
    const uploadLink = await getUploadLink({ ...auth, fileExtension: 'wav' })
    if (isGetUploadLinkError(uploadLink)) {
      new Notification({ title: 'Sniive error', body: uploadLink.error.message }).show()
      return false
    }

    const response = await axios.put(uploadLink, wavBuffer, {
      headers: { 'Content-Type': 'audio/wav', 'x-ms-blob-type': 'BlockBlob' },
      onUploadProgress(progressEvent) {
        const progress = Math.round(progressEvent.loaded / (progressEvent.total ?? 1))
        mainWindow.webContents.send('uploadProgress', progress)
      }
    })

    if (response.status !== 201) {
      new Notification({ title: 'Sniive error', body: 'Failed to upload audio' }).show()
      return false
    }

    return true
  })

  ipcMain.handle('handleMetadata', async (_, metadata) => {
    const res = await runTutorial({ ...auth, metadata })
    return !isNotifyRecordingStatusError(res)
  })
}
