import { app, BrowserWindow } from 'electron'
import path from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { ChildProcessWithoutNullStreams } from 'child_process'
import { connectIpc } from './ipcConnect'
import { createWindow } from './createWindow'
import { Auth, killScriptSubprocess, matchDeepLink } from './utils'
import { update } from './update'

let scriptSubprocess: ChildProcessWithoutNullStreams | null
let updateDownloaded: boolean = false
let auth: Auth = is.dev
  ? matchDeepLink(
      'sniive://space019126a7x116ex7000x845cx28c3e4af5ebc/fr?access=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoic284N1hYQzl2WXc4d2l4SE4zb3lvNGR2d1FRbTc3MWFZN25tX05OS2IxeDFiMERqX3p5LTNFekR5VDdKeklXTlpEM2dtNHRMcXoyRjF4Y0w4WlUweFEifQ..OxsyL7m1RtrgcX8tWDsJqQ.IjfrqqRZdEsq6X5FWRT_bNjjgGsHl0AYHOAh26mNs85gpFnxw8lm1MrfCdytA3ISrw_5PySqQ8jnATMHEydZaNSJk8wYdj0rXXZYVXAVIfD4rGZcuRL2-icH9psz1y5d4HJpPl3kmbGU-WUiDawf-vcJkWRf6CCsDhOOJx_eJjFLpAxfSBX5p_G3I4HZPxTq4bWVD8U5Hg_qksCMRQpeMYXBO8LjKt7c2eB5MJolh00J0hM-jhTEsX3p2QFHcaWHvU_2HTUgCg2zuvem3ZIqZ7H1KmIBtjooecD1WGn12SmdalXuwPgGlT_XLtfzhQA4mfKpqIgJjp34zkBhd9JO_JWVbmVe43_9qr58388WXJvhe9YuiDWOS9T3OxjyPcQbvYvXCAXA7LQ-eUad1ASoOkDFZoDhDwRRrKZSCY9bU2bhg_gC6FkB0Rzxm_IBYhoxHBw1mBcp2BX7SyQ1LiCPe_8k9Tza8KFNuGFYqm1JAzQNsB9OhTJ7WM4JRsVahlImnTsYuD1iSiV-QdDQIAuO4X88VLY9nZ5pkU32rJJ9pFmweCEdkFKgUYFhxIG4yrAVz5qC76oNcspS80PF2EQs6uvZgSMzwZ1_ZxK0loQLfp4mQos8BpSCtu8gYf6scD0TYAdEIrdyOBDLX1onR0VlCw.9ajyxUrpfcIHhF3IMMyPiNkNPpeTaP2K3KLl5bwtJ9s'
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
      const { spaceName, access, locale } = matchDeepLink(process.argv[1])
      if (spaceName && access) {
        auth = { spaceName, access, locale }
      }
    }

    const mainWindow = createWindow()
    update(mainWindow, updateDownloaded)
    connectIpc({ mainWindow, scriptSubprocess, killScriptSubprocess, auth, app })

    app.on('second-instance', (_, commandLine: string[]) => {
      // Someone tried to run a second instance, we should focus our window.
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.focus()
      }
      // the commandLine is array of strings in which last element is deep link url
      if (commandLine && commandLine.length >= 2 && process.platform !== 'darwin') {
        const { spaceName, access, locale } = matchDeepLink(process.argv[1])
        auth = matchDeepLink(commandLine[commandLine.length - 1])
        if (spaceName && access) {
          auth = { spaceName, access, locale }
        }
      }
    })

    app.on('activate', function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    app.on('before-quit', () => {
      killScriptSubprocess(scriptSubprocess)
      if (updateDownloaded) {
        mainWindow?.minimize()
        updateDownloaded = false
      }
    })
  })
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
      const { spaceName, access, locale } = matchDeepLink(url)
      if (spaceName && access) {
        auth = { spaceName, access, locale }
      }
    }
  })
}
