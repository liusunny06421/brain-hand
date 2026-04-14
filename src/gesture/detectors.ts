import type { HandLandmarks } from '../types/mediapipe'
import {
  pinchDistance, pinchPoint, palmCenter, dist2D,
  isOpenPalm, isPointing, velocity, speed,
} from './math'
import type { Landmark } from '../types/mediapipe'
import { INDEX_TIP } from '../types/mediapipe'

// --- Thresholds ---
const PINCH_ENTER = 0.07   // normalized distance to start pinch
const PINCH_EXIT = 0.10    // hysteresis: larger to exit

// --- Detector results ---

export interface PinchRotateResult {
  detected: boolean
  deltaX: number  // horizontal movement delta
  deltaY: number  // vertical movement delta
  pinchPos: Landmark
}

export interface PinchZoomResult {
  detected: boolean
  zoomDelta: number  // positive = zoom in, negative = zoom out
}

export interface ExplodeResult {
  detected: boolean
  spreadFactor: number  // 0 = closed, 1+ = spread
}

export interface PointSelectResult {
  detected: boolean
  target: [number, number]  // normalized screen coords (mirrored for webcam)
}

export interface OpenPalmResetResult {
  detected: boolean
  stationaryDuration: number  // seconds hand has been still
}

// --- Detectors ---

/** Single-hand pinch + drag → rotation */
export function detectPinchRotate(
  hand: HandLandmarks,
  prevHand: HandLandmarks | null,
  wasPinching: boolean,
): PinchRotateResult {
  const dist = pinchDistance(hand)
  const threshold = wasPinching ? PINCH_EXIT : PINCH_ENTER
  const isPinching = dist < threshold
  const pos = pinchPoint(hand)

  let deltaX = 0
  let deltaY = 0
  if (isPinching && prevHand) {
    const prevPos = pinchPoint(prevHand)
    // Negate X because webcam is mirrored
    deltaX = -(pos.x - prevPos.x)
    deltaY = pos.y - prevPos.y
  }

  return { detected: isPinching, deltaX, deltaY, pinchPos: pos }
}

/** Two-hand pinch → zoom (distance between pinch points) */
export function detectPinchZoom(
  left: HandLandmarks,
  right: HandLandmarks,
  prevLeft: HandLandmarks | null,
  prevRight: HandLandmarks | null,
): PinchZoomResult {
  const leftPinch = pinchDistance(left) < PINCH_EXIT
  const rightPinch = pinchDistance(right) < PINCH_EXIT

  if (!leftPinch || !rightPinch) {
    return { detected: false, zoomDelta: 0 }
  }

  const leftPos = pinchPoint(left)
  const rightPos = pinchPoint(right)
  const currDist = dist2D(leftPos, rightPos)

  if (!prevLeft || !prevRight) {
    return { detected: true, zoomDelta: 0 }
  }

  const prevLeftPos = pinchPoint(prevLeft)
  const prevRightPos = pinchPoint(prevRight)
  const prevDist = dist2D(prevLeftPos, prevRightPos)

  const zoomDelta = (currDist - prevDist) * 8 // amplify

  return { detected: true, zoomDelta }
}

/** Two hands open + actively spreading apart → explode */
export function detectExplode(
  left: HandLandmarks,
  right: HandLandmarks,
  prevLeft: HandLandmarks | null,
  prevRight: HandLandmarks | null,
): ExplodeResult {
  // Both hands must be fully open (not pinching)
  if (!isOpenPalm(left) || !isOpenPalm(right)) {
    return { detected: false, spreadFactor: 0 }
  }

  const leftCenter = palmCenter(left)
  const rightCenter = palmCenter(right)
  const currDist = dist2D(leftCenter, rightCenter)

  // Hands must be wide apart — high threshold to avoid accidental triggers
  const baseDist = 0.45 // only triggers when hands are very spread
  const spreadFactor = Math.max(0, (currDist - baseDist) / 0.4)

  if (spreadFactor < 0.1) {
    return { detected: false, spreadFactor: 0 }
  }

  // Must be actively spreading — require outward velocity
  if (prevLeft && prevRight) {
    const prevLeftCenter = palmCenter(prevLeft)
    const prevRightCenter = palmCenter(prevRight)
    const prevDist = dist2D(prevLeftCenter, prevRightCenter)
    const isSpreadingOrHolding = currDist > prevDist - 0.01
    if (!isSpreadingOrHolding) {
      return { detected: false, spreadFactor: 0 }
    }
  }

  return { detected: true, spreadFactor: Math.min(spreadFactor, 1.5) }
}

/** Single hand pointing → select brain region */
export function detectPointSelect(hand: HandLandmarks): PointSelectResult {
  if (!isPointing(hand)) {
    return { detected: false, target: [0, 0] }
  }

  const tip = hand[INDEX_TIP]
  // Mirror X for webcam, map to [-1, 1] NDC range
  return {
    detected: true,
    target: [-(tip.x * 2 - 1), -(tip.y * 2 - 1)],
  }
}

/** Open palm held stationary → reset view */
let palmStationaryStart = 0
let lastPalmPos: Landmark | null = null

export function detectOpenPalmReset(
  hand: HandLandmarks,
  now: number,
): OpenPalmResetResult {
  if (!isOpenPalm(hand)) {
    palmStationaryStart = 0
    lastPalmPos = null
    return { detected: false, stationaryDuration: 0 }
  }

  const center = palmCenter(hand)

  if (lastPalmPos) {
    const moved = dist2D(center, lastPalmPos)
    if (moved > 0.02) {
      // Hand moved — reset timer
      palmStationaryStart = now
    }
  } else {
    palmStationaryStart = now
  }

  lastPalmPos = center
  const duration = (now - palmStationaryStart) / 1000

  return {
    detected: duration > 1.0, // 1 second stationary
    stationaryDuration: duration,
  }
}
