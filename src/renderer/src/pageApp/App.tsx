import { CloseButton } from '@renderer/components/utilityBar/closeButton'
import { MinimizeButton } from '@renderer/components/utilityBar/minimizeButton'
import { DragButton } from '@renderer/components/utilityBar/dragButton'
import { VideoInputSource } from '@renderer/components/videoInputSource'
import { AudioInputSource } from '@renderer/components/audioInputSource'
import { RecordButton } from '@renderer/components/recordButton'
import { VideoPreview } from '@renderer/components/videoPreview'
import { AudioPreview } from '@renderer/components/audioPreview'

import { useVideo } from './useVideo'
import { useAudio } from './useAudio'
import { useRecording } from './useRecording'
import { useUpdate } from './useUpdate'
import { useGlobalStore } from '@renderer/globalStore'
import { useEffect } from 'react'

function App(): JSX.Element {
  const { updateInfo } = useUpdate()
  const { videoInput, videoStream, imageCapture, setVideo, stopVideo } = useVideo()
  const { audioInput, audioStream, audioRecorder, setAudio, stopAudio } = useAudio()
  const { isRecording, recordingDisabled, startRecording, stopRecording } = useRecording({
    audioRecorder,
    imageCapture,
    stopAudio,
    stopVideo
  })
  const { setLocale, locale } = useGlobalStore(({ setLocale, locale }) => ({ setLocale, locale }))
  useEffect(() => {
    // while locale is undefined, fetch it every second
    let interval: NodeJS.Timeout
    if (!locale) {
      interval = setInterval(() => {
        window.electron.ipcRenderer.invoke('getLocale').then((locale: string | undefined) => {
          if (locale) {
            setLocale(locale)
            clearInterval(interval)
          }
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [locale])

  return (
    <main className="min-w-screen bg-background antialiased rounded-lg flex flex-col items-center justify-center overflow-hidden border -outline-offset-1">
      <div className="w-full grid grid-cols-3 items-center justify-center">
        <div className="flex flex-row items-center justify-start col-span-1">
          <VideoInputSource videoInput={videoInput} isDisabled={isRecording} setVideo={setVideo} />
          <AudioInputSource audioInput={audioInput} isDisabled={isRecording} setAudio={setAudio} />
        </div>

        <div className="flex flex-row items-center justify-center col-span-1">
          <RecordButton
            isRecording={isRecording}
            isDisabled={recordingDisabled}
            startRecording={startRecording}
            stopRecording={stopRecording}
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
        updateInfo={updateInfo}
      />
      <VideoPreview videoStream={videoStream} isRecording={isRecording} />
    </main>
  )
}

export default App
