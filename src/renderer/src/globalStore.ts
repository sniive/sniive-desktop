import { create } from 'zustand'

type GlobalStoreState = {
  isAuth: boolean
  setIsAuth: (isAuth: boolean) => void
  audioString: string | null
  setAudioString: (audioString: string) => void
}

export const useGlobalStore = create<GlobalStoreState>((set) => ({
  isAuth: false,
  setIsAuth: (isAuth) => set({ isAuth }),
  audioString: null,
  setAudioString: (audioString) => set({ audioString })
}))
