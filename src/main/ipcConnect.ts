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

type ConnectIpcParams = {
  mainWindow: BrowserWindow
  app: App
  scriptSubprocess: ChildProcessWithoutNullStreams | null
  killScriptSubprocess: () => boolean
  auth: { spaceName: string; accessCode: string }
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
    mainWindow.setSize(Math.floor(width), Math.floor(height), true)
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

  ipcMain.handle('scriptStop', killScriptSubprocess)

  ipcMain.handle('close', () => {
    killScriptSubprocess()
    app.quit()
  })

  ipcMain.handle('minimize', () => BrowserWindow.getFocusedWindow()?.minimize())

  ipcMain.handle('isAuth', () => {
    if (is.dev) return true
    return auth.accessCode !== '' && auth.spaceName !== ''
  })

  ipcMain.handle('handleCapture', async (_, capture: { base64Image: string; data: string }) => {
    const response = await fetch('http://localhost:3000/api/dashboard/populateSpace', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(capture)
    })

    return await response.json()
  })
}
