import { MessageBoxOptions, app, dialog } from 'electron'
import { autoUpdater, type ProgressInfo, type UpdateDownloadedEvent } from 'electron-updater'

export async function update(win: Electron.BrowserWindow) {
  // When set to false, the update download will be triggered through the API
  autoUpdater.autoDownload = false
  autoUpdater.disableWebInstaller = false
  autoUpdater.allowDowngrade = false

  if (!app.isPackaged) {
    const error = new Error('The update feature is only available after the package.')
    console.error(error)
  }

  try {
    const res = await autoUpdater.checkForUpdatesAndNotify()
    if (res) {
      const options: MessageBoxOptions = {
        type: 'info',
        buttons: ['Yes', 'No'],
        defaultId: 0,
        title: 'Update Available',
        message: 'A new version of the app is available. Do you want to update now?',
        detail: 'A new version of the app is available. Do you want to update now?'
      }

      const response = await dialog.showMessageBox(win, options)

      if (response.response === 0) {
        const download = await new Promise<boolean>((resolve, reject) => {
          startDownload(
            (error, progressInfo) => {
              if (error) {
                // feedback download error message
                win.webContents.send('update-error', { message: error.message, error })
                reject(error)
              } else {
                // feedback update progress message
                win.webContents.send('download-progress', progressInfo)
              }
            },
            () => {
              // feedback update downloaded message
              win.webContents.send('update-downloaded')
              resolve(true)
            }
          )
        })

        if (download) {
          autoUpdater.quitAndInstall()
        }
      }
    }
  } catch (error) {
    console.error(error)
  }
}

function startDownload(
  callback: (error: Error | null, info: ProgressInfo | null) => void,
  complete: (event: UpdateDownloadedEvent) => void
) {
  autoUpdater.on('download-progress', (info: ProgressInfo) => callback(null, info))
  autoUpdater.on('error', (error: Error) => callback(error, null))
  autoUpdater.on('update-downloaded', complete)
  autoUpdater.downloadUpdate()
}
