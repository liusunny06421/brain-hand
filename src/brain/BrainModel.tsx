import { useRef, useEffect, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '../store/useAppStore'
import { loadBrain, type BrainHemisphere } from './loadBrainMesh'
import { CascadeWaves } from './NeuralEffects'


function Hemisphere({
  data,
  isLeft,
  isSelected,
  isHovered,
  explodeFactor,
  onClick,
  onPointerOver,
  onPointerOut,
}: {
  data: BrainHemisphere
  isLeft: boolean
  isSelected: boolean
  isHovered: boolean
  explodeFactor: number
  onClick: () => void
  onPointerOver: () => void
  onPointerOut: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const wireRef = useRef<THREE.LineSegments>(null)
  const wireGeo = useMemo(
    () => new THREE.WireframeGeometry(data.geometry),
    [data.geometry]
  )

  useFrame(() => {
    if (!meshRef.current) return
    const explodeDir = isLeft ? -1 : 1
    const targetX = explodeDir * explodeFactor * 15
    meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, 0.08)
    if (wireRef.current) wireRef.current.position.x = meshRef.current.position.x
  })

  return (
    <group>
      {/* Solid translucent fill */}
      <mesh
        ref={meshRef}
        geometry={data.geometry}
        onClick={(e) => { e.stopPropagation(); onClick() }}
        onPointerOver={(e) => { e.stopPropagation(); onPointerOver() }}
        onPointerOut={onPointerOut}
      >
        <meshStandardMaterial
          color="#1a4466"
          emissive="#1188cc"
          emissiveIntensity={isSelected ? 0.5 : isHovered ? 0.3 : 0.12}
          roughness={0.3}
          metalness={0.2}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Wireframe overlay for holographic look */}
      <lineSegments ref={wireRef} geometry={wireGeo}>
        <lineBasicMaterial
          color="#44aadd"
          transparent
          opacity={isSelected ? 0.2 : isHovered ? 0.12 : 0.06}
        />
      </lineSegments>
    </group>
  )
}

export function BrainModel() {
  const groupRef = useRef<THREE.Group>(null)
  const [brainData, setBrainData] = useState<{
    left: BrainHemisphere
    right: BrainHemisphere
  } | null>(null)
  const [hoveredHemi, setHoveredHemi] = useState<string | null>(null)

  const selectedRegion = useAppStore((s) => s.selectedRegion)
  const setSelectedRegion = useAppStore((s) => s.setSelectedRegion)
  const setModelLoaded = useAppStore((s) => s.setModelLoaded)
  const targetRotation = useAppStore((s) => s.targetRotation)
  const targetZoom = useAppStore((s) => s.targetZoom)
  const explodeFactor = useAppStore((s) => s.explodeFactor)

  useEffect(() => {
    loadBrain().then((data) => {
      const tempGroup = new THREE.Group()
      tempGroup.add(new THREE.Mesh(data.left.geometry), new THREE.Mesh(data.right.geometry))
      const box = new THREE.Box3().setFromObject(tempGroup)
      const center = box.getCenter(new THREE.Vector3())

      for (const geo of [data.left.geometry, data.right.geometry]) {
        const pos = geo.attributes.position as THREE.BufferAttribute
        for (let i = 0; i < pos.count; i++) {
          pos.setXYZ(i, pos.getX(i) - center.x, pos.getY(i) - center.y, pos.getZ(i) - center.z)
        }
        pos.needsUpdate = true
        geo.computeVertexNormals()
      }

      setBrainData(data)
      setModelLoaded(true)
    }).catch(err => console.error('Failed to load brain:', err))
  }, [setModelLoaded])

  useFrame((threeState) => {
    if (!groupRef.current) return
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotation[0], 0.2)
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation[1], 0.2)
    threeState.camera.position.z = THREE.MathUtils.lerp(threeState.camera.position.z, targetZoom, 0.2)
  })

  if (!brainData) return null

  return (
    <group ref={groupRef} scale={0.018}>
      <Hemisphere
        data={brainData.left} isLeft
        isSelected={selectedRegion === 'left_hemisphere'}
        isHovered={hoveredHemi === 'left'}
        explodeFactor={explodeFactor}
        onClick={() => setSelectedRegion(selectedRegion === 'left_hemisphere' ? null : 'left_hemisphere')}
        onPointerOver={() => setHoveredHemi('left')}
        onPointerOut={() => setHoveredHemi(null)}
      />
      <Hemisphere
        data={brainData.right} isLeft={false}
        isSelected={selectedRegion === 'right_hemisphere'}
        isHovered={hoveredHemi === 'right'}
        explodeFactor={explodeFactor}
        onClick={() => setSelectedRegion(selectedRegion === 'right_hemisphere' ? null : 'right_hemisphere')}
        onPointerOver={() => setHoveredHemi('right')}
        onPointerOut={() => setHoveredHemi(null)}
      />

      {/* Cascade wave activations across cortex */}
      <CascadeWaves geometry={brainData.left.geometry} />
      <CascadeWaves geometry={brainData.right.geometry} />
    </group>
  )
}
