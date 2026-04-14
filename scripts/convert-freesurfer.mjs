/**
 * Converts FreeSurfer binary surface files to browser-ready .bin files.
 *
 * FreeSurfer binary format:
 * - 3 magic bytes: 0xFF 0xFF 0xFE (triangle surface)
 * - Two newline-terminated comment lines
 * - Big-endian uint32: vertex count
 * - Big-endian uint32: face count
 * - For each vertex: 3x big-endian float32 (x, y, z)
 * - For each face: 3x big-endian int32 (v1, v2, v3)
 *
 * FreeSurfer curv/sulc format:
 * - 3 magic bytes: 0xFF 0xFF 0xFF (new format)
 * - Big-endian uint32: vertex count
 * - Big-endian uint32: face count
 * - Big-endian uint32: values per vertex (1)
 * - For each vertex: big-endian float32 value
 */

import fs from 'fs'
import path from 'path'

const INPUT_DIR = 'public/models/fsaverage5'
const OUTPUT_DIR = 'public/models/fsaverage5'

function parseFreeSurferSurface(buffer) {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)

  // Check magic bytes
  if (view.getUint8(0) !== 0xFF || view.getUint8(1) !== 0xFF || view.getUint8(2) !== 0xFE) {
    throw new Error('Not a FreeSurfer triangle surface file')
  }

  // Skip two comment lines (after magic bytes at offset 3)
  let offset = 3
  let newlines = 0
  while (newlines < 2 && offset < buffer.length) {
    if (view.getUint8(offset) === 0x0A) newlines++
    offset++
  }

  // Read counts (big-endian)
  const numVertices = view.getInt32(offset, false); offset += 4
  const numFaces = view.getInt32(offset, false); offset += 4

  console.log(`  Vertices: ${numVertices}, Faces: ${numFaces}`)

  // Read vertices (big-endian float32)
  const vertices = new Float32Array(numVertices * 3)
  for (let i = 0; i < numVertices * 3; i++) {
    vertices[i] = view.getFloat32(offset, false); offset += 4
  }

  // Read faces (big-endian int32 → uint32)
  const faces = new Uint32Array(numFaces * 3)
  for (let i = 0; i < numFaces * 3; i++) {
    faces[i] = view.getInt32(offset, false); offset += 4
  }

  return { vertices, faces, numVertices, numFaces }
}

function parseFreeSurferCurv(buffer) {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)

  // Check magic bytes for new curv format
  if (view.getUint8(0) === 0xFF && view.getUint8(1) === 0xFF && view.getUint8(2) === 0xFF) {
    // New format
    let offset = 3
    const numVertices = view.getInt32(offset, false); offset += 4
    const numFaces = view.getInt32(offset, false); offset += 4
    const valsPerVertex = view.getInt32(offset, false); offset += 4

    console.log(`  Curv vertices: ${numVertices}, vals/vertex: ${valsPerVertex}`)

    const values = new Float32Array(numVertices)
    for (let i = 0; i < numVertices; i++) {
      values[i] = view.getFloat32(offset, false); offset += 4
    }
    return values
  }

  throw new Error('Unknown curv format')
}

// Process hemispheres
for (const hemi of ['lh', 'rh']) {
  console.log(`Processing ${hemi}...`)

  // Parse pial surface
  const surfBuf = fs.readFileSync(path.join(INPUT_DIR, `${hemi}.pial`))
  const { vertices, faces } = parseFreeSurferSurface(surfBuf)

  // Parse sulcal depth
  const sulcBuf = fs.readFileSync(path.join(INPUT_DIR, `${hemi}.sulc`))
  const sulc = parseFreeSurferCurv(sulcBuf)

  // Write as little-endian binary (native for browsers)
  fs.writeFileSync(
    path.join(OUTPUT_DIR, `${hemi}.vertices.bin`),
    Buffer.from(vertices.buffer)
  )
  fs.writeFileSync(
    path.join(OUTPUT_DIR, `${hemi}.faces.bin`),
    Buffer.from(faces.buffer)
  )
  fs.writeFileSync(
    path.join(OUTPUT_DIR, `${hemi}.sulc.bin`),
    Buffer.from(sulc.buffer)
  )

  console.log(`  Written: ${hemi}.vertices.bin (${(vertices.byteLength / 1024).toFixed(0)} KB)`)
  console.log(`  Written: ${hemi}.faces.bin (${(faces.byteLength / 1024).toFixed(0)} KB)`)
  console.log(`  Written: ${hemi}.sulc.bin (${(sulc.byteLength / 1024).toFixed(0)} KB)`)
}

console.log('Done!')
