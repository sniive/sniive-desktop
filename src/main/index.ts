import { app, BrowserWindow } from 'electron'
import path from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { ChildProcessWithoutNullStreams } from 'child_process'
import { connectIpc } from './ipcConnect'
import { createWindow } from './createWindow'
import { Auth, killScriptSubprocess, matchDeepLink } from './utils'

let scriptSubprocess: ChildProcessWithoutNullStreams | null
let auth: Auth = matchDeepLink(
  'sniive://space018fe310x0116x7000xaeb7x34663d7cf948?access=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiblptd0FJN3ZWU2JWdGh3MmloYWVkaDJBOTBwcFROM3ZHOWxIRDliUDRtM1ZGNUJPTU95VVJlek5TYlhIU21BSjVhSDBPb01lNEJsZHhZN0xqcXdXNEEifQ..YAk5Dw6LrBpMp8VucuV9HA.Yv7Cu-JIdqh5UByMdcHOulWn6ygAKppiXr1iX8DemqpCq9H5gu3vXVKSzibZaFm-ZY7MBgkHFvnPMO241giGMjFw9hogniZGRmO1vOAoGN99X0dW9xZH5ey_FpICvKclU03D-QZ9YCPhJCs1vdBVz1dznEKmuxUvbB8aIR46JlydmBLUMCmQgqt_hMguR1fJ-Hf0_hJq9Bq6Uf_CqNfOVHIMLvWPK90CppwATgAV5U4-XN716xrk6fED0wyWWzcSQkUCy8MdBVzuBiXG3iUw683JE-j_phRt1MwOEUykv45zdOn0qBelr_dh8di8P5X7GrQ8LkM6zIvr-iSN3x_jJd40vxUf3SfG54r3VBDVEWsh3TTwvIfx1e0uR0KVIUba.-lWhy-xgCeG2Q-uJLoLvn74oVc6wM60R0ct_ECtzUlo'
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
