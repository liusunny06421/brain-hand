import * as THREE from 'three'

/**
 * Creates a realistic brain hemisphere geometry with cortical folds (sulci/gyri).
 * Uses a sphere base with multi-octave noise displacement to simulate wrinkles.
 */

// Simple 3D noise (hash-based, good enough for geometry displacement)
function hash(x: number, y: number, z: number): number {
  let h = x * 374761393 + y * 668265263 + z * 1274126177
  h = ((h ^ (h >> 13)) * 1274126177) | 0
  return (h & 0x7fffffff) / 0x7fffffff
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function noise3D(x: number, y: number, z: number): number {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const iz = Math.floor(z)
  const fx = smoothstep(x - ix)
  const fy = smoothstep(y - iy)
  const fz = smoothstep(z - iz)

  const n000 = hash(ix, iy, iz)
  const n100 = hash(ix + 1, iy, iz)
  const n010 = hash(ix, iy + 1, iz)
  const n110 = hash(ix + 1, iy + 1, iz)
  const n001 = hash(ix, iy, iz + 1)
  const n101 = hash(ix + 1, iy, iz + 1)
  const n011 = hash(ix, iy + 1, iz + 1)
  const n111 = hash(ix + 1, iy + 1, iz + 1)

  return lerp(
    lerp(lerp(n000, n100, fx), lerp(n010, n110, fx), fy),
    lerp(lerp(n001, n101, fx), lerp(n011, n111, fx), fy),
    fz
  )
}

function fbm(x: number, y: number, z: number, octaves: number): number {
  let val = 0
  let amp = 0.5
  let freq = 1
  for (let i = 0; i < octaves; i++) {
    val += amp * noise3D(x * freq, y * freq, z * freq)
    amp *= 0.5
    freq *= 2.1
  }
  return val
}

export function createHemisphereGeometry(
  side: 'left' | 'right',
  segments: number = 64
): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, segments, segments)
  const pos = geo.attributes.position
  const normal = geo.attributes.normal

  const sideSign = side === 'left' ? -1 : 1

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i)
    let y = pos.getY(i)
    let z = pos.getZ(i)

    const nx = normal.getX(i)

    // Brain shape: elongated front-to-back, wider at sides, flatter top-bottom
    const scaleX = 0.62
    const scaleY = 0.72
    const scaleZ = 0.85

    x *= scaleX
    y *= scaleY
    z *= scaleZ

    // Shift hemisphere to one side
    x += sideSign * 0.08

    // Flatten the medial (inner) face — the interhemispheric fissure
    if ((side === 'left' && nx > 0.3) || (side === 'right' && nx < -0.3)) {
      const flatFactor = side === 'left'
        ? Math.max(0, (nx - 0.3) / 0.7)
        : Math.max(0, (-nx - 0.3) / 0.7)
      x = lerp(x, sideSign * 0.06, flatFactor * 0.7)
    }

    // Cortical folds — multi-frequency noise displacement along normal
    const noiseScale = 4.5
    const foldIntensity = 0.06
    const fold = (fbm(x * noiseScale + 7.3, y * noiseScale + 2.1, z * noiseScale + 5.7, 5) - 0.5) * foldIntensity

    // Deeper sulci using sharper noise
    const sulcusNoise = noise3D(x * 8 + 13, y * 8 + 17, z * 8 + 23)
    const sulcus = sulcusNoise < 0.35 ? -0.025 * (0.35 - sulcusNoise) / 0.35 : 0

    const displacement = fold + sulcus

    x += normal.getX(i) * displacement
    y += normal.getY(i) * displacement
    z += normal.getZ(i) * displacement

    // Frontal lobe bulge
    if (z > 0.3) {
      const bulge = (z - 0.3) * 0.15
      x += normal.getX(i) * bulge * 0.3
      z += 0.08
    }

    // Temporal lobe — slight downward and outward bulge at sides
    if (y < -0.1 && Math.abs(x) > 0.2) {
      y -= 0.08
      x += sideSign * 0.05
    }

    // Occipital lobe — slight rounding at back
    if (z < -0.4) {
      z -= 0.06
    }

    pos.setXYZ(i, x, y, z)
  }

  geo.computeVertexNormals()
  return geo
}

export function createCerebellumGeometry(segments: number = 48): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, segments, segments)
  const pos = geo.attributes.position
  const normal = geo.attributes.normal

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i)
    let y = pos.getY(i)
    let z = pos.getZ(i)

    // Cerebellum shape: wider, flatter, at the back-bottom
    x *= 0.5
    y *= 0.3
    z *= 0.35

    // Fine parallel folds (folia) — use high-frequency noise biased in one direction
    const foliaFreq = 12
    const folia = Math.sin(y * foliaFreq + noise3D(x * 6, y * 6, z * 6) * 3) * 0.012
    x += normal.getX(i) * folia
    y += normal.getY(i) * folia
    z += normal.getZ(i) * folia

    pos.setXYZ(i, x, y, z)
  }

  geo.computeVertexNormals()
  return geo
}

export function createBrainstemGeometry(segments: number = 32): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(0.12, 0.08, 0.6, segments, segments)
  const pos = geo.attributes.position

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i)
    let y = pos.getY(i)
    let z = pos.getZ(i)

    // Slight organic bulge in the middle (pons area)
    const t = (y + 0.3) / 0.6 // 0 to 1 along length
    const bulgeFactor = Math.sin(t * Math.PI) * 0.04
    x += x > 0 ? bulgeFactor : -bulgeFactor
    z += z > 0 ? bulgeFactor : -bulgeFactor

    // Slight curve
    z += Math.sin(t * Math.PI * 0.5) * 0.06

    pos.setXYZ(i, x, y, z)
  }

  geo.computeVertexNormals()
  return geo
}
