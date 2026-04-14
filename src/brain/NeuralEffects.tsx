import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Cascade waves — bright pulses that ripple outward across the cortex surface.
 * Each wave starts at a random vertex and spreads radially, lighting up
 * nearby vertices based on distance from the origin over time.
 */

interface Wave {
  origin: THREE.Vector3
  birthTime: number
  speed: number      // units per second
  maxRadius: number
  color: THREE.Color
}

export function CascadeWaves({ geometry }: { geometry: THREE.BufferGeometry }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const wavesRef = useRef<Wave[]>([])
  const nextWaveTime = useRef(0)

  // Pre-compute vertex positions array for fast distance checks
  const vertexPositions = useMemo(() => {
    const pos = geometry.attributes.position
    const arr: THREE.Vector3[] = []
    for (let i = 0; i < pos.count; i++) {
      arr.push(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)))
    }
    return arr
  }, [geometry])

  // Color attribute for per-vertex glow
  const colorAttr = useMemo(() => {
    const colors = new Float32Array(vertexPositions.length * 3)
    // Base color: dark blue-gray
    for (let i = 0; i < vertexPositions.length; i++) {
      colors[i * 3] = 0.08
      colors[i * 3 + 1] = 0.12
      colors[i * 3 + 2] = 0.18
    }
    const attr = new THREE.BufferAttribute(colors, 3)
    return attr
  }, [vertexPositions])

  // Attach color attribute
  useEffect(() => {
    geometry.setAttribute('color', colorAttr)
  }, [geometry, colorAttr])

  // Wave palette — cool blues and cyans
  const palette = useMemo(() => [
    new THREE.Color('#33aaff'),
    new THREE.Color('#55ccff'),
    new THREE.Color('#4488ee'),
    new THREE.Color('#66ddff'),
    new THREE.Color('#2299dd'),
  ], [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    // Spawn new wave
    if (t > nextWaveTime.current) {
      const idx = Math.floor(Math.random() * vertexPositions.length)
      const origin = vertexPositions[idx]
      wavesRef.current.push({
        origin: origin.clone(),
        birthTime: t,
        speed: 25 + Math.random() * 35, // mm per second
        maxRadius: 40 + Math.random() * 30,
        color: palette[Math.floor(Math.random() * palette.length)],
      })
      nextWaveTime.current = t + 0.6 + Math.random() * 1.2
    }

    // Remove expired waves
    wavesRef.current = wavesRef.current.filter(w => {
      const age = t - w.birthTime
      const radius = age * w.speed
      return radius < w.maxRadius + 15 // keep a bit after max for fade tail
    })

    // Reset colors to base
    const colors = colorAttr.array as Float32Array
    for (let i = 0; i < vertexPositions.length; i++) {
      colors[i * 3] = 0.08
      colors[i * 3 + 1] = 0.12
      colors[i * 3 + 2] = 0.18
    }

    // Apply each active wave
    for (const wave of wavesRef.current) {
      const age = t - wave.birthTime
      const waveFront = age * wave.speed
      const waveWidth = 8 // width of the bright band

      for (let i = 0; i < vertexPositions.length; i++) {
        const dist = vertexPositions[i].distanceTo(wave.origin)

        // Distance from the wave front
        const d = Math.abs(dist - waveFront)

        if (d < waveWidth) {
          // Brightness falls off with distance from wave front
          const intensity = (1 - d / waveWidth)
          // Also fade out as wave expands
          const ageFade = Math.max(0, 1 - waveFront / wave.maxRadius)
          const brightness = intensity * intensity * ageFade * 0.8

          // Additive blend
          colors[i * 3] = Math.min(1, colors[i * 3] + wave.color.r * brightness)
          colors[i * 3 + 1] = Math.min(1, colors[i * 3 + 1] + wave.color.g * brightness)
          colors[i * 3 + 2] = Math.min(1, colors[i * 3 + 2] + wave.color.b * brightness)
        }
      }
    }

    colorAttr.needsUpdate = true
  })

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={0.6}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}
