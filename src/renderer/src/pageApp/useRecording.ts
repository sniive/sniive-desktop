import { useCallback, useEffect, useMemo, useState } from 'react'
import { IpcRendererEvent } from 'electron'
import { useGlobalStore } from '@renderer/globalStore'
import { useNavigate } from 'react-router-dom'

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
  const navigate = useNavigate()

  const [isRecording, setIsRecording] = useState<boolean>(false)
  const { sendInfo, setSendInfo, addMemory } = useGlobalStore(
    ({ sendInfo, setSendInfo, addMemory }) => ({ sendInfo, setSendInfo, addMemory })
  )

  const recordingDisabled = useMemo(
    () => imageCapture === null || sendInfo === null,
    [imageCapture, sendInfo]
  )

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

    navigate('/result')
  }

  const handleData = useCallback(
    async (_: IpcRendererEvent, data: string) => {
      if (isRecording) {
        await imageCapture?.grabFrame().then((imageBitmap) => addMemory(imageBitmap, data))
      }
    },
    [imageCapture, isRecording]
  )

  useEffect(() => {
    window.electron.ipcRenderer.invoke('getLink').then((link: string) => {
      const regex = /sniive:\/\/(.+)\?access=(.+)/
      const match = link.match(regex)
      if (match && match.length === 3) {
        const spaceName = match[1]
        const accessCode = match[2]
        setSendInfo(spaceName, accessCode)

        window.electron.ipcRenderer.on('scriptData', handleData)
      }
    })

    return () => window.electron.ipcRenderer.removeAllListeners('scriptData')
  }, [handleData])

  return { isRecording, recordingDisabled, startRecording, stopRecording }
}
