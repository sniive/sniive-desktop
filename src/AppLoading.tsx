import { RiCloseLine, RiLoader4Fill, RiSubtractLine } from "@remixicon/react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useError } from "@/lib/utils";
import { useAppStore } from "@/state";
import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";
import { getCurrent } from "@tauri-apps/plugin-deep-link";

export function AppLoading() {
  const error = useError();
  const navigate = useNavigate();
  const { setLocale } = useAppStore(({ setLocale }) => ({ setLocale }));
  const checks = useRef<number>(0);

  useEffect(() => {
    getCurrent()
      .then(async (urls) => {
        if (urls) {
          await invoke<void>("set_auth", { urls }).catch(error);
        }
      })
      .catch(error);

    // every 100ms, check if the user is auth, for a max of 3s
    const interval = setInterval(async () => {
      if (checks.current >= 30) {
        error("Not authenticated");
        clearInterval(interval);
        return;
      }

      await invoke<boolean>("is_auth")
        .then(async (res) => {
          if (res) {
            const locale = await invoke<string>("get_locale");
            setLocale(locale);
            navigate("/main");
            clearInterval(interval);
          }
        })
        .catch(() => {
          error("Something went wrong");
        });

      checks.current++;
    }, 100);
  }, []);

  return (
    <main className="bg-background w-scren h-screen antialiased rounded-lg flex flex-col items-center overflow-hidden font-sans select-none">
      <header
        className="w-full grid grid-cols-6 items-center justify-center h-10"
        data-tauri-drag-region
      >
        <div
          className="flex flex-row items-center justify-end gap-2 col-start-6 col-span-1 pr-2"
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

      <div className="w-full flex-1 relative flex flex-col items-center justify-center pb-1">
        <RiLoader4Fill className="animate-spin h-10 w-10 text-primary" />
      </div>
    </main>
  );
}

export default AppLoading;
