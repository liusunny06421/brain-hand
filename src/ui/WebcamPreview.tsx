import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import { useAppStore } from '../store/useAppStore'
import { HAND_CONNECTIONS } from '../types/mediapipe'
import type { HandLandmarks } from '../types/mediapipe'

interface Props {
  videoRef: MutableRefObject<HTMLVideoElement | null>
  landmarksRef: MutableRefObject<HandLandmarks[]>
}

export function WebcamPreview({ videoRef, landmarksRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const handsDetected = useAppStore((s) => s.handsDetected)
  const gestureState = useAppStore((s) => s.gestureState)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function draw() {
      const video = videoRef.current
      if (!video || !ctx || !canvas) {
        animRef.current = requestAnimationFrame(draw)
        return
      }

      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480

      // Draw mirrored video
      ctx.save()
      ctx.scale(-1, 1)
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
      ctx.restore()

      // Draw landmarks
      const landmarks = landmarksRef.current
      for (const hand of landmarks) {
        // Draw connections
        ctx.strokeStyle = gestureState !== 'IDLE' ? '#6c5ce7' : 'rgba(255,255,255,0.5)'
        ctx.lineWidth = 2
        for (const [start, end] of HAND_CONNECTIONS) {
          const a = hand[start]
          const b = hand[end]
          if (!a || !b) continue
          ctx.beginPath()
          ctx.moveTo((1 - a.x) * canvas.width, a.y * canvas.height)
          ctx.lineTo((1 - b.x) * canvas.width, b.y * canvas.height)
          ctx.stroke()
        }

        // Draw points
        for (const lm of hand) {
          ctx.fillStyle = gestureState !== 'IDLE' ? '#a29bfe' : '#fff'
          ctx.beginPath()
          ctx.arc(
            (1 - lm.x) * canvas.width,
            lm.y * canvas.height,
            3,
            0,
            Math.PI * 2
          )
          ctx.fill()
        }
      }

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [videoRef, landmarksRef, gestureState])

  return (
    <div style={styles.container}>
      <canvas ref={canvasRef} style={styles.canvas} />
      <div style={styles.badge}>
        <span style={{
          ...styles.dot,
          background: handsDetected > 0 ? '#00b894' : '#636e72',
        }} />
        {handsDetected} hand{handsDetected !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: 20,
    left: 20,
    width: 220,
    borderRadius: 12,
    overflow: 'hidden',
    border: '2px solid rgba(255,255,255,0.15)',
    zIndex: 40,
    background: '#000',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  canvas: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    color: '#fff',
    fontSize: 11,
    padding: '4px 8px',
    borderRadius: 100,
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    display: 'inline-block',
  },
}
