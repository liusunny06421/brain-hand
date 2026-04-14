import './App.css'
import { useHandTracking } from './hooks/useHandTracking'
import { useGestureRecognition } from './hooks/useGestureRecognition'
import { BrainScene } from './brain/BrainScene'
import { WebcamPreview } from './ui/WebcamPreview'
import { GestureIndicator } from './ui/GestureIndicator'
import { RegionInfoPanel } from './ui/RegionInfoPanel'
import { PermissionGate } from './ui/PermissionGate'
import { LoadingScreen } from './ui/LoadingScreen'

function App() {
  const { videoRef, landmarksRef, handednessRef } = useHandTracking()
  useGestureRecognition(landmarksRef, handednessRef)

  return (
    <div className="app">
      <LoadingScreen />
      <BrainScene />
      <PermissionGate>
        <WebcamPreview videoRef={videoRef} landmarksRef={landmarksRef} />
        <GestureIndicator />
      </PermissionGate>
      <RegionInfoPanel />
    </div>
  )
}

export default App
