import { ScreenShareIcon } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@renderer/components/ui/tooltip'
import { DesktopCapturerSource } from 'electron'
import { useGlobalStore } from '@renderer/globalStore'
import { getText } from '@renderer/lib/locales'

type VideoInputSourceProps = {
  isDisabled: boolean
  videoInput: DesktopCapturerSource | null
  setVideo: () => void
}

export function VideoInputSource({ isDisabled, videoInput, setVideo }: VideoInputSourceProps) {
  const { locale } = useGlobalStore(({ locale }) => ({ locale }))

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" onClick={setVideo} disabled={isDisabled}>
            <ScreenShareIcon className="w-6 h-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {videoInput
              ? videoInput.name ||
                videoInput.display_id ||
                videoInput.id ||
                getText(locale, 'videoInputUnknown')
              : getText(locale, 'videoInputNoSource')}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
