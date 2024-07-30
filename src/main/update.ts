import { app } from 'electron'
import { autoUpdater } from 'electron-updater'

export async function update(win: Electron.BrowserWindow, updateDownloaded: boolean) {
  autoUpdater.autoDownload = true

  if (!app.isPackaged) {
    const error = new Error('The update feature is only available after the package.')
    console.error(error)
    return
  }

  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...')
  })
  autoUpdater.on('update-available', (info) => {
    console.log('Update available.', info)
    win.webContents.send('update-available', info)
  })
  autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available.', info)
  })
  autoUpdater.on('error', (err) => {
    console.error('Error in auto-updater. ', err)
  })
  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = 'Download speed: ' + progressObj.bytesPerSecond
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%'
    log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')'
    console.log(log_message)
  })
  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded', info)
    if (!updateDownloaded) {
      updateDownloaded = true
    }
  })

  await autoUpdater.checkForUpdatesAndNotify()
}
