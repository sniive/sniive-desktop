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

async function bitmapToBase64(
  imageBitmap: ImageBitmap,
  setScreenDimensions: ReturnType<(typeof useGlobalStore)['getState']>['setScreenDimensions']
): Promise<string> {
  setScreenDimensions({ screenHeight: imageBitmap.width, screenWidth: imageBitmap.height })

  const maxWidth = 1920
  const maxHeight = 1080

  // resize image to fit (scale to the smaller dimension)
  const scale = Math.min(maxWidth / imageBitmap.width, maxHeight / imageBitmap.height)
  const scaledWidth = imageBitmap.width * scale
  const scaledHeight = imageBitmap.height * scale
  const canvas = new OffscreenCanvas(scaledWidth, scaledHeight)
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D
  ctx.drawImage(imageBitmap, 0, 0, scaledWidth, scaledHeight)

  return await canvas
    .convertToBlob({ type: 'image/jpeg' })
    .then(async (blob) => Buffer.from(await blob.arrayBuffer()).toString('base64'))
    .catch((error) => {
      console.error(error)
      return ''
    })
}

export function useRecording({
  audioRecorder,
  imageCapture,
  stopVideo,
  stopAudio
}: UseRecordingParams): UseRecordingReturn {
  const navigate = useNavigate()

  const [isRecording, setIsRecording] = useState<boolean>(false)
  const { isAuth, setIsAuth, setRecordingStartTime, setScreenDimensions } = useGlobalStore(
    ({ isAuth, setIsAuth, setRecordingStartTime, setScreenDimensions }) => ({
      isAuth,
      setIsAuth,
      setRecordingStartTime,
      setScreenDimensions
    })
  )

  const recordingDisabled = useMemo(() => imageCapture === null || !isAuth, [imageCapture, isAuth])

  const startRecording = useCallback(async () => {
    if (recordingDisabled) return

    if (await window.electron.ipcRenderer.invoke('scriptStart')) {
      audioRecorder?.start(200)
      setRecordingStartTime(Date.now())
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

  useEffect(() => {
    const handleData = async (_: IpcRendererEvent, data: string) => {
      if (isRecording && imageCapture) {
        const imageBitmap = await imageCapture.grabFrame()
        const base64Image = await bitmapToBase64(imageBitmap, setScreenDimensions)
        await window.electron.ipcRenderer.invoke('handleCapture', {
          data,
          base64Image
        })
      }
    }

    window.electron.ipcRenderer.invoke('isAuth').then((isAuth: boolean) => {
      setIsAuth(isAuth)
      if (isAuth) {
        window.electron.ipcRenderer.on('scriptData', handleData)
      }
    })

    return () => window.electron.ipcRenderer.removeAllListeners('scriptData')
  }, [imageCapture, isRecording])

  return { isRecording, recordingDisabled, startRecording, stopRecording }
}
