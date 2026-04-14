import { useState, useEffect } from 'react'

export function LoadingScreen() {
  const [visible, setVisible] = useState(true)

  // Simple timed fade — the procedural brain generates instantly,
  // this just gives a polished entrance
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div
      style={{
        ...styles.overlay,
        animation: 'fadeOut 0.5s ease 0.7s forwards',
      }}
    >
      <div style={styles.content}>
        <div style={styles.brainIcon}>&#129504;</div>
        <h2 style={styles.title}>Brain Hand</h2>
        <p style={styles.subtitle}>Loading 3D brain...</p>
        <div style={styles.barTrack}>
          <div style={styles.barFill} />
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: '#0a0a0a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  content: {
    textAlign: 'center' as const,
  },
  brainIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 600,
    margin: '0 0 8px',
  },
  subtitle: {
    color: '#666',
    fontSize: 14,
    margin: '0 0 24px',
  },
  barTrack: {
    width: 180,
    height: 3,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    margin: '0 auto',
  },
  barFill: {
    width: '60%',
    height: '100%',
    background: '#6c5ce7',
    borderRadius: 2,
    animation: 'loading 1.5s ease-in-out infinite',
  },
}
