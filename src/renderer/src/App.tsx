import { DesktopCapturerSource } from 'electron'
import { useEffect, useMemo, useState } from 'react'
import { ScriptAction } from './scriptTypes'
import { CloseButton } from '@renderer/components/utilityBar/closeButton'
import { MinimizeButton } from '@renderer/components/utilityBar/minimizeButton'
import { DragButton } from '@renderer/components/utilityBar/dragButton'
import { VideoInputSource } from '@renderer/components/videoInputSource'
import { AudioInputSource } from '@renderer/components/audioInputSource'
import { RecordButton } from '@renderer/components/recordButton'
import { VideoPreview } from '@renderer/components/videoPreview'
import { AudioPreview } from '@renderer/components/audioPreview'

function App(): JSX.Element {
  const [audioInput, setAudioInput] = useState<MediaDeviceInfo | null>(null)
  const [videoInput, setVideoInput] = useState<DesktopCapturerSource | null>(null)
  const [isRecording, setIsRecording] = useState<boolean>(false)

  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null)

  const recordingDisabled = useMemo(() => videoStream === null, [videoStream])

  window.electron.ipcRenderer.on('scriptData', (_, data: ScriptAction) => {
    console.log(data)
  })

  const startVideoStream = async (source: DesktopCapturerSource): Promise<void> =>
    await navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: source.id
          }
        }
      } as MediaStreamConstraints)
      .then((stream) => {
        setVideoStream(stream)

        // get stream dimensions
        const { width, height } = stream.getVideoTracks()[0].getSettings()
        window.electron.ipcRenderer.invoke('resize', {
          width: 300,
          height: 80 + (height ?? 0) * (300 / (width ?? 1))
        })
      })

  useEffect(() => {
    if (videoInput) {
      startVideoStream(videoInput)
    } else {
      setVideoStream(null)
    }
  }, [videoInput])

  const startAudioStream = async (source: MediaDeviceInfo): Promise<void> =>
    await navigator.mediaDevices
      .getUserMedia({
        audio: {
          deviceId: source.deviceId
        },
        video: false
      })
      .then((stream) => setAudioStream(stream))

  useEffect(() => {
    if (audioInput) {
      startAudioStream(audioInput)
    } else {
      setAudioStream(null)
    }
  }, [audioInput])

  return (
    <main className="min-w-screen bg-background antialiased rounded-lg flex flex-col items-center justify-center overflow-hidden">
      <div className="w-full grid grid-cols-3 items-center justify-center">
        <div className="flex flex-row items-center justify-start col-span-1">
          <VideoInputSource
            videoInput={videoInput}
            setVideoInput={setVideoInput}
            isDisabled={isRecording}
          />
          <AudioInputSource
            audioInput={audioInput}
            setAudioInput={setAudioInput}
            isDisabled={isRecording}
          />
        </div>

        <div className="flex flex-row items-center justify-center col-span-1">
          <RecordButton
            isRecording={isRecording}
            setIsRecording={setIsRecording}
            isDisabled={recordingDisabled}
          />
        </div>

        <div className="flex flex-row items-center justify-end gap-2 col-span-1">
          <CloseButton />
          <MinimizeButton />
          <DragButton />
        </div>
      </div>
      <AudioPreview
        audioStream={audioStream}
        isRecording={isRecording}
        isDisabled={recordingDisabled}
      />
      <VideoPreview videoStream={videoStream} isRecording={isRecording} />
    </main>
  )
}

export default App
