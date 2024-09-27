import { cn, useError } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/state";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";

export function RecordButton() {
  const navigate = useNavigate();
  const error = useError();
  const { recordButtonDisabled, isRecording, setIsRecording } = useAppStore(
    ({ recordButtonDisabled, isRecording, setIsRecording }) => ({
      recordButtonDisabled,
      isRecording,
      setIsRecording,
    }),
  );

  const startRecording = async () => {
    await invoke<void>("start_input")
      .then(() => setIsRecording(true))
      .catch((err) => error(String(err)));
  };

  const stopRecording = async () => {
    await invoke<void>("stop_input")
      .then(() => {
        setIsRecording(false);
        navigate("/result");
      })
      .catch((err) => error(String(err)));
  };

  return (
    <Button
      variant="ghost"
      className={cn(
        "h-6 w-6 rounded-full outline outline-offset-2 transition-colors duration-200 p-0",
        recordButtonDisabled
          ? "bg-gradient-to-t from-gray-500 to-gray-500 /80 bg-[length:100%_100%] bg-[bottom] hover:bg-[length:100%_150%] outline-gray-500 hover:outline-gray-600 "
          : "bg-gradient-to-t from-primary to-primary/80 bg-[length:100%_100%] bg-[bottom] hover:bg-[length:100%_150%] outline-primary hover:outline-main-800",
        isRecording &&
          "bg-gradient-to-t from-red-500 to-red-500/80 bg-[length:100%_100%] bg-[bottom] outline-red-500 animate-pulse duration-700",
      )}
      onClick={() => (isRecording ? stopRecording() : startRecording())}
      disabled={recordButtonDisabled}
    />
  );
}
