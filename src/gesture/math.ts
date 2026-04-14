import type { Landmark } from '../types/mediapipe'
import {
  WRIST, INDEX_MCP, MIDDLE_MCP, RING_MCP, PINKY_MCP,
  THUMB_TIP, INDEX_TIP, MIDDLE_TIP, RING_TIP, PINKY_TIP,
  THUMB_MCP, INDEX_PIP, MIDDLE_PIP, RING_PIP, PINKY_PIP,
} from '../types/mediapipe'

/** Euclidean distance between two landmarks (2D, ignoring z) */
export function dist2D(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

/** Euclidean distance 3D */
export function dist3D(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

/** Center of palm: average of WRIST + 4 finger MCPs */
export function palmCenter(hand: Landmark[]): Landmark {
  const pts = [hand[WRIST], hand[INDEX_MCP], hand[MIDDLE_MCP], hand[RING_MCP], hand[PINKY_MCP]]
  const n = pts.length
  return {
    x: pts.reduce((s, p) => s + p.x, 0) / n,
    y: pts.reduce((s, p) => s + p.y, 0) / n,
    z: pts.reduce((s, p) => s + p.z, 0) / n,
  }
}

/** Midpoint between thumb tip and index tip (pinch point) */
export function pinchPoint(hand: Landmark[]): Landmark {
  const a = hand[THUMB_TIP]
  const b = hand[INDEX_TIP]
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 }
}

/** Distance between thumb tip and index tip */
export function pinchDistance(hand: Landmark[]): number {
  return dist2D(hand[THUMB_TIP], hand[INDEX_TIP])
}

/**
 * Check if a finger is extended.
 * Compares tip-to-wrist distance vs pip-to-wrist distance.
 * If tip is farther from wrist than PIP, finger is extended.
 */
export function isFingerExtended(hand: Landmark[], tipIdx: number, pipIdx: number): boolean {
  const wrist = hand[WRIST]
  const tipDist = dist2D(hand[tipIdx], wrist)
  const pipDist = dist2D(hand[pipIdx], wrist)
  return tipDist > pipDist * 1.05
}

/** Check if all 5 fingers are extended AND spread (open palm, not pinching) */
export function isOpenPalm(hand: Landmark[]): boolean {
  // Thumb: compare tip to MCP distance from wrist
  const thumbExtended = dist2D(hand[THUMB_TIP], hand[WRIST]) > dist2D(hand[THUMB_MCP], hand[WRIST]) * 1.1
  const allExtended = (
    thumbExtended &&
    isFingerExtended(hand, INDEX_TIP, INDEX_PIP) &&
    isFingerExtended(hand, MIDDLE_TIP, MIDDLE_PIP) &&
    isFingerExtended(hand, RING_TIP, RING_PIP) &&
    isFingerExtended(hand, PINKY_TIP, PINKY_PIP)
  )
  if (!allExtended) return false

  // Must NOT be pinching — thumb and index tips must be apart
  const pinchDist = dist2D(hand[THUMB_TIP], hand[INDEX_TIP])
  if (pinchDist < 0.10) return false // if thumb-index close, it's a pinch not open palm

  return true
}

/** Check if only index finger is extended (pointing) */
export function isPointing(hand: Landmark[]): boolean {
  const indexExtended = isFingerExtended(hand, INDEX_TIP, INDEX_PIP)
  const middleCurled = !isFingerExtended(hand, MIDDLE_TIP, MIDDLE_PIP)
  const ringCurled = !isFingerExtended(hand, RING_TIP, RING_PIP)
  const pinkyCurled = !isFingerExtended(hand, PINKY_TIP, PINKY_PIP)
  return indexExtended && middleCurled && ringCurled && pinkyCurled
}

/** Velocity of a landmark between frames */
export function velocity(curr: Landmark, prev: Landmark, dt: number): Landmark {
  if (dt <= 0) return { x: 0, y: 0, z: 0 }
  return {
    x: (curr.x - prev.x) / dt,
    y: (curr.y - prev.y) / dt,
    z: (curr.z - prev.z) / dt,
  }
}

/** Magnitude of a velocity vector */
export function speed(v: Landmark): number {
  return Math.sqrt(v.x * v.x + v.y * v.y)
}
