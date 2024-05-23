import { create } from 'zustand'

type GlobalStoreState = {
  isAuth: boolean
  setIsAuth: (isAuth: boolean) => void
  audioBlob: string | null
  setAudioBlob: (audioBlob: string) => void
}

export const useGlobalStore = create<GlobalStoreState>((set) => ({
  isAuth: false,
  setIsAuth: (isAuth) => set({ isAuth }),
  audioBlob: null,
  setAudioBlob: (audioBlob) => set({ audioBlob })
}))
