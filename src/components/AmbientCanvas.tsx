import React, { useEffect, useRef } from 'react'

interface AmbientCanvasProps {
  celebration?: boolean
  dense?: boolean
}

interface Petal {
  x: number
  y: number
  size: number
  speedY: number
  speedX: number
  rotation: number
  rotSpeed: number
  opacity: number
  swayPhase: number
  color: string
}

interface Firefly {
  x: number
  y: number
  radius: number
  vx: number
  vy: number
  phase: number
  color: string
}

interface FloatingHeart {
  x: number
  y: number
  size: number
  speedY: number
  sway: number
  phase: number
  opacity: number
}

const PETAL_COLORS = [
  'rgba(255, 111, 165, 0.72)',
  'rgba(247, 200, 211, 0.68)',
  'rgba(198, 123, 138, 0.65)',
  'rgba(232, 200, 126, 0.55)',
]

export const AmbientCanvas: React.FC<AmbientCanvasProps> = ({
  celebration = false,
  dense = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const celebrationRef = useRef(celebration)

  useEffect(() => {
    celebrationRef.current = celebration
  }, [celebration])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId = 0
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const onResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize, { passive: true })

    const petalCount = dense ? 36 : 24
    const fireflyCount = dense ? 46 : 30

    const petals: Petal[] = Array.from({ length: petalCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 5 + Math.random() * 7,
      speedY: 0.35 + Math.random() * 0.65,
      speedX: -0.25 + Math.random() * 0.5,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
      opacity: 0.35 + Math.random() * 0.5,
      swayPhase: Math.random() * Math.PI * 2,
      color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
    }))

    const fireflies: Firefly[] = Array.from({ length: fireflyCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 1.2 + Math.random() * 2.2,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -0.15 - Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2,
      color: Math.random() > 0.28 ? '#E8C87E' : '#FF6FA5',
    }))

    const hearts: FloatingHeart[] = Array.from({ length: 18 }, () => ({
      x: Math.random() * width,
      y: height + Math.random() * height * 0.6,
      size: 10 + Math.random() * 14,
      speedY: 0.7 + Math.random() * 0.9,
      sway: 0.5 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
      opacity: 0.4 + Math.random() * 0.45,
    }))

    const drawHeart = (
      x: number,
      y: number,
      size: number,
      opacity: number
    ) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(size / 20, size / 20)
      ctx.globalAlpha = opacity
      ctx.beginPath()
      ctx.moveTo(0, 6)
      ctx.bezierCurveTo(-10, -4, -14, -12, -6, -15)
      ctx.bezierCurveTo(-2, -16, 0, -12, 0, -10)
      ctx.bezierCurveTo(0, -12, 2, -16, 6, -15)
      ctx.bezierCurveTo(14, -12, 10, -4, 0, 6)
      ctx.closePath()
      const grad = ctx.createLinearGradient(0, -15, 0, 6)
      grad.addColorStop(0, '#FF6FA5')
      grad.addColorStop(1, '#D4A95C')
      ctx.fillStyle = grad
      ctx.shadowColor = 'rgba(255, 111, 165, 0.7)'
      ctx.shadowBlur = 12
      ctx.fill()
      ctx.restore()
    }

    let tick = 0
    const render = () => {
      tick += 0.016
      ctx.clearRect(0, 0, width, height)

      // Fireflies & gold dust
      for (const f of fireflies) {
        f.x += f.vx + Math.sin(tick + f.phase) * 0.18
        f.y += f.vy
        if (f.y < -10) {
          f.y = height + 10
          f.x = Math.random() * width
        }
        if (f.x < -10) f.x = width + 10
        if (f.x > width + 10) f.x = -10

        const alpha = 0.25 + 0.65 * (0.5 + 0.5 * Math.sin(tick * 2 + f.phase))
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.beginPath()
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2)
        ctx.fillStyle = f.color
        ctx.shadowColor = f.color
        ctx.shadowBlur = 10
        ctx.fill()
        ctx.restore()
      }

      // Floating blossom & rose petals
      for (const p of petals) {
        p.y += p.speedY
        p.x += p.speedX + Math.sin(tick * 1.4 + p.swayPhase) * 0.45
        p.rotation += p.rotSpeed
        if (p.y > height + 20) {
          p.y = -20
          p.x = Math.random() * width
        }
        if (p.x < -20) p.x = width + 20
        if (p.x > width + 20) p.x = -20

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.globalAlpha = p.opacity
        ctx.beginPath()
        ctx.ellipse(0, 0, p.size, p.size * 0.56, 0, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.fill()
        ctx.restore()
      }

      // Celebration rising rose-gold hearts
      if (celebrationRef.current) {
        for (const h of hearts) {
          h.y -= h.speedY
          h.x += Math.sin(tick * 1.6 + h.phase) * h.sway
          if (h.y < -30) {
            h.y = height + 30
            h.x = Math.random() * width
          }
          drawHeart(h.x, h.y, h.size, h.opacity)
        }
      }

      animId = requestAnimationFrame(render)
    }

    animId = requestAnimationFrame(render)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
    }
  }, [dense])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-20 h-full w-full"
    />
  )
}
