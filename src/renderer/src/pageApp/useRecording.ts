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
  const { isAuth, setIsAuth, setRecordingStartTime, setRecordingEndTime, metadata } =
    useGlobalStore(
      ({ isAuth, setIsAuth, setRecordingStartTime, setRecordingEndTime, metadata }) => ({
        isAuth,
        setIsAuth,
        setRecordingStartTime,
        setRecordingEndTime,
        metadata
      })
    )

  const recordingDisabled = useMemo(() => {
    const { screenWidth, screenHeight, screenOffsetX, screenOffsetY } = metadata ?? {}
    const metadataValues = [screenWidth, screenHeight, screenOffsetX, screenOffsetY]

    return imageCapture === null || !isAuth || metadataValues.some((value) => value === undefined)
  }, [imageCapture, isAuth, metadata])

  const startRecording = useCallback(async () => {
    if (recordingDisabled) return

    if (await window.electron.ipcRenderer.invoke('scriptStart')) {
      audioRecorder?.start(200)
      setRecordingStartTime(Date.now())
      return setIsRecording(true)
    }

    setIsRecording(false)
  }, [audioRecorder, recordingDisabled, metadata])

  const stopRecording = useCallback(async () => {
    if (recordingDisabled) return

    stopVideo()
    stopAudio()

    await window.electron.ipcRenderer.invoke('scriptStop')
    audioRecorder?.stop()
    setRecordingEndTime(Date.now())
    setIsRecording(false)

    navigate('/result')
  }, [audioRecorder, recordingDisabled])

  useEffect(() => {
    const screenWidth = metadata?.screenWidth ?? 0
    const screenHeight = metadata?.screenHeight ?? 0
    const screenOffsetX = metadata?.screenOffsetX ?? 0
    const screenOffsetY = metadata?.screenOffsetY ?? 0

    console.log('screenWidth', screenWidth)
    console.log('screenHeight', screenHeight)
    console.log('screenOffsetX', screenOffsetX)
    console.log('screenOffsetY', screenOffsetY)

    const handleData = async (_: IpcRendererEvent, data: string) => {
      if (isRecording && imageCapture) {
        const imageBitmap = await imageCapture.grabFrame()
        const base64Image = await bitmapToBase64(imageBitmap)
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
  }, [imageCapture, isRecording, metadata])

  return { isRecording, recordingDisabled, startRecording, stopRecording }
}
