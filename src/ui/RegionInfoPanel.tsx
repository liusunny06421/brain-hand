import { useAppStore } from '../store/useAppStore'
import { BRAIN_REGIONS } from '../brain/regions'

export function RegionInfoPanel() {
  const selectedRegion = useAppStore((s) => s.selectedRegion)
  const setSelectedRegion = useAppStore((s) => s.setSelectedRegion)
  const region = selectedRegion ? BRAIN_REGIONS[selectedRegion] : null

  return (
    <div
      style={{
        ...styles.container,
        transform: region ? 'translateX(0)' : 'translateX(110%)',
        opacity: region ? 1 : 0,
      }}
    >
      {region && (
        <>
          <div style={styles.header}>
            <div style={styles.scanLine} />
            <h3 style={styles.title}>{region.name.toUpperCase()}</h3>
            <button style={styles.close} onClick={() => setSelectedRegion(null)}>
              ✕
            </button>
          </div>
          <div style={styles.divider} />
          <p style={styles.description}>{region.description}</p>
          <div style={styles.meta}>
            <span style={styles.tag}>REGION ID: {region.id.toUpperCase()}</span>
          </div>
        </>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    right: 20,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 280,
    background: 'rgba(2,4,16,0.9)',
    backdropFilter: 'blur(12px)',
    borderRadius: 4,
    padding: '20px',
    border: '1px solid rgba(0,212,255,0.2)',
    zIndex: 40,
    transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease',
    boxShadow: '0 0 30px rgba(0,212,255,0.08), inset 0 0 30px rgba(0,212,255,0.02)',
    fontFamily: "'SF Mono', 'Fira Code', monospace",
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    position: 'relative' as const,
  },
  scanLine: {
    width: 3,
    height: 16,
    background: '#00d4ff',
    borderRadius: 1,
    boxShadow: '0 0 8px #00d4ff',
  },
  title: {
    color: '#00d4ff',
    fontSize: 13,
    fontWeight: 600,
    margin: 0,
    flex: 1,
    letterSpacing: 2,
  },
  close: {
    background: 'none',
    border: '1px solid rgba(0,212,255,0.2)',
    color: '#335577',
    fontSize: 12,
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: 2,
    lineHeight: 1,
    fontFamily: 'inherit',
  },
  divider: {
    height: 1,
    background: 'linear-gradient(90deg, rgba(0,212,255,0.3), transparent)',
    marginBottom: 12,
  },
  description: {
    color: 'rgba(180,210,230,0.8)',
    fontSize: 12,
    lineHeight: 1.7,
    margin: '0 0 14px',
  },
  meta: {
    display: 'flex',
    gap: 8,
  },
  tag: {
    fontSize: 9,
    color: '#335577',
    border: '1px solid rgba(0,212,255,0.15)',
    padding: '2px 8px',
    borderRadius: 2,
    letterSpacing: 1.5,
  },
}
