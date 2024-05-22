import { app, shell, screen, BrowserWindow, Tray, nativeImage } from 'electron'
import path, { join } from 'path'
import { electronApp, is } from '@electron-toolkit/utils'
import appIcon from '../../resources/icon.png?asset&asarUnpack'
import { ChildProcessWithoutNullStreams } from 'child_process'
import { connectIpc } from './ipcConnect'
import { update } from './update'

interface Auth {
  spaceName: string
  accessCode: string
}

let scriptSubprocess: ChildProcessWithoutNullStreams | null
let auth: Auth = { spaceName: '', accessCode: '' }

function matchDeepLink(link: string): Auth {
  const regex = /sniive:\/\/(.+)\?access=(.+)/
  const match = link.match(regex)
  if (match && match.length === 3) {
    const spaceName = match[1]
    const accessCode = match[2]
    return { spaceName, accessCode }
  }
  return { spaceName: '', accessCode: '' }
}

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

function createWindow(): BrowserWindow {
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
      nodeIntegrationInWorker: true,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  new Tray(nativeImage.createFromPath(appIcon))

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

  return mainWindow
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

    if (process.argv.length >= 2 && process.platform !== 'darwin') {
      auth = matchDeepLink(process.argv[1])
    }

    const mainWindow = createWindow()
    update(mainWindow)
    connectIpc({ mainWindow, scriptSubprocess, killScriptSubprocess, auth, app })

    app.on('second-instance', (_, commandLine: string[]) => {
      // Someone tried to run a second instance, we should focus our window.
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.focus()
      }
      // the commandLine is array of strings in which last element is deep link url
      if (commandLine && commandLine.length >= 2 && process.platform !== 'darwin') {
        auth = matchDeepLink(commandLine[commandLine.length - 1])
      }
    })

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

    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('open-url', (_, url: string) => {
    if (process.platform === 'darwin') {
      auth = matchDeepLink(url)
    }
  })
}
// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
