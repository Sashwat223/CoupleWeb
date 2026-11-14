import React, { useEffect, useState } from 'react'

interface PreloaderOverlayProps {
  onStart: () => void
}

const ASSETS_TO_PRELOAD = [
  './assets/images/IMG_3143.jpeg',
  './assets/images/IMG_2938.jpeg',
]

export const PreloaderOverlay: React.FC<PreloaderOverlayProps> = ({
  onStart,
}) => {
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    let mounted = true
    let completed = 0

    const markOne = () => {
      if (!mounted) return
      completed += 1
      const pct = Math.round((completed / ASSETS_TO_PRELOAD.length) * 100)
      setProgress(pct)
      if (completed >= ASSETS_TO_PRELOAD.length) {
        setTimeout(() => {
          if (mounted) setReady(true)
        }, 200)
      }
    }

    ASSETS_TO_PRELOAD.forEach((url) => {
      const img = new Image()
      img.onload = markOne
      img.onerror = markOne
      img.src = url
    })

    // Unlock promptly so entry is never delayed on slow connections
    const safetyTimer = setTimeout(() => {
      if (mounted) {
        setProgress(100)
        setReady(true)
      }
    }, 800)

    return () => {
      mounted = false
      clearTimeout(safetyTimer)
    }
  }, [])

  const handleBegin = () => {
    if (exiting) return
    setExiting(true)
    onStart()
  }

  return (
    <div
      onClick={ready ? handleBegin : undefined}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#071436] transition-all duration-1000 ease-luxury ${
        exiting
          ? 'pointer-events-none scale-105 opacity-0 blur-sm'
          : 'opacity-100'
      }`}
    >
      {/* Soft radial midnight-burgundy aura */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(92, 15, 43, 0.42) 0%, rgba(18, 42, 107, 0.45) 42%, rgba(7, 20, 54, 0.96) 80%)',
        }}
      />

      {/* Beating Gold Heart */}
      <div className="relative z-10 mb-8 flex items-center justify-center">
        <div className="golden-halo absolute h-36 w-36 rounded-full opacity-75" />
        <svg
          viewBox="0 0 64 64"
          className="animate-heartbeat relative h-20 w-20 text-[#D4A95C]"
          fill="url(#goldHeartGrad)"
        >
          <defs>
            <linearGradient id="goldHeartGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFF8F0" />
              <stop offset="45%" stopColor="#E8C87E" />
              <stop offset="100%" stopColor="#D4A95C" />
            </linearGradient>
          </defs>
          <path d="M32 56C32 56 8 40.6 8 22.4C8 14.4 14.2 8 22 8C26.7 8 30.8 10.4 32 13.8C33.2 10.4 37.3 8 42 8C49.8 8 56 14.4 56 22.4C56 40.6 32 56 32 56Z" />
        </svg>
      </div>

      {/* Title */}
      <h1 className="text-gold-gradient relative z-10 font-serif text-4xl tracking-wide sm:text-5xl md:text-6xl">
        Forever Us
      </h1>
      <p className="relative z-10 mt-3 font-script text-2xl text-[#F7C8D3]/90 sm:text-3xl">
        A story written in the stars
      </p>

      {/* Progress / Tap CTA */}
      <div className="relative z-10 mt-10 flex min-h-[72px] flex-col items-center justify-center">
        {!ready ? (
          <div className="flex w-56 flex-col items-center gap-2.5">
            <div className="h-[2px] w-full overflow-hidden rounded-full bg-[#D4A95C]/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#D4A95C] via-[#E8C87E] to-[#FF6FA5] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs uppercase tracking-[0.28em] text-[#D4A95C]/80">
              Preparing our world · {progress}%
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleBegin()
            }}
            className="btn-yes group relative overflow-hidden rounded-full px-8 py-3.5 text-sm font-medium tracking-[0.14em] text-[#FFF8F0] uppercase sm:text-base"
          >
            <span className="relative z-10 flex items-center gap-2.5">
              Tap to begin our story
              <span className="text-[#E8C87E] transition-transform duration-500 group-hover:scale-125">
                ♡
              </span>
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
