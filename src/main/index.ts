import { app, BrowserWindow } from 'electron'
import path from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { ChildProcessWithoutNullStreams } from 'child_process'
import { connectIpc } from './ipcConnect'
import { createWindow } from './createWindow'
import { Auth, killScriptSubprocess, matchDeepLink } from './utils'

let scriptSubprocess: ChildProcessWithoutNullStreams | null
let auth: Auth = matchDeepLink(
  'sniive://space018fcadfxe39dx7000xa956x5517ef0ccb7c?access=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoic284N1hYQzl2WXc4d2l4SE4zb3lvNGR2d1FRbTc3MWFZN25tX05OS2IxeDFiMERqX3p5LTNFekR5VDdKeklXTlpEM2dtNHRMcXoyRjF4Y0w4WlUweFEifQ..xGL6fjkOARt5p_XGgC_RnA.3k0mvvKQ4u3nZAiLUix4ymNX3btdSL14jw08PEoHEnnyYYxmeASTj6tFuZTuQdzfv9fTdqTqWV2pJki0a_TLfBmIbEocyVVNVdjFBfDYAMRUYIKbdCNiKIkDMyHjCiM5tMaW0Cp91VIB30wZfLXch6VMurDdaYPqExgeXEgOUQ-gUb8GONfQd2I1iJyQi7XbWxZeD0MwQ3vZ-ERWz5TVIp5KHQDF-26uEMZOw3ZaOzEcUYsDBhjJTebc7kVtqkY78Cbah3VtSWNiF0Ao0OQa7lPYxbqvtoPSsn82C5DHol9kEC5zfGtPOF5h3Em2xfvWIMlscXi6kVbqo8kTYfCdFVam5AQBoQl8tbGIjKREixwukpRpgXmNKYor756SP3u2.wKj6I7CJsmpnkRwFRGXy-PyeL6NT7NUFNWtyatopBzs'
)
//let auth: Auth = { spaceName: '', access: '' }

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
