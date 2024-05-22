import { create } from 'zustand'

type GlobalStoreState = {
  isAuth: boolean
  setIsAuth: (isAuth: boolean) => void
}

export const useGlobalStore = create<GlobalStoreState>((set) => ({
  isAuth: false,
  setIsAuth: (isAuth) => set({ isAuth })
}))
