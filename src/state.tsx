import { create } from "zustand";
import { AudioDeviceOutput, Selected, SurfaceOutput } from "@/lib/types";

type AppStore = {
  inputSourcesDisabled: boolean;
  recordButtonDisabled: boolean;
  isRecording: boolean;
  audioDevice: Selected<AudioDeviceOutput> | null;
  surface: Selected<SurfaceOutput> | null;
  locale: string;
  setInputSourcesDisabled: (disabled: boolean) => void;
  setRecordButtonDisabled: (disabled: boolean) => void;
  setIsRecording: (isRecording: boolean) => void;
  setAudioDevice: (audioDevice: Selected<AudioDeviceOutput> | null) => void;
  setSurface: (surface: Selected<SurfaceOutput> | null) => void;
  setLocale: (locale: string) => void;
};

export const useAppStore = create<AppStore>((set, get) => ({
  inputSourcesDisabled: false,
  recordButtonDisabled: true,
  isRecording: false,
  audioDevice: null,
  surface: null,
  locale: "fr",
  setInputSourcesDisabled: (disabled) =>
    set({ inputSourcesDisabled: disabled }),
  setRecordButtonDisabled: (disabled) =>
    set({ recordButtonDisabled: disabled }),
  setIsRecording: (isRecording) => {
    if (isRecording) {
      set({
        isRecording,
        inputSourcesDisabled: true,
        recordButtonDisabled: false,
      });
    } else {
      set({ isRecording });
    }
  },
  setAudioDevice: (audioDevice) => {
    if (get().surface && audioDevice) {
      set({ audioDevice, recordButtonDisabled: false });
    } else {
      set({ audioDevice, recordButtonDisabled: true });
    }
  },
  setSurface: (surface) => {
    if (get().audioDevice && surface) {
      set({ surface, recordButtonDisabled: false });
    } else {
      set({ surface, recordButtonDisabled: true });
    }
  },
  setLocale: (locale) => set({ locale }),
}));
