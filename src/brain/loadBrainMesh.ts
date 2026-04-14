import * as THREE from 'three'

const BASE = '/models/fsaverage5'

async function loadBin(path: string): Promise<ArrayBuffer> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`)
  return res.arrayBuffer()
}

export interface BrainHemisphere {
  geometry: THREE.BufferGeometry
  sulcalDepth: Float32Array // for vertex coloring
}

export async function loadHemisphere(hemi: 'lh' | 'rh'): Promise<BrainHemisphere> {
  const [vertBuf, faceBuf, sulcBuf] = await Promise.all([
    loadBin(`${BASE}/${hemi}.vertices.bin`),
    loadBin(`${BASE}/${hemi}.faces.bin`),
    loadBin(`${BASE}/${hemi}.sulc.bin`),
  ])

  const vertices = new Float32Array(vertBuf)  // 10242 * 3
  const faces = new Uint32Array(faceBuf)       // 20480 * 3
  const sulc = new Float32Array(sulcBuf)       // 10242

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
  geometry.setIndex(new THREE.BufferAttribute(faces, 1))

  // Compute vertex colors from sulcal depth
  // Sulcal depth: positive = sulcus (deep), negative = gyrus (ridge)
  const colors = new Float32Array(vertices.length)
  for (let i = 0; i < sulc.length; i++) {
    const s = sulc[i]
    // Map sulcal depth to color: gyri = lighter pink, sulci = darker
    const t = Math.max(0, Math.min(1, (s + 1.5) / 3.0)) // normalize roughly to 0-1
    // Sulci are darker, gyri are lighter
    const r = 0.55 + (1 - t) * 0.35  // 0.55 to 0.90
    const g = 0.45 + (1 - t) * 0.30  // 0.45 to 0.75
    const b = 0.50 + (1 - t) * 0.28  // 0.50 to 0.78
    colors[i * 3] = r
    colors[i * 3 + 1] = g
    colors[i * 3 + 2] = b
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  geometry.computeVertexNormals()

  return { geometry, sulcalDepth: sulc }
}

export async function loadBrain(): Promise<{
  left: BrainHemisphere
  right: BrainHemisphere
}> {
  const [left, right] = await Promise.all([
    loadHemisphere('lh'),
    loadHemisphere('rh'),
  ])
  return { left, right }
}
