import type { HandLandmarks } from '../types/mediapipe'
import type { GestureState, GestureParams } from '../types/gestures'
import {
  detectPinchRotate,
  detectPinchZoom,
  detectExplode,
  detectPointSelect,
  detectOpenPalmReset,
} from './detectors'

const DEBOUNCE_FRAMES = 1 // minimal debounce for low latency

interface StateMachineState {
  current: GestureState
  candidateState: GestureState
  candidateFrames: number
  wasPinching: boolean
}

const state: StateMachineState = {
  current: 'IDLE',
  candidateState: 'IDLE',
  candidateFrames: 0,
  wasPinching: false,
}

/**
 * Try to transition to a new state with debounce.
 * Returns true if the state has transitioned (or is already in that state).
 */
function tryTransition(newState: GestureState): boolean {
  // Already in this state
  if (newState === state.current) {
    state.candidateState = newState
    state.candidateFrames = 0
    return true
  }

  // Accumulate debounce for this candidate
  if (newState === state.candidateState) {
    state.candidateFrames++
    if (state.candidateFrames >= DEBOUNCE_FRAMES) {
      state.current = newState
      state.candidateFrames = 0
      return true
    }
  } else {
    state.candidateState = newState
    state.candidateFrames = 1
  }

  return false
}

export function updateGestureState(
  hands: HandLandmarks[],
  handedness: string[],
  prevHands: HandLandmarks[],
  now: number,
): GestureParams {
  if (hands.length === 0) {
    tryTransition('IDLE')
    state.wasPinching = false
    return { state: state.current }
  }

  // Identify left/right hands
  let leftHand: HandLandmarks | null = null
  let rightHand: HandLandmarks | null = null
  let prevLeft: HandLandmarks | null = null
  let prevRight: HandLandmarks | null = null

  for (let i = 0; i < hands.length; i++) {
    const label = handedness[i]?.toLowerCase()
    if (label === 'left') {
      rightHand = hands[i]
      if (prevHands[i]) prevRight = prevHands[i]
    } else {
      leftHand = hands[i]
      if (prevHands[i]) prevLeft = prevHands[i]
    }
  }

  // --- Detect all gestures first, then pick the best one ---

  let detected: GestureState = 'IDLE'
  let params: GestureParams = { state: 'IDLE' }

  // Priority 1: Two-hand gestures
  if (leftHand && rightHand) {
    const zoom = detectPinchZoom(leftHand, rightHand, prevLeft, prevRight)
    if (zoom.detected) {
      detected = 'PINCH_ZOOM'
      params = { state: 'PINCH_ZOOM', zoomDelta: zoom.zoomDelta }
    }

    if (detected === 'IDLE') {
      const explode = detectExplode(leftHand, rightHand, prevLeft, prevRight)
      if (explode.detected) {
        detected = 'EXPLODE'
        params = { state: 'EXPLODE', spreadFactor: explode.spreadFactor }
      }
    }
  }

  // Priority 2: Single-hand gestures
  const hand = hands[0]
  const prevHand = prevHands[0] || null

  if (detected === 'IDLE') {
    const rotate = detectPinchRotate(hand, prevHand, state.wasPinching)
    if (rotate.detected) {
      detected = 'PINCH_ROTATE'
      params = {
        state: 'PINCH_ROTATE',
        rotationDelta: [rotate.deltaX, rotate.deltaY],
      }
      state.wasPinching = true
    } else {
      state.wasPinching = false
    }
  }

  if (detected === 'IDLE') {
    const point = detectPointSelect(hand)
    if (point.detected) {
      detected = 'POINT_SELECT'
      params = { state: 'POINT_SELECT', pointTarget: point.target }
    }
  }

  if (detected === 'IDLE') {
    const reset = detectOpenPalmReset(hand, now)
    if (reset.detected) {
      detected = 'OPEN_PALM_RESET'
      params = { state: 'OPEN_PALM_RESET' }
    }
  }

  // --- Apply debounce: only transition after N consistent frames ---
  const transitioned = tryTransition(detected)

  // Return the CURRENT state (which may still be the old state during debounce)
  // but include the detected params so rotation deltas apply immediately
  if (transitioned || detected === state.current) {
    return { ...params, state: state.current }
  }

  // During debounce: return current state but with detected gesture's params
  // This allows rotation to feel responsive even before debounce completes
  if (detected === 'PINCH_ROTATE' && state.candidateState === 'PINCH_ROTATE') {
    return { ...params, state: state.current }
  }

  return { state: state.current }
}

export function resetStateMachine(): void {
  state.current = 'IDLE'
  state.candidateState = 'IDLE'
  state.candidateFrames = 0
  state.wasPinching = false
}
