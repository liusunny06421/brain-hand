import { useEffect, useRef, useCallback } from 'react'
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
import { useAppStore } from '../store/useAppStore'
import type { HandLandmarks } from '../types/mediapipe'

const SMOOTHING_ALPHA = 0.5

function smoothLandmarks(
  prev: HandLandmarks[],
  curr: HandLandmarks[],
  alpha: number
): HandLandmarks[] {
  return curr.map((hand, hIdx) => {
    if (!prev[hIdx]) return hand
    return hand.map((lm, lIdx) => {
      const p = prev[hIdx][lIdx]
      return {
        x: p.x * (1 - alpha) + lm.x * alpha,
        y: p.y * (1 - alpha) + lm.y * alpha,
        z: p.z * (1 - alpha) + lm.z * alpha,
        visibility: lm.visibility,
      }
    })
  })
}

export function useHandTracking() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const landmarksRef = useRef<HandLandmarks[]>([])
  const handednessRef = useRef<string[]>([])
  const handLandmarkerRef = useRef<HandLandmarker | null>(null)
  const animFrameRef = useRef<number>(0)
  const prevLandmarksRef = useRef<HandLandmarks[]>([])

  const setMediaPipeReady = useAppStore((s) => s.setMediaPipeReady)
  const setHandsDetected = useAppStore((s) => s.setHandsDetected)
  const setWebcamError = useAppStore((s) => s.setWebcamError)

  const detect = useCallback(() => {
    const video = videoRef.current
    const handLandmarker = handLandmarkerRef.current
    if (!video || !handLandmarker || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(detect)
      return
    }

    const result = handLandmarker.detectForVideo(video, performance.now())

    if (result.landmarks && result.landmarks.length > 0) {
      const smoothed = smoothLandmarks(
        prevLandmarksRef.current,
        result.landmarks as HandLandmarks[],
        SMOOTHING_ALPHA
      )
      landmarksRef.current = smoothed
      prevLandmarksRef.current = smoothed
      handednessRef.current = result.handedness.map(
        (h) => h[0]?.categoryName ?? 'Unknown'
      )
      setHandsDetected(result.landmarks.length)
    } else {
      landmarksRef.current = []
      handednessRef.current = []
      prevLandmarksRef.current = []
      setHandsDetected(0)
    }

    animFrameRef.current = requestAnimationFrame(detect)
  }, [setHandsDetected])

  useEffect(() => {
    let stream: MediaStream | null = null

    async function init() {
      // Request webcam
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        })
      } catch (err: unknown) {
        if (err instanceof DOMException) {
          if (err.name === 'NotAllowedError') {
            setWebcamError('Camera permission denied. Please allow camera access and reload.')
          } else if (err.name === 'NotFoundError') {
            setWebcamError('No camera found. Please connect a webcam.')
          } else {
            setWebcamError(`Camera error: ${err.message}`)
          }
        }
        return
      }

      // Create video element — must not be display:none or browsers
      // won't decode frames. Use off-screen positioning instead.
      const video = document.createElement('video')
      video.srcObject = stream
      video.autoplay = true
      video.playsInline = true
      video.muted = true
      video.style.position = 'fixed'
      video.style.top = '-9999px'
      video.style.left = '-9999px'
      video.style.width = '1px'
      video.style.height = '1px'
      video.style.opacity = '0.01'
      document.body.appendChild(video)
      videoRef.current = video

      try {
        await video.play()
      } catch {
        // autoplay should handle it
      }

      await new Promise<void>((resolve) => {
        if (video.readyState >= 2) {
          resolve()
        } else {
          video.onloadeddata = () => resolve()
        }
      })

      // Initialize MediaPipe HandLandmarker
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        )
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
        })
        handLandmarkerRef.current = handLandmarker
        console.log('[handtracking] MediaPipe HandLandmarker initialized — setting ready=true')
        setMediaPipeReady(true)

        // Start detection loop
        animFrameRef.current = requestAnimationFrame(detect)
      } catch (err) {
        console.error('MediaPipe init failed:', err)
        setWebcamError('Failed to load hand tracking model. Please reload.')
      }
    }

    init()

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      if (videoRef.current) {
        videoRef.current.remove()
      }
      if (stream) {
        stream.getTracks().forEach((t) => t.stop())
      }
      handLandmarkerRef.current?.close()
    }
  }, [detect, setMediaPipeReady, setWebcamError])

  return { videoRef, landmarksRef, handednessRef }
}
