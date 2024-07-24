import { DesktopCapturerSource } from 'electron'
import { create } from 'zustand'

type Metadata = Partial<{
  recordingStartTime: number
  recordingEndTime: number
}>

type GlobalStoreState = {
  isAuth: boolean
  setIsAuth: (isAuth: boolean) => void
  audioBlob: Blob | null
  setAudioBlob: (audioString: Blob) => void
  metadata: Metadata | null
  setRecordingStartTime: (recordingStartTime: number) => void
  setRecordingEndTime: (recordingEndTime: number) => void
  display: DesktopCapturerSource | null
  setDisplay: (display: DesktopCapturerSource | null) => void
  locale: string | undefined
  setLocale: (locale: string | undefined) => void
}

export const useGlobalStore = create<GlobalStoreState>((set, get) => ({
  isAuth: false,
  setIsAuth: (isAuth) => set({ isAuth }),
  audioBlob: null,
  setAudioBlob: (audioBlob) => set({ audioBlob }),
  metadata: null,
  setRecordingStartTime: (recordingStartTime) =>
    set({ metadata: { ...get().metadata, recordingStartTime } }),
  setRecordingEndTime: (recordingEndTime) =>
    set({ metadata: { ...get().metadata, recordingEndTime } }),
  display: null,
  setDisplay: (display) => set({ display }),
  locale: undefined,
  setLocale: (locale) => set({ locale })
}))
