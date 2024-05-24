import { useGlobalStore } from '@renderer/globalStore'
import { IpcRendererEvent } from 'electron'
import { useCallback, useEffect, useState } from 'react'

enum ResultState {
  IDLE,
  UPLOADING,
  UPLOADING_DONE
}

type UseResultReturn = {
  state: ResultState
  progress: number
  handleUpload: () => void
}

export function useResult(): UseResultReturn {
  const { audioString } = useGlobalStore(({ audioString }) => ({ audioString }))
  const [state, setState] = useState<ResultState>(ResultState.IDLE)
  const [progress, setProgress] = useState<number>(0)

  useEffect(() => {
    window.electron.ipcRenderer.invoke('resize', {
      width: 300,
      height: 80
    })
  }, [])

  window.electron.ipcRenderer.on('uploadProgress', (_: IpcRendererEvent, progress: number) => {
    setProgress(progress)
  })

  const handleUpload = useCallback(async () => {
    setState(ResultState.UPLOADING)
    await window.electron.ipcRenderer.invoke('handleAudio', audioString).then((result: boolean) => {
      setState(result ? ResultState.UPLOADING_DONE : ResultState.IDLE)
    })
  }, [audioString])

  return { state, progress, handleUpload }
}
