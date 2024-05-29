import { create } from 'zustand'

type GlobalStoreState = {
  isAuth: boolean
  setIsAuth: (isAuth: boolean) => void
  audioBlob: Blob | null
  setAudioBlob: (audioString: Blob) => void
}

export const useGlobalStore = create<GlobalStoreState>((set) => ({
  isAuth: false,
  setIsAuth: (isAuth) => set({ isAuth }),
  audioBlob: null,
  setAudioBlob: (audioBlob) => set({ audioBlob })
}))
