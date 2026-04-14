import { useAppStore } from '../store/useAppStore'
import type { GestureState } from '../store/useAppStore'

const GESTURE_INFO: Record<GestureState, { label: string; icon: string }> = {
  IDLE: { label: 'STANDBY', icon: '◇' },
  PINCH_ROTATE: { label: 'ROTATE', icon: '⟳' },
  PINCH_ZOOM: { label: 'ZOOM', icon: '⊕' },
  EXPLODE: { label: 'EXPLODE', icon: '⬡' },
  POINT_SELECT: { label: 'SELECT', icon: '◎' },
  OPEN_PALM_RESET: { label: 'RESET', icon: '↻' },
}

export function GestureIndicator() {
  const gestureState = useAppStore((s) => s.gestureState)
  const info = GESTURE_INFO[gestureState]
  const isActive = gestureState !== 'IDLE'

  return (
    <div
      style={{
        ...styles.container,
        borderColor: isActive ? 'rgba(0,212,255,0.6)' : 'rgba(0,212,255,0.15)',
        boxShadow: isActive
          ? '0 0 20px rgba(0,212,255,0.15), inset 0 0 20px rgba(0,212,255,0.05)'
          : 'none',
      }}
    >
      <span style={{
        ...styles.icon,
        color: isActive ? '#00d4ff' : '#335577',
      }}>{info.icon}</span>
      <span style={{
        ...styles.label,
        color: isActive ? '#00d4ff' : '#335577',
      }}>
        {info.label}
      </span>
      <span style={{
        ...styles.dot,
        background: isActive ? '#00d4ff' : '#1a3344',
        boxShadow: isActive ? '0 0 6px #00d4ff' : 'none',
      }} />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: 20,
    right: 20,
    padding: '8px 16px',
    borderRadius: 4,
    background: 'rgba(2,2,8,0.8)',
    backdropFilter: 'blur(8px)',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    zIndex: 40,
    transition: 'all 0.3s ease',
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    letterSpacing: 2,
  },
  icon: {
    fontSize: 14,
    transition: 'color 0.3s ease',
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    transition: 'color 0.3s ease',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    transition: 'all 0.3s ease',
  },
}
