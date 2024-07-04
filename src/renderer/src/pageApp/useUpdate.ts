import { useEffect, useState } from 'react'

export function useUpdate() {
  const [updateInfo, setUpdateInfo] = useState<{ version: string } | null>(null)

  const handleUpdateAvailable = (_: any, data: { version: string }) => {
    setUpdateInfo(data)
  }

  useEffect(() => {
    window.electron.ipcRenderer.on('update-available', handleUpdateAvailable)

    return () => {
      window.electron.ipcRenderer.removeAllListeners('update-available')
    }
  }, [])

  return { updateInfo }
}
