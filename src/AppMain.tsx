import { AudioInputSource } from "@/components/audioInputSource";
import { RecordButton } from "@/components/recordButton";
import { VideoInputSource } from "@/components/videoInputSource";
import { RiCloseLine, RiSubtractLine } from "@remixicon/react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import sniive from "@/assets/sniive.svg";

function AppMain() {
  return (
    <main className="bg-background w-scren h-screen antialiased rounded-lg flex flex-col items-center overflow-hidden font-sans select-none">
      <header
        className="w-full grid grid-cols-3 items-center justify-center h-10"
        data-tauri-drag-region
      >
        <div
          className="flex flex-row items-center justify-start col-span-1"
          data-tauri-drag-region
        >
          <VideoInputSource data-tauri-drag-region />
          <AudioInputSource data-tauri-drag-region />
        </div>

        <div
          className="flex flex-row items-center justify-center col-span-1"
          data-tauri-drag-region
        >
          <RecordButton />
        </div>

        <div
          className="flex flex-row items-center justify-end gap-2 col-span-1 pr-2"
          data-tauri-drag-region
        >
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
      <div className="w-full h-10 relative flex items-center justify-center">
        <img src={sniive} alt="Sniive" className="h-5 py-0.5 z-10" />
      </div>
    </main>
  );
}

export default AppMain;
