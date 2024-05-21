import {
  app,
  shell,
  screen,
  BrowserWindow,
  ipcMain,
  desktopCapturer,
  Menu,
  systemPreferences,
  DesktopCapturerSource,
  Tray,
  nativeImage
} from 'electron'
import path, { join } from 'path'
import { electronApp, is } from '@electron-toolkit/utils'
import appIcon from '../../resources/icon.png?asset&asarUnpack'
import { ChildProcessWithoutNullStreams, spawn } from 'child_process'

const IS_OSX = process.platform === 'darwin'
let scriptSubprocess: ChildProcessWithoutNullStreams | null
let deepLink: string | null = null

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

// Register the protocol for sniive://
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('sniive', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('sniive')
}

function createWindow(): void {
  // Get the display that the mouse is currently on
  const { x, y } = screen.getCursorScreenPoint()
  const currentDisplay = screen.getAllDisplays().find((display) => {
    const { x: displayX, y: displayY, width, height } = display.bounds
    return x >= displayX && x <= displayX + width && y >= displayY && y <= displayY + height
  })
  // spawn window on top right corner of the current display (with 5% margin)
  const { width, height } = currentDisplay
    ? currentDisplay.bounds
    : screen.getPrimaryDisplay().bounds
  const windowX = Math.floor(width * 0.95 - 300)
  const windowY = Math.floor(height * 0.05)

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 300,
    height: 80,
    frame: false,
    transparent: true,
    show: false,
    resizable: false,
    x: windowX,
    y: windowY,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon: nativeImage.createFromPath(appIcon) } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  new Tray(nativeImage.createFromPath(appIcon))

  app.on('second-instance', (_, commandLine: string[]) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
    // the commandLine is array of strings in which last element is deep link url
    if (commandLine && commandLine.length >= 2 && !IS_OSX) {
      deepLink = commandLine[commandLine.length - 1]
    }
  })

  /* fetch of localhost:3000, include custom cookies
  fetch('http://localhost:3000/api/auth/testAuth', {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': "authjs.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoic284N1hYQzl2WXc4d2l4SE4zb3lvNGR2d1FRbTc3MWFZN25tX05OS2IxeDFiMERqX3p5LTNFekR5VDdKeklXTlpEM2dtNHRMcXoyRjF4Y0w4WlUweFEifQ..LLiBbwG_erNRVCaRooBj2A.jVmfUuPduQf_UTTgQQ0wFZZYd-HaDjjiDXSS6zB3-_EavVA0XMjal5q_GVLZZt9pSZtW2hkxgavMcx18ImNfaqRh5PkuBJ2lICRQ0gdWwMtRYQOBGk97FhiU9rjg2IL1DSIInrffeV6dbsTKb7jhD38oLEqUqsbq3cTnbFxZM8nlos6LEpVMUm0Vz1q19_hDOuwjYJqynpGZYVo2WfVaUdYIeypZpF9oPDACr107VqLBH-6YU5DMTibIZ1E08meznfcyP6kT0k7ZXfWrUUT8-qcOa-13G_DE2Hq_ZsFwcXfYmfw1ybihO7GThCEdAOMr.ui1bxqP4iisxGAofP6Riq7nYglUTVK9xfKXWW4xpGag"
    },
  })
    .then((res) => res.json())
    .then((data) => console.log(data))
    .catch((err) => console.error(err))
  */

  // This API must have access to the `mainWindow` object
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
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.electron')

    app.on('browser-window-created', (_, window) => {
      // lauch devtools for each BrowserWindow
      window.webContents.openDevTools()

      //optimizer.watchWindowShortcuts(window)
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

    ipcMain.handle('getLink', () => {
      if (is.dev) return 'sniive://test?access=123'
      return deepLink
    })

    createWindow()
    if (process.argv.length >= 2 && !IS_OSX) {
      deepLink = process.argv[1]
    }

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

  app.on('open-url', (_, url: string) => {
    if (IS_OSX) {
      deepLink = url
    }
  })
}
// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
