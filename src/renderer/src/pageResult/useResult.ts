import { useGlobalStore } from '@renderer/globalStore'
import { IpcRendererEvent } from 'electron'
import { useCallback, useEffect, useState } from 'react'
import { convertAudioBufferToWavBlob } from './wavConverter'

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
  const { audioBlob, metadata } = useGlobalStore(({ audioBlob, metadata }) => ({
    audioBlob,
    metadata
  }))
  const [state, setState] = useState<ResultState>(ResultState.IDLE)
  const [progress, setProgress] = useState<number>(0)

  useEffect(() => {
    window.electron.ipcRenderer.invoke('resize', {
      width: 300,
      height: 80
    })

    window.electron.ipcRenderer.on('uploadProgress', (_: IpcRendererEvent, progress: number) => {
      setProgress(progress)
    })

    return () => {
      window.electron.ipcRenderer.removeAllListeners('uploadProgress')
    }
  }, [])

  const handleUpload = useCallback(async () => {
    if (!audioBlob) return

    const arrayBuffer = await audioBlob.arrayBuffer()
    const audioContext = new AudioContext()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    const wavBlob = await convertAudioBufferToWavBlob(audioBuffer)
    const wavBuffer = await wavBlob.arrayBuffer()

    setState(ResultState.UPLOADING)
    await window.electron.ipcRenderer
      .invoke('handleAudio', wavBuffer)
      .then(async (result: boolean) => {
        if (await window.electron.ipcRenderer.invoke('handleMetadata', metadata)) {
          setState(result ? ResultState.UPLOADING_DONE : ResultState.IDLE)
        }
      })
      .catch(() => {
        setState(ResultState.IDLE)
      })
  }, [audioBlob])

  return { state, progress, handleUpload }
}
