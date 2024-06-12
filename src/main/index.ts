import { app, BrowserWindow } from 'electron'
import path from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { ChildProcessWithoutNullStreams } from 'child_process'
import { connectIpc } from './ipcConnect'
import { createWindow } from './createWindow'
import { Auth, killScriptSubprocess, matchDeepLink } from './utils'

let scriptSubprocess: ChildProcessWithoutNullStreams | null
let auth: Auth = { spaceName: '', access: '' }

// Register the protocol for sniive://
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('sniive', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('sniive')
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.electron')

    app.on('browser-window-created', (_, window) => {
      // lauch devtools for each BrowserWindow
      if (is.dev) {
        window.webContents.openDevTools({
          mode: 'detach'
        })
      } else {
        optimizer.watchWindowShortcuts(window)
      }
    })

    if (process.argv.length >= 2 && process.platform !== 'darwin') {
      const { spaceName, access } = matchDeepLink(process.argv[1])
      if (spaceName && access) {
        auth = { spaceName, access }
      }
    }

    const mainWindow = createWindow()
    //update(mainWindow)
    connectIpc({ mainWindow, scriptSubprocess, killScriptSubprocess, auth, app })

    app.on('second-instance', (_, commandLine: string[]) => {
      // Someone tried to run a second instance, we should focus our window.
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.focus()
      }
      // the commandLine is array of strings in which last element is deep link url
      if (commandLine && commandLine.length >= 2 && process.platform !== 'darwin') {
        const { spaceName, access } = matchDeepLink(process.argv[1])
        auth = matchDeepLink(commandLine[commandLine.length - 1])
        if (spaceName && access) {
          auth = { spaceName, access }
        }
      }
    })

    app.on('activate', function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('before-quit', () => killScriptSubprocess(scriptSubprocess))
  app.on('will-quit', () => killScriptSubprocess(scriptSubprocess))

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', () => {
    killScriptSubprocess(scriptSubprocess)

    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('open-url', (_, url: string) => {
    if (process.platform === 'darwin') {
      const { spaceName, access } = matchDeepLink(url)
      if (spaceName && access) {
        auth = { spaceName, access }
      }
    }
  })
}
