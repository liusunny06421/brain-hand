import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import type { HandLandmarks } from '../types/mediapipe'
import { useAppStore } from '../store/useAppStore'
import { updateGestureState } from '../gesture/stateMachine'
import { pinchDistance, isOpenPalm, isPointing, palmCenter, dist2D } from '../gesture/math'

let logCounter = 0

export function useGestureRecognition(
  landmarksRef: MutableRefObject<HandLandmarks[]>,
  handednessRef: MutableRefObject<string[]>,
) {
  const prevLandmarksRef = useRef<HandLandmarks[]>([])
  const animRef = useRef<number>(0)

  const setGestureState = useAppStore((s) => s.setGestureState)
  const setTargetRotation = useAppStore((s) => s.setTargetRotation)
  const setTargetZoom = useAppStore((s) => s.setTargetZoom)
  const setExplodeFactor = useAppStore((s) => s.setExplodeFactor)
  const resetView = useAppStore((s) => s.resetView)
  const isMediaPipeReady = useAppStore((s) => s.isMediaPipeReady)

  // Top-level: confirm hook is called
  console.log('[gesture] hook called, isMediaPipeReady =', isMediaPipeReady)

  useEffect(() => {
    console.log('[gesture] useEffect fired, isMediaPipeReady =', isMediaPipeReady)

    if (!isMediaPipeReady) {
      console.log('[gesture] waiting for MediaPipe...')
      return
    }

    console.log('[gesture] MediaPipe ready — starting gesture loop')

    function tick() {
      const hands = landmarksRef.current
      const handedness = handednessRef.current
      const prevHands = prevLandmarksRef.current

      // Debug: log every 60 frames (~1/sec)
      logCounter++
      if (logCounter % 60 === 0 && hands.length > 0) {
        console.log(`[gesture] hands=${hands.length}, handedness=${handedness.join(',')}`)

        // Log raw detector values for threshold calibration
        try {
          const hand = hands[0]
          console.log(`[gesture] hand[0] length=${hand.length}, sample=${JSON.stringify(hand[0])}`)
          const pd = pinchDistance(hand)
          const op = isOpenPalm(hand)
          const pt = isPointing(hand)
          const pc = palmCenter(hand)
          console.log(`[gesture] pinchDist=${pd.toFixed(4)}, openPalm=${op}, pointing=${pt}, palm=(${pc.x.toFixed(2)},${pc.y.toFixed(2)})`)
        } catch (e) {
          console.error('[gesture] detector error:', e)
        }
      }

      const params = updateGestureState(hands, handedness, prevHands, performance.now())

      // Store previous landmarks for next frame
      prevLandmarksRef.current = hands.map(h => h.map(lm => ({ ...lm })))

      // Log state transitions
      const prevState = useAppStore.getState().gestureState
      if (params.state !== prevState) {
        console.log(`[gesture] ${prevState} -> ${params.state}`, params)
      }

      setGestureState(params.state)

      const store = useAppStore.getState()

      // Apply rotation deltas immediately — no dead zone for snappy feel
      if (params.rotationDelta) {
        const sensitivity = 4.0
        const [dx, dy] = params.rotationDelta
        const [rx, ry] = store.targetRotation
        setTargetRotation([
          Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rx + dy * sensitivity)),
          ry + dx * sensitivity,
        ])
      }

      switch (params.state) {
        case 'PINCH_ROTATE':
          // rotation already applied above
          break

        case 'PINCH_ZOOM': {
          if (params.zoomDelta) {
            const curr = store.targetZoom
            const sensitivity = 5.0
            setTargetZoom(
              Math.max(1.5, Math.min(8, curr - params.zoomDelta * sensitivity))
            )
          }
          break
        }

        case 'EXPLODE': {
          if (params.spreadFactor !== undefined) {
            setExplodeFactor(params.spreadFactor)
          }
          break
        }

        case 'OPEN_PALM_RESET': {
          resetView()
          break
        }

        case 'POINT_SELECT':
          break

        case 'IDLE': {
          if (store.explodeFactor > 0.01) {
            setExplodeFactor(store.explodeFactor * 0.95)
          } else if (store.explodeFactor !== 0) {
            setExplodeFactor(0)
          }
          break
        }
      }

      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [
    isMediaPipeReady, landmarksRef, handednessRef,
    setGestureState, setTargetRotation, setTargetZoom,
    setExplodeFactor, resetView,
  ])
}
