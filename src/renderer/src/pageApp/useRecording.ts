import { useCallback, useEffect, useMemo, useState } from 'react'
import { IpcRendererEvent } from 'electron'
import { useGlobalStore } from '@renderer/globalStore'
import { useNavigate } from 'react-router-dom'
import { Buffer } from 'buffer'

type UseRecordingParams = {
  audioRecorder: MediaRecorder | null
  imageCapture: ImageCapture | null
  stopVideo: () => void
  stopAudio: () => void
}

type UseRecordingReturn = {
  isRecording: boolean
  recordingDisabled: boolean
  startRecording: () => void
  stopRecording: () => void
}

async function bitmapToBase64(imageBitmap: ImageBitmap): Promise<string> {
  const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height)
  const context = canvas.getContext('2d')
  context?.drawImage(imageBitmap, 0, 0)
  return await canvas
    .convertToBlob({ type: 'image/jpeg' })
    .then(async (blob) => Buffer.from(await blob.arrayBuffer()).toString('base64'))
}

export function useRecording({
  audioRecorder,
  imageCapture,
  stopVideo,
  stopAudio
}: UseRecordingParams): UseRecordingReturn {
  const navigate = useNavigate()

  const [isRecording, setIsRecording] = useState<boolean>(false)
  const { isAuth, setIsAuth } = useGlobalStore(({ isAuth, setIsAuth }) => ({ isAuth, setIsAuth }))

  const recordingDisabled = useMemo(() => imageCapture === null || !isAuth, [imageCapture, isAuth])

  const startRecording = useCallback(async () => {
    if (recordingDisabled) return

    if (await window.electron.ipcRenderer.invoke('scriptStart')) {
      audioRecorder?.start()
      return setIsRecording(true)
    }

    setIsRecording(false)
  }, [audioRecorder, recordingDisabled])

  const stopRecording = useCallback(async () => {
    if (recordingDisabled) return

    stopVideo()
    stopAudio()

    await window.electron.ipcRenderer.invoke('scriptStop')
    audioRecorder?.stop()
    setIsRecording(false)

    navigate('/result')
  }, [audioRecorder, recordingDisabled])

  const handleData = useCallback(
    async (_: IpcRendererEvent, data: string) => {
      if (isRecording) {
        await imageCapture?.grabFrame().then(async (imageBitmap) => {
          const base64Image = await bitmapToBase64(imageBitmap)
          const res = await window.electron.ipcRenderer.invoke('handleCapture', {
            data,
            base64Image
          })
          console.log(res)
        })
      }
    },
    [imageCapture, isRecording]
  )

  useEffect(() => {
    window.electron.ipcRenderer.invoke('isAuth').then((isAuth: boolean) => {
      setIsAuth(isAuth)
      if (isAuth) {
        window.electron.ipcRenderer.on('scriptData', handleData)
      }
    })

    return () => window.electron.ipcRenderer.removeAllListeners('scriptData')
  }, [handleData])

  return { isRecording, recordingDisabled, startRecording, stopRecording }
}
