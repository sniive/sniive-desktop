import { MicIcon, MicOff } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@renderer/components/ui/tooltip'

type AudioInputSourceProps = {
  isDisabled: boolean
  audioInput: MediaDeviceInfo | null
  setAudioInput: (source: MediaDeviceInfo | null) => void
}

export function AudioInputSource({ isDisabled, audioInput, setAudioInput }: AudioInputSourceProps) {
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
      }
    })
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" onClick={getAudioDevices} disabled={isDisabled}>
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
  )
}
