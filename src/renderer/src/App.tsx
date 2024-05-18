import { Button } from '@renderer/components/ui/button'
import { DesktopCapturerSource } from 'electron'
import { MicIcon, MicOff, PlayIcon, ScreenShareIcon, SquareIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@renderer/components/ui/tooltip'
import { ScriptAction } from './scriptTypes'

function App(): JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null)

  const [audioInput, setAudioInput] = useState<MediaDeviceInfo | null>(null)
  const [videoInput, setVideoInput] = useState<DesktopCapturerSource | null>(null)

  const [isRecording, setIsRecording] = useState(false)

  window.electron.ipcRenderer.on('scriptData', (_, data: ScriptAction) => {
    console.log(data)
  })

  const startAudioStream = async (source: MediaDeviceInfo): Promise<MediaStream> =>
    await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: source.deviceId
      },
      video: false
    })

  const getAudioDevices = async (): Promise<void> => {
    const audioInputs: MediaDeviceInfo[] = await navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => devices.filter((device) => device.kind === 'audioinput'))
      .catch(() => [])

    const options = ['- None -', ...audioInputs.map(({ label }) => label || 'Unknown device')]

    await window.electron.ipcRenderer.invoke('useMenu', options).then((result: number | null) => {
      if (result === null) return
      if (result === 0) setAudioInput(null)
      else {
        setAudioInput(audioInputs[result - 1])
        startAudioStream(audioInputs[result - 1])
      }
    })
  }

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
      .then((stream: MediaStream) => {
        videoRef.current!.srcObject = stream
        videoRef.current!.play()
      })

  const getVideoDevices = async (): Promise<void> =>
    window.electron.ipcRenderer.invoke('getScreenAccess').then(async (access: boolean) => {
      if (!access) return
      await window.electron.ipcRenderer
        .invoke('getVideoRecordingSource', ['screen', 'window'])
        .then((source: DesktopCapturerSource | null) => {
          setVideoInput(source)
          if (source) {
            startVideoStream(source)
          }
        })
    })

  const startScript = async (): Promise<void> => {
    setIsRecording(await window.electron.ipcRenderer.invoke('scriptStart'))
  }

  const stopScript = async (): Promise<void> => {
    setIsRecording(!(await window.electron.ipcRenderer.invoke('scriptStop')))
  }

  return (
    <main className={'min-h-screen bg-background antialiased'}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" onClick={getVideoDevices}>
              <ScreenShareIcon className="w-6 h-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {videoInput
                ? videoInput.name
                  ? videoInput.name
                  : 'Unknown'
                : 'No video source selected'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" onClick={getAudioDevices}>
              {audioInput ? <MicIcon className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {audioInput
                ? audioInput.label
                  ? audioInput.label
                  : 'Unknown'
                : 'No audio source selected'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {isRecording ? (
        <Button variant="ghost" onClick={stopScript}>
          <SquareIcon className="w-6 h-6" />
        </Button>
      ) : (
        <Button variant="ghost" onClick={startScript}>
          <PlayIcon className="w-6 h-6" />
        </Button>
      )}

      <video className="w-96 h-72 border-2 border-black bg-black" ref={videoRef} />
    </main>
  )
}

export default App
