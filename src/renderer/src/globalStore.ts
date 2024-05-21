import { create } from 'zustand'

type GlobalStoreState = {
  memory: Array<{ image: ImageBitmap; data: string }>
  sendInfo: { spaceName: string; accessCode: string } | null
  addMemory: (image: ImageBitmap, data: string) => void
  clearMemory: () => void
  setSendInfo: (spaceName: string, accessCode: string) => void
}

export const useGlobalStore = create<GlobalStoreState>((set) => ({
  memory: [],
  sendInfo: null,
  addMemory: (image, data) => set((state) => ({ memory: [...state.memory, { image, data }] })),
  clearMemory: () => set({ memory: [] }),
  setSendInfo: (spaceName, accessCode) => set({ sendInfo: { spaceName, accessCode } })
}))
