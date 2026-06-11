import { create } from 'zustand'

interface LayoutState {
  sidebarOpen: boolean
  artifactsOpen: boolean
  sidebarWidth: number
  artifactsWidth: number
  toggleSidebar: () => void
  toggleArtifacts: () => void
  setSidebarWidth: (w: number) => void
  setArtifactsWidth: (w: number) => void
}

export const useLayoutStore = create<LayoutState>(set => ({
  sidebarOpen: true,
  artifactsOpen: false,
  sidebarWidth: 260,
  artifactsWidth: 400,
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  toggleArtifacts: () => set(s => ({ artifactsOpen: !s.artifactsOpen })),
  setSidebarWidth: w => set({ sidebarWidth: w }),
  setArtifactsWidth: w => set({ artifactsWidth: w }),
}))
