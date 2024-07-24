import { MicIcon, MicOff } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@renderer/components/ui/tooltip'
import { useGlobalStore } from '@renderer/globalStore'
import { getText } from '@renderer/lib/locales'

type AudioInputSourceProps = {
  isDisabled: boolean
  audioInput: MediaDeviceInfo | null
  setAudio: () => void
}

export function AudioInputSource({ isDisabled, audioInput, setAudio }: AudioInputSourceProps) {
  const { locale } = useGlobalStore(({ locale }) => ({ locale }))

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" onClick={setAudio} disabled={isDisabled}>
            {audioInput ? <MicIcon className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {audioInput
              ? audioInput.label
                ? audioInput.label
                : getText(locale, 'audioInputUnknown')
              : getText(locale, 'audioInputNoSource')}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
