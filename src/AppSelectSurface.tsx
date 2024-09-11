import { useEffect, useState } from "react";
import { Surface } from "@/lib/types";
import { RiCloseLine, RiSubtractLine } from "@remixicon/react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "./components/ui/separator";
import { useAppStore } from "./state";
import { getText } from "./lib/locales";

function AppSelectSurface() {
  const [windows, setWindows] = useState<Surface[]>([]);
  const [displays, setDisplays] = useState<Surface[]>([]);

  const { locale } = useAppStore(({ locale }) => ({ locale }));

  useEffect(() => {
    getCurrentWebviewWindow().once<Surface[]>('surfaces', async ({ payload }) => {
      const windows = payload.filter(surface => surface.surface_type === 'Window');
      const displays = payload.filter(surface => surface.surface_type === 'Display');

      setWindows(windows);
      setDisplays(displays);
    }).then(async () => {
      await getCurrentWebviewWindow().emit('ready');
    })

    getCurrentWebviewWindow().onCloseRequested(async () => {
      await getCurrentWebviewWindow().emit('selected', "Aborted");
    });
  }, []);


  return (
    <main className="bg-background w-scren h-screen antialiased rounded-lg flex flex-col items-center overflow-hidden font-sans select-none">
      <header className="w-full grid grid-cols-6 items-center justify-center h-10">
        <div className="flex flex-row items-center justify-start col-span-1" data-tauri-drag-region>
          <Button
            variant="ghost"
            onClick={async () => await getCurrentWebviewWindow().emit('selected', "SelectedNone")}
          >
            {getText(locale, 'selectionNone')}
          </Button>
        </div>

        <div className="flex flex-row items-center justify-center col-span-4 col-start-2 truncate" data-tauri-drag-region>
          <span className="font-bold" data-tauri-drag-region>
            {getText(locale, 'selectionQuestion')}
          </span>
        </div>

        <div className="flex flex-row items-center justify-end gap-2 col-span-1 pr-2" data-tauri-drag-region>
          <button
            className="group h-4 w-4 rounded-full bg-red-500 hover:bg-red-600 cursor-pointer"
            onClick={async () => await getCurrentWebviewWindow().close()}
            data-tauri-drag-region
          >
            <RiCloseLine className="group-hover:opacity-100 opacity-0 h-full w-full p-1 transition-opacity" />
          </button>
          <button
            className="group h-4 w-4 rounded-full bg-yellow-500 hover:bg-yellow-600 cursor-pointer"
            onClick={async () => await getCurrentWebviewWindow().minimize()}
            data-tauri-drag-region
          >
            <RiSubtractLine className="group-hover:opacity-100 opacity-0 h-full w-full p-1 transition-opacity" />
          </button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden w-full">
        <ScrollArea className="w-full h-full">
          <div className="flex flex-col w-full gap-1 p-1">
            {windows.length > 0 && (
              <>
                <span className="font-bold ml-4">
                  {getText(locale, 'selectionWindows')}
                </span>
                {windows.map(({ id, title, thumbnail, program, surface_type }) => (
                  <button
                    key={id}
                    className="grid grid-cols-8 items-center w-full overflow-hidden gap-1 p-1 hover:bg-accent"
                    onClick={async () => await getCurrentWebviewWindow().emit('selected', { Selected: { id, surface_type } })}
                  >
                    <img src={`data:image/png;base64,${thumbnail}`} alt={title} className="col-span-2 rounded-md max-h-20 m-auto" />
                    <span className="col-span-4 line-clamp-3 text-left leading-tight text-sm">{title}</span>
                    <span className="col-span-2 font-semibold truncate leading-tight px-2">{program}</span>
                  </button>
                ))}
              </>
            )}

            {displays.length > 0 && windows.length > 0 && (
              <Separator className="mt-2" />
            )}

            {displays.length > 0 && (
              <>
                <span className="font-bold ml-4">
                  {getText(locale, 'selectionDisplays')}
                </span>
                {displays.map(({ id, title, thumbnail, program, surface_type }, index) => (
                  <button
                    key={id}
                    className="grid grid-cols-8 items-center w-full overflow-hidden gap-1 p-1 hover:bg-accent"
                    onClick={async () => await getCurrentWebviewWindow().emit('selected', { Selected: { id, surface_type } })}
                  >
                    <img src={`data:image/png;base64,${thumbnail}`} alt={title} className="col-span-2 rounded-md m-auto max-h-20" />
                    <span className="col-span-4 line-clamp-3 text-left leading-tight text-sm">{`Monitor n°${index + 1}`}</span>
                    <span className="col-span-2 font-semibold truncate leading-tight px-2">{program}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </main>
  )
}

export default AppSelectSurface;