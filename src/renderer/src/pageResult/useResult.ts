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
      height: 84
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

    const wavBuffer = await audioBlob
      .arrayBuffer()
      .then(async (arrayBuffer) => {
        if (arrayBuffer.byteLength === 0) return new ArrayBuffer(0)
        const audioContext = new AudioContext()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        const wavBlob = await convertAudioBufferToWavBlob(audioBuffer)
        const wavBuffer = await wavBlob.arrayBuffer()
        return wavBuffer
      })
      .catch(() => {
        return new ArrayBuffer(0)
      })

    if (!wavBuffer) return

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
