import { useAppStore } from '../store/useAppStore'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export function PermissionGate({ children }: Props) {
  const webcamError = useAppStore((s) => s.webcamError)
  const isMediaPipeReady = useAppStore((s) => s.isMediaPipeReady)
  const handsDetected = useAppStore((s) => s.handsDetected)

  // If webcam failed, don't render webcam-dependent children at all
  if (webcamError) {
    return (
      <div style={styles.errorBanner}>
        <span style={styles.errorIcon}>&#128247;</span>
        <span>{webcamError}</span>
        <button style={styles.retryBtn} onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <>
      {children}
      {!isMediaPipeReady && (
        <div style={styles.loadingBanner}>
          <div style={styles.spinner} />
          <span>Loading hand tracking...</span>
        </div>
      )}
      {isMediaPipeReady && handsDetected === 0 && (
        <div style={styles.hint}>
          <span style={styles.hintIcon}>&#9995;</span>
          Hold up your hands to begin
        </div>
      )}
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  errorBanner: {
    position: 'fixed',
    top: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(231,76,60,0.15)',
    border: '1px solid rgba(231,76,60,0.4)',
    backdropFilter: 'blur(8px)',
    color: '#e74c3c',
    padding: '10px 20px',
    borderRadius: 100,
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    zIndex: 50,
  },
  errorIcon: {
    fontSize: 16,
  },
  retryBtn: {
    background: 'rgba(231,76,60,0.2)',
    color: '#e74c3c',
    border: '1px solid rgba(231,76,60,0.3)',
    borderRadius: 6,
    padding: '4px 12px',
    fontSize: 12,
    cursor: 'pointer',
  },
  loadingBanner: {
    position: 'fixed',
    top: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(8px)',
    color: '#aaa',
    padding: '10px 20px',
    borderRadius: 100,
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    zIndex: 50,
    border: '1px solid rgba(255,255,255,0.1)',
  },
  spinner: {
    width: 14,
    height: 14,
    border: '2px solid rgba(255,255,255,0.15)',
    borderTopColor: '#6c5ce7',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  hint: {
    position: 'fixed',
    bottom: 32,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(8px)',
    color: '#ccc',
    padding: '12px 24px',
    borderRadius: 100,
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    zIndex: 50,
    border: '1px solid rgba(255,255,255,0.1)',
  },
  hintIcon: {
    fontSize: 20,
  },
}
