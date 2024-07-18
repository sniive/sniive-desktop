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
  displayId: string
  setDisplayId: (displayId: string) => void
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
  displayId: '',
  setDisplayId: (displayId) => set({ displayId })
}))
