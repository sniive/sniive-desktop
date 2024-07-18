import { create } from 'zustand'

type Metadata = Partial<{
  recordingStartTime: number
  recordingEndTime: number
  screenWidth: number
  screenHeight: number
  screenOffsetX: number
  screenOffsetY: number
}>

type GlobalStoreState = {
  isAuth: boolean
  setIsAuth: (isAuth: boolean) => void
  audioBlob: Blob | null
  setAudioBlob: (audioString: Blob) => void
  metadata: Metadata | null
  setRecordingStartTime: (recordingStartTime: number) => void
  setRecordingEndTime: (recordingEndTime: number) => void
  setScreenDimensions: (screenDimensions: { screenWidth: number; screenHeight: number }) => void
  setScreenOffset: (screenOffset: { screenOffsetX: number; screenOffsetY: number }) => void
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
  setScreenDimensions: (screenDimensions) =>
    set({ metadata: { ...get().metadata, ...screenDimensions } }),
  setScreenOffset: (screenOffset) => set({ metadata: { ...get().metadata, ...screenOffset } })
}))
