import { Canvas } from '@react-three/fiber'
import { BrainModel } from './BrainModel'

export function BrainScene() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0.3, 3], fov: 40 }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={['#050a18']} />
        <fog attach="fog" args={['#050a18', 5, 12]} />

        {/* Cool blue lighting */}
        <directionalLight position={[3, 4, 5]} intensity={0.6} color="#88bbff" />
        <directionalLight position={[-4, 2, 2]} intensity={0.4} color="#6699cc" />
        <directionalLight position={[0, -2, -3]} intensity={0.3} color="#4466aa" />
        <ambientLight intensity={0.15} color="#112244" />
        <pointLight position={[0, 0, 2]} intensity={0.3} color="#66aaff" />

        <BrainModel />
      </Canvas>
    </div>
  )
}
