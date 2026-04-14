import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { BrainRegionData } from '../types/brain'

interface Props {
  regionData: BrainRegionData
  geometry: THREE.BufferGeometry
  basePosition: [number, number, number]
  isSelected: boolean
  explodeFactor: number
  onClick: () => void
  onPointerOver: () => void
  onPointerOut: () => void
  isHovered: boolean
}

export function BrainRegion({
  regionData,
  geometry,
  basePosition,
  isSelected,
  explodeFactor,
  onClick,
  onPointerOver,
  onPointerOut,
  isHovered,
}: Props) {
  const meshRef = useRef<THREE.Mesh>(null)

  const explodeTarget = useMemo(() => {
    const dir = new THREE.Vector3(...regionData.explodeDirection).normalize()
    return dir.multiplyScalar(regionData.explodeDistance)
  }, [regionData])

  const baseColor = useMemo(() => new THREE.Color(regionData.color), [regionData.color])
  const highlightColor = useMemo(
    () => new THREE.Color(regionData.highlightColor),
    [regionData.highlightColor]
  )

  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh) return

    // Explode position
    const targetX = basePosition[0] + explodeTarget.x * explodeFactor
    const targetY = basePosition[1] + explodeTarget.y * explodeFactor
    const targetZ = basePosition[2] + explodeTarget.z * explodeFactor
    mesh.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.08)

    // Scale
    const targetScale = isSelected ? 1.04 : 1.0
    mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)

    // Material glow
    const mat = mesh.material as THREE.MeshPhysicalMaterial
    const emissiveIntensity = isSelected ? 0.3 : isHovered ? 0.15 : 0
    mat.emissiveIntensity = THREE.MathUtils.lerp(
      mat.emissiveIntensity,
      emissiveIntensity,
      0.1
    )
    mat.color.lerp(isSelected || isHovered ? highlightColor : baseColor, 0.08)
  })

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={basePosition}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      castShadow
      receiveShadow
    >
      <meshPhysicalMaterial
        color={regionData.color}
        roughness={0.75}
        metalness={0.02}
        clearcoat={0.15}
        clearcoatRoughness={0.4}
        emissive={'#ffaaaa'}
        emissiveIntensity={0}
        // Subsurface scattering approximation for organic tissue look
        sheen={0.2}
        sheenColor={'#ffcccc'}
        sheenRoughness={0.6}
      />
    </mesh>
  )
}
