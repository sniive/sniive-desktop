import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  desktopCapturer,
  Menu,
  systemPreferences,
  DesktopCapturerSource
} from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { ChildProcessWithoutNullStreams, spawn } from 'child_process'

const IS_OSX = process.platform === 'darwin'
let scriptSubprocess: ChildProcessWithoutNullStreams | null

function killScriptSubprocess() {
  if (scriptSubprocess) {
    try {
      scriptSubprocess.stdout.removeAllListeners()
      scriptSubprocess.stderr.removeAllListeners()
      const res = scriptSubprocess.kill('SIGTERM')
      scriptSubprocess = null
      return res
    } catch (error) {
      console.error(error)
      return false
    }
  } else {
    return true
  }
}

function createWindow(): void {
  //const displays = screen.getAllDisplays();

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 300,
    height: 80,
    frame: false,
    transparent: true,
    show: false,
    resizable: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // This API must have access to the `mainWindow` object
  ipcMain.handle('scriptStart', async () => {
    if (scriptSubprocess === null || scriptSubprocess === undefined) {
      try {
        scriptSubprocess = spawn(__dirname + '/../../resources/script.bin')
        scriptSubprocess.stdout.on('data', (data) => {
          mainWindow.webContents.send('scriptData', JSON.parse(data.toString()))
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

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle(
    'getScreenAccess',
    () => !IS_OSX || systemPreferences.getMediaAccessStatus('screen') === 'granted'
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

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', killScriptSubprocess)
app.on('will-quit', killScriptSubprocess)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  killScriptSubprocess()

  if (!IS_OSX) {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
