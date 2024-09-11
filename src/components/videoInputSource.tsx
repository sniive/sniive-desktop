import { ScreenShareIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { getText } from '@/lib/locales'
import { SurfaceOutput } from '@/lib/types'
import { invoke } from '@tauri-apps/api/core'
import { useAppStore } from '@/state'
import { RiCheckFill } from '@remixicon/react'


export function VideoInputSource() {
  const { inputSourcesDisabled, surface, setSurface, setInputSourcesDisabled, locale } = useAppStore(({ inputSourcesDisabled, surface, setSurface, setInputSourcesDisabled, locale }) => ({ inputSourcesDisabled, surface, setSurface, setInputSourcesDisabled, locale }));

  const handleClick = async () => {
    setInputSourcesDisabled(true);
    const surface = await invoke<SurfaceOutput>('select_surface')
    switch (surface) {
      case 'Aborted':
        break;
      case 'SelectedNone':
        setSurface(null);
        break;
      default:
        setSurface({ ...surface.Selected });
    }
    setInputSourcesDisabled(false);
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" onClick={handleClick} disabled={inputSourcesDisabled} className="relative">
            <ScreenShareIcon className="w-6 h-6" />
            {surface && (
              <div className="absolute bottom-0 right-1 bg-primary rounded-full">
                <RiCheckFill className="text-white h-4 w-4" />
              </div>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <span className='text-xs'>
            {surface
              ? surface.title ?? getText(locale, 'videoInputUnknown')
              : getText(locale, 'videoInputNoSource')}
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
