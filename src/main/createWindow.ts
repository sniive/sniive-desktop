import { BrowserWindow, Tray, nativeImage, screen, shell } from 'electron'
import appIcon from '../../resources/icon.png?asset&asarUnpack'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

export function createWindow(): BrowserWindow {
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

  if (process.platform !== 'darwin') new Tray(nativeImage.createFromPath(appIcon))

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
