import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { getText } from '@/lib/locales'
import { AudioDeviceOutput } from '@/lib/types';
import { useAppStore } from '@/state';
import { RiCheckFill } from '@remixicon/react';
import { invoke } from '@tauri-apps/api/core';
import { MicIcon, MicOffIcon } from 'lucide-react';

export function AudioInputSource() {
  const { inputSourcesDisabled, audioDevice, setAudioDevice, setInputSourcesDisabled, locale } = useAppStore(({ inputSourcesDisabled, audioDevice, setAudioDevice, setInputSourcesDisabled, locale }) => ({ inputSourcesDisabled, audioDevice, setAudioDevice, setInputSourcesDisabled, locale }));

  const handleClick = async () => {
    setInputSourcesDisabled(true);
    const audioDevice = await invoke<AudioDeviceOutput>('select_audio')
    switch (audioDevice) {
      case 'Aborted':
        break;
      case 'SelectedNone':
        setAudioDevice(null);
        break;
      default:
        setAudioDevice(audioDevice.Selected);
    }
    setInputSourcesDisabled(false);
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" onClick={handleClick} disabled={inputSourcesDisabled} className="relative">
            {audioDevice ? <MicIcon className="w-6 h-6" /> : <MicOffIcon className="w-6 h-6" />}
            {audioDevice && (
              <div className="absolute bottom-0 right-1 bg-primary rounded-full">
                <RiCheckFill className="text-white h-4 w-4" />
              </div>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <span className="text-xs">
            {audioDevice === "" ? getText(locale, 'audioInputUnknown') : audioDevice ? audioDevice : getText(locale, 'audioInputNoSource')}
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
