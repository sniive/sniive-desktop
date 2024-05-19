import { useCallback, useEffect, useMemo, useState } from 'react'
import { ScriptAction } from './scriptTypes'
import { IpcRendererEvent } from 'electron'

type UseRecordingParams = {
  audioRecorder: MediaRecorder | null
  imageCapture: ImageCapture | null
}

type UseRecordingReturn = {
  isRecording: boolean
  recordingDisabled: boolean
  startRecording: () => void
  stopRecording: () => void
}

export function useRecording({
  audioRecorder,
  imageCapture
}: UseRecordingParams): UseRecordingReturn {
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const recordingDisabled = useMemo(() => imageCapture === null, [imageCapture])

  const startRecording = async () => {
    if (recordingDisabled) return

    if (await window.electron.ipcRenderer.invoke('scriptStart')) {
      audioRecorder?.start()
      return setIsRecording(true)
    }

    setIsRecording(false)
  }

  const stopRecording = async () => {
    if (recordingDisabled) return

    await window.electron.ipcRenderer.invoke('scriptStop')
    audioRecorder?.stop()
    setIsRecording(false)
  }

  const handleData = useCallback(
    async (_: IpcRendererEvent, data: ScriptAction) => {
      isRecording &&
        (await imageCapture?.grabFrame().then((imageBitmap) => {
          console.log(data, imageBitmap)
        }))
    },
    [imageCapture, isRecording]
  )

  useEffect(() => {
    window.electron.ipcRenderer.on('scriptData', handleData)
    return () => window.electron.ipcRenderer.removeAllListeners('scriptData')
  }, [handleData])

  return { isRecording, recordingDisabled, startRecording, stopRecording }
}
