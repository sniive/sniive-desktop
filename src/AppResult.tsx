import { Button } from "@/components/ui/button";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { useAppStore } from "./state";
import { getText } from "./lib/locales";

export function AppResult() {
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const { locale } = useAppStore(({ locale }) => ({ locale }));

  const handleSubmit = async () => {
    setLoading(true);
    invoke<boolean>("finish_recording")
      .then(async (res) => {
        if (!res) {
          setLoading(false);
          return;
        }
        setSuccess(true);
        setTimeout(async () => {
          await getCurrentWindow().close();
        }, 2000);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  const handleCancel = async () => {
    await getCurrentWindow().close();
  };

  return (
    <main className="bg-background w-scren h-screen antialiased rounded-lg flex flex-col items-center overflow-hidden font-sans select-none">
      <header
        className="w-full flex items-center justify-center h-10"
        data-tauri-drag-region
      >
        <span className="font-bold" data-tauri-drag-region>
          {getText(locale, "results")}
        </span>
      </header>
      <div className="w-full flex-1 relative flex flex-row items-center justify-center pb-1">
        {success ? (
          <span className="text-sm">{getText(locale, "resultsDone")}</span>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="default"
              size="sm"
              className="py-1 px-2 h-auto w-full"
              onClick={handleSubmit}
              disabled={loading}
            >
              {getText(locale, "resultsSubmit")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="py-1 px-2 h-auto w-full"
              onClick={handleCancel}
              disabled={loading}
            >
              {getText(locale, "resultsCancel")}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
