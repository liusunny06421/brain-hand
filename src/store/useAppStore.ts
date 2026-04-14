import { create } from 'zustand'

export type GestureState =
  | 'IDLE'
  | 'PINCH_ROTATE'
  | 'PINCH_ZOOM'
  | 'EXPLODE'
  | 'POINT_SELECT'
  | 'OPEN_PALM_RESET'

export interface AppState {
  // Loading
  isMediaPipeReady: boolean
  isModelLoaded: boolean
  setMediaPipeReady: (ready: boolean) => void
  setModelLoaded: (loaded: boolean) => void

  // Hand tracking
  handsDetected: number
  setHandsDetected: (count: number) => void
  webcamError: string | null
  setWebcamError: (error: string | null) => void

  // Gestures
  gestureState: GestureState
  setGestureState: (state: GestureState) => void

  // Brain transforms
  targetRotation: [number, number]
  targetZoom: number
  explodeFactor: number
  setTargetRotation: (rotation: [number, number]) => void
  setTargetZoom: (zoom: number) => void
  setExplodeFactor: (factor: number) => void

  // Region selection
  selectedRegion: string | null
  setSelectedRegion: (region: string | null) => void

  // Reset
  resetView: () => void
}

export const useAppStore = create<AppState>((set) => ({
  isMediaPipeReady: false,
  isModelLoaded: false,
  setMediaPipeReady: (ready) => set({ isMediaPipeReady: ready }),
  setModelLoaded: (loaded) => set({ isModelLoaded: loaded }),

  handsDetected: 0,
  setHandsDetected: (count) => set({ handsDetected: count }),
  webcamError: null,
  setWebcamError: (error) => set({ webcamError: error }),

  gestureState: 'IDLE',
  setGestureState: (state) => set({ gestureState: state }),

  targetRotation: [0, 0],
  targetZoom: 5,
  explodeFactor: 0,
  setTargetRotation: (rotation) => set({ targetRotation: rotation }),
  setTargetZoom: (zoom) => set({ targetZoom: zoom }),
  setExplodeFactor: (factor) => set({ explodeFactor: factor }),

  selectedRegion: null,
  setSelectedRegion: (region) => set({ selectedRegion: region }),

  resetView: () =>
    set({
      targetRotation: [0, 0],
      targetZoom: 5,
      explodeFactor: 0,
      selectedRegion: null,
      gestureState: 'IDLE',
    }),
}))
