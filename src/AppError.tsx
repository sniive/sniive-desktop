import { RiCloseLine, RiSubtractLine } from "@remixicon/react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open } from '@tauri-apps/plugin-shell';
import { Button } from "@/components/ui/button";
import { useAppStore } from "./state";
import { getText } from "./lib/locales";

function AppError() {
  const url = new URL(window.location.href);
  const error: string = url.searchParams.get('error') ?? 'Unknown error';

  const { locale } = useAppStore(({ locale }) => ({ locale }));

  return (
    <main className="bg-background w-scren h-screen antialiased rounded-lg flex flex-col items-center overflow-hidden font-sans select-none">
      <header className="w-full grid grid-cols-6 items-center justify-center h-10" data-tauri-drag-region>
        <div className="flex flex-row items-center justify-center col-span-4 col-start-2 truncate" data-tauri-drag-region>
          <span className="font-bold" data-tauri-drag-region>
            {getText(locale, 'error')}
          </span>
        </div>
        <div className="flex flex-row items-center justify-end gap-2 col-span-1 pr-2" data-tauri-drag-region>
          <button
            className="group h-4 w-4 rounded-full bg-red-500 hover:bg-red-600 cursor-pointer"
            onClick={async () => await getCurrentWindow().close()}
            data-tauri-drag-region
          >
            <RiCloseLine className="group-hover:opacity-100 opacity-0 h-full w-full p-1 transition-opacity" />
          </button>
          <button
            className="group h-4 w-4 rounded-full bg-yellow-500 hover:bg-yellow-600 cursor-pointer"
            onClick={async () => await getCurrentWindow().minimize()}
            data-tauri-drag-region
          >
            <RiSubtractLine className="group-hover:opacity-100 opacity-0 h-full w-full p-1 transition-opacity" />
          </button>
        </div>
      </header>

      <div className="w-full flex-1 relative flex flex-col items-center justify-center pb-1">
        <span className="text-sm truncate">
          <pre>
            {error}
          </pre>
        </span>
        <Button 
          variant="link" 
          size="sm"
          className="mt-0 py-0.5 h-auto"
          onClick={() => open("https://sniive.com")}
        >
          https://sniive.com
        </Button>
      </div>
    </main>
  )
}

export default AppError;