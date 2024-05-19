import { ScreenShareIcon } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@renderer/components/ui/tooltip'
import { DesktopCapturerSource } from 'electron'

type VideoInputSourceProps = {
  isDisabled: boolean
  videoInput: DesktopCapturerSource | null
  setVideoInput: (source: DesktopCapturerSource | null) => void
}

export function VideoInputSource({ isDisabled, videoInput, setVideoInput }: VideoInputSourceProps) {
  const getVideoDevices = async (): Promise<void> =>
    window.electron.ipcRenderer.invoke('getScreenAccess').then(async (access: boolean) => {
      if (!access) return
      await window.electron.ipcRenderer
        .invoke('getVideoRecordingSource', ['screen', 'window'])
        .then((source: DesktopCapturerSource | null) => {
          setVideoInput(source)
        })
    })

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" onClick={getVideoDevices} disabled={isDisabled}>
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
  )
}
