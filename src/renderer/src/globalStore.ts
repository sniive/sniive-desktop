import { create } from 'zustand'

type Metadata = {
  recordingStartTime?: number
  screenWidth?: number
  screenHeight?: number
}

type GlobalStoreState = {
  isAuth: boolean
  setIsAuth: (isAuth: boolean) => void
  audioBlob: Blob | null
  setAudioBlob: (audioString: Blob) => void
  metadata: Metadata | null
  setRecordingStartTime: (recordingStartTime: number) => void
  setScreenDimensions: (screenDimensions: { screenWidth: number; screenHeight: number }) => void
}

export const useGlobalStore = create<GlobalStoreState>((set, get) => ({
  isAuth: false,
  setIsAuth: (isAuth) => set({ isAuth }),
  audioBlob: null,
  setAudioBlob: (audioBlob) => set({ audioBlob }),
  metadata: null,
  setRecordingStartTime: (recordingStartTime) =>
    set({ metadata: { ...get().metadata, recordingStartTime } }),
  setScreenDimensions: (screenDimensions) =>
    set({ metadata: { ...get().metadata, ...screenDimensions } })
}))
