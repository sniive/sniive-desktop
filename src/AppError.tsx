import { RiCloseLine, RiSubtractLine } from "@remixicon/react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open } from "@tauri-apps/plugin-shell";
import { Button } from "@/components/ui/button";
import { useAppStore } from "./state";
import { getText } from "./lib/locales";
import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";

function AppError() {
  const url = new URL(window.location.href);
  const error: string = url.searchParams.get("error") ?? "Unknown error";
  const { locale, setLocale } = useAppStore(({ locale, setLocale }) => ({
    locale,
    setLocale,
  }));
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(async () => {
      await invoke<boolean>("is_auth")
        .then(async (res) => {
          const locale = await invoke<string>("get_locale");
          setLocale(locale);
          if (res) {
            navigate("/main");
            clearInterval(interval);
          }
        })
        .catch(() => {
          console.error("Something went wrong");
        });
    }, 1000);
  }, []);

  return (
    <main className="bg-background w-scren h-screen antialiased rounded-lg flex flex-col items-center overflow-hidden font-sans select-none">
      <header
        className="w-full grid grid-cols-6 items-center justify-center h-10"
        data-tauri-drag-region
      >
        <div
          className="flex flex-row items-center justify-center col-span-4 col-start-2 truncate"
          data-tauri-drag-region
        >
          <span className="font-bold" data-tauri-drag-region>
            {getText(locale, "error")}
          </span>
        </div>
        <div
          className="flex flex-row items-center justify-end gap-2 col-span-1 col-start-6 pr-2"
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
      {error === "not_authenticated" ? (
        <div className="w-full flex-1 relative flex flex-row items-center justify-center pb-1 px-4">
          <span className="text-sm leading-tight text-center">
            {getText(locale, "notAuthenticatedErrorFirst")}{" "}
            <Button
              variant="link"
              size="sm"
              className="mt-0 py-0 px-0 h-auto"
              onClick={() => open("https://sniive.com")}
            >
              sniive.com
            </Button>{" "}
            {getText(locale, "notAuthenticatedErrorSecond")}
          </span>
        </div>
      ) : (
        <div className="w-full flex-1 relative flex flex-col items-center justify-center pb-1 px-4">
          <span className="text-sm truncate leading-tight">
            <pre>{error}</pre>
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
      )}
    </main>
  );
}

export default AppError;
