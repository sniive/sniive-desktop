import { DesktopCapturerSource } from 'electron'
import { useCallback, useState } from 'react'

type UseVideoReturn = {
  videoInput: DesktopCapturerSource | null
  setVideo: () => void
  stopVideo: () => void
  videoStream: MediaStream | null
  imageCapture: ImageCapture | null
}

export function useVideo(): UseVideoReturn {
  const [videoInput, setVideoInput] = useState<DesktopCapturerSource | null>(null)
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null)
  const [imageCapture, setImageCapture] = useState<ImageCapture | null>(null)

  const startVideoStream = async (source: DesktopCapturerSource): Promise<void> =>
    await navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: {
          cursor: 'never',
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: source.id
          }
        }
      } as MediaStreamConstraints)
      .then((stream) => {
        setVideoStream(stream)

        const track = stream.getVideoTracks()[0]
        const imageCapture = new ImageCapture(track)
        setImageCapture(imageCapture)

        // get stream dimensions
        const { width, height } = stream.getVideoTracks()[0].getSettings()
        window.electron.ipcRenderer.invoke('resize', {
          width: 300,
          height: 90 + (height ?? 0) * (300 / (width ?? 1))
        })
      })
      .catch((error) => {
        console.error(error)
        setVideoInput(null)
        setVideoStream(null)
        setImageCapture(null)
      })

  const getVideoDevices = async (): Promise<DesktopCapturerSource | null> =>
    window.electron.ipcRenderer.invoke('getScreenAccess').then(async (access: boolean) => {
      if (!access) return null
      return await window.electron.ipcRenderer.invoke('getVideoRecordingSource', ['screen'])
    })

  const setVideo = async () =>
    await getVideoDevices()
      .then((source) => {
        setVideoInput(source)
        if (source) {
          startVideoStream(source)
        } else {
          setVideoStream(null)
          setImageCapture(null)
        }
      })
      .catch((error) => {
        console.error(error)
        setVideoInput(null)
        setVideoStream(null)
        setImageCapture(null)
      })

  const stopVideo = useCallback(async () => {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop())
    }
    setVideoStream(null)
    setImageCapture(null)
  }, [videoStream])

  return { videoInput, setVideo, stopVideo, videoStream, imageCapture }
}
