import { app, BrowserWindow } from 'electron'
import path from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { ChildProcessWithoutNullStreams } from 'child_process'
import { connectIpc } from './ipcConnect'
import { createWindow } from './createWindow'
import { Auth, killScriptSubprocess, matchDeepLink } from './utils'
import { update } from './update'

let scriptSubprocess: ChildProcessWithoutNullStreams | null
let auth: Auth = is.dev
  ? matchDeepLink(
      'sniive://space0190dfb2xefa5x7000xa7c1x0ffbe8d1c498?access=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoic284N1hYQzl2WXc4d2l4SE4zb3lvNGR2d1FRbTc3MWFZN25tX05OS2IxeDFiMERqX3p5LTNFekR5VDdKeklXTlpEM2dtNHRMcXoyRjF4Y0w4WlUweFEifQ..h_LmpVIOq58jfiu8_KETHQ.GwVBLu6G8tjYQ3GJL8hY6yEzxZjDuS2emBEbpiQHrVN9UUAHDULFKFRb0bo3Uckg-fTEoxzb9YA8dLaIcpM-B5oL-25R2HHMvWL6ScoHK7ihZb6CbgWh-zKuK0WWrSNogDZnzSb6-mwZSkytRhyJtWN0DD9f9UfUtMbsiVkWTZ9lR6UE16naMb308uPT5jurhN7P0f8C_HjqpBonuH69yz2c2VHir-RGtTq1xpme1D1ZLgCIG04m-5N3uKB94LmVFl9gDxaOmDVf1sMtFRxrN6e__uGjt9wCqPPlUs1OsCCyiNfID35pI1uxpquoSVK13IvCpr-se05ViQlBGEEDmU6PG-qLzHxWe_pm1llT2UsKT7wkqoekIoyu0Dx78Tf3r6Xqwsj_BDlTl-ft_p33rnj1EpJuZaNj97dpYeGjvAwa4fRgU3XwI4HRzLvFToQj8taN8XGwZ5SUuqB8KrPTg7NxQqF_sgfLUctioAunQegs_HdGu7SYMR5fSyghmKK_6unUlEyhwLZD_SLSu-RNUmTY82oBvwo42DjPOTNmasfY_mmtZ72gReI6UCk-kQm7FJS5Oqq6e7fijAcN7RKYmbMn6zIbLw2TFwVEDjaLw3vxfQLhFt3nKqqcX7bkhy-vB0tiRVqpwIFZuelj8LAtEA.Pxuxfsi7Ju8V1jZZWDevnsj19tA_Yk1ZZ_cPlad79ug'
    )
  : { spaceName: '', access: '' }

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
      // launch devtools for each BrowserWindow
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
