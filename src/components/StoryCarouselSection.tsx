import React, { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface StoryMoment {
  id: number
  title: string
  subtitle: string
  line: string
  imageSrc: string
  badge: string
}

const MOMENTS: StoryMoment[] = [
  {
    id: 1,
    title: 'First Meeting',
    subtitle: 'Where our eyes first met',
    line: 'A quiet moment that quietly changed everything forever.',
    imageSrc: './assets/images/IMG_2938.jpeg',
    badge: 'Chapter I',
  },
  {
    id: 2,
    title: 'First Date',
    subtitle: 'A day we never forgot',
    line: 'Coffee, laughter, and a walk that felt like forever.',
    imageSrc: './assets/images/IMG_3143.jpeg',
    badge: 'Chapter II',
  },
  {
    id: 3,
    title: 'Our Favourite Walk',
    subtitle: 'Underneath the evening sky',
    line: 'Hand in hand, talking about nothing and everything.',
    imageSrc: './assets/images/IMG_5020.jpeg',
    badge: 'Chapter III',
  },
  {
    id: 4,
    title: 'Today',
    subtitle: 'Right here, right now',
    line: 'Every road led us to this exact moment together.',
    imageSrc: './assets/images/IMG_5204.jpeg',
    badge: 'Chapter IV',
  },
]

export const StoryCarouselSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(1) // Start on "First Date" (2 of 4)
  const [paused, setPaused] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const touchStartX = useRef<number | null>(null)
  const sectionRef = useRef<HTMLElement | null>(null)
  const centreImgRef = useRef<HTMLImageElement | null>(null)
  const captionRef = useRef<HTMLDivElement | null>(null)

  const goTo = useCallback(
    (nextIndex: number) => {
      const normalized = (nextIndex + MOMENTS.length) % MOMENTS.length
      if (normalized === activeIndex) return
      setActiveIndex(normalized)
    },
    [activeIndex]
  )

  const prev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo])
  const next = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo])

  // Animate slide & caption with GSAP on every slide change
  useEffect(() => {
    if (centreImgRef.current) {
      gsap.fromTo(
        centreImgRef.current,
        { opacity: 0.25, scale: 0.94 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.85,
          ease: 'power3.out',
        }
      )
    }
    if (captionRef.current) {
      gsap.fromTo(
        captionRef.current,
        { y: 14, opacity: 0.25 },
        { y: 0, opacity: 1, duration: 0.85, ease: 'power3.out' }
      )
    }
  }, [activeIndex])

  // Gentle auto-advance (pauses on hover/touch)
  useEffect(() => {
    if (paused) return
    const timer = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % MOMENTS.length)
    }, 5500)
    return () => window.clearInterval(timer)
  }, [paused])

  // Keyboard arrow support when section is in view
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      const inView =
        rect.top < window.innerHeight * 0.65 &&
        rect.bottom > window.innerHeight * 0.35
      if (!inView) return
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [prev, next])

  const handleTouchStart = (e: React.TouchEvent) => {
    setPaused(true)
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    setPaused(false)
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) > 45) {
      if (delta > 0) prev()
      else next()
    }
  }

  const handleCentreMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    setTilt({ x: nx, y: ny })
  }

  const leftIndex = (activeIndex - 1 + MOMENTS.length) % MOMENTS.length
  const rightIndex = (activeIndex + 1) % MOMENTS.length
  const current = MOMENTS[activeIndex]

  return (
    <section
      id="memories"
      ref={sectionRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false)
        setTilt({ x: 0, y: 0 })
      }}
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 pb-24 pt-24 sm:px-8"
    >
      {/* Eyebrow */}
      <p className="mb-6 text-center text-xs font-medium tracking-[0.32em] text-[#D4A95C] uppercase sm:text-sm">
        CHAPTER 02 — OUR STORY
      </p>

      {/* Circular Carousel Stage */}
      <div className="relative flex w-full max-w-5xl items-center justify-center gap-4 sm:gap-8">
        {/* Left Arrow */}
        <button
          type="button"
          onClick={prev}
          aria-label="Previous memory"
          className="glass-midnight z-20 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#E8C87E] transition-all duration-500 ease-luxury hover:scale-110 hover:shadow-[0_0_24px_rgba(212,169,92,0.45)] sm:h-12 sm:w-12"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Left Dimmed Circle */}
        <button
          type="button"
          onClick={prev}
          aria-label={`View ${MOMENTS[leftIndex].title}`}
          className="hidden h-36 w-36 shrink-0 overflow-hidden rounded-full border border-[#D4A95C]/35 opacity-45 blur-[0.5px] transition-all duration-[900ms] ease-luxury hover:scale-105 hover:opacity-80 md:block lg:h-44 lg:w-44"
        >
          <img
            src={MOMENTS[leftIndex].imageSrc}
            alt={MOMENTS[leftIndex].title}
            className="h-full w-full object-cover"
          />
        </button>

        {/* Centre Large Circle with Orbital Champagne-Gold Ring & Ken Burns Motion */}
        <div
          onMouseMove={handleCentreMouseMove}
          style={{
            transform: `perspective(900px) rotateY(${tilt.x * 6}deg) rotateX(${-tilt.y * 6}deg)`,
            transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          className="relative flex items-center justify-center"
        >
          <div
            aria-hidden="true"
            className="golden-halo absolute h-[118%] w-[118%] rounded-full opacity-85"
          />
          {/* Slow Orbital Gold Ring */}
          <div
            aria-hidden="true"
            className="animate-spin-slow pointer-events-none absolute -inset-3 rounded-full border border-dashed border-[#E8C87E]/45"
          />
          <div className="relative h-64 w-64 overflow-hidden rounded-full border-2 border-[#E8C87E]/90 shadow-[0_0_50px_rgba(212,169,92,0.42)] sm:h-80 sm:w-80 lg:h-[340px] lg:w-[340px]">
            <img
              ref={centreImgRef}
              key={current.id}
              src={current.imageSrc}
              alt={current.title}
              className="animate-ken-burns h-full w-full object-cover"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-[#FFF8F0]/25"
            />
          </div>
        </div>

        {/* Right Dimmed Circle */}
        <button
          type="button"
          onClick={next}
          aria-label={`View ${MOMENTS[rightIndex].title}`}
          className="hidden h-36 w-36 shrink-0 overflow-hidden rounded-full border border-[#D4A95C]/35 opacity-45 blur-[0.5px] transition-all duration-[900ms] ease-luxury hover:scale-105 hover:opacity-80 md:block lg:h-44 lg:w-44"
        >
          <img
            src={MOMENTS[rightIndex].imageSrc}
            alt={MOMENTS[rightIndex].title}
            className="h-full w-full object-cover"
          />
        </button>

        {/* Right Arrow */}
        <button
          type="button"
          onClick={next}
          aria-label="Next memory"
          className="glass-midnight z-20 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#E8C87E] transition-all duration-500 ease-luxury hover:scale-110 hover:shadow-[0_0_24px_rgba(212,169,92,0.45)] sm:h-12 sm:w-12"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Caption Card */}
      <div
        ref={captionRef}
        key={`caption-${current.id}`}
        className="glass-midnight mt-7 w-full max-w-lg rounded-3xl px-6 py-5 text-center sm:px-8 sm:py-6"
      >
        <span className="text-[11px] tracking-[0.28em] text-[#E8C87E]/80 uppercase">
          {current.badge}
        </span>
        <h2 className="mt-1 font-serif text-2xl font-semibold text-[#D4A95C] sm:text-3xl">
          {current.title}
        </h2>
        <p className="mt-1 font-script text-2xl text-[#F7C8D3]">
          {current.subtitle}
        </p>
        <p className="mt-2.5 text-sm leading-relaxed text-[#FFF8F0]/88 sm:text-base">
          {current.line}
        </p>
      </div>

      {/* 4 Thumbnails + Progress Bar */}
      <div className="mt-6 flex flex-col items-center gap-3">
        <div className="flex items-center gap-3">
          {MOMENTS.map((m, idx) => {
            const active = idx === activeIndex
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => goTo(idx)}
                aria-label={`Select ${m.title}`}
                className={`relative h-10 w-10 overflow-hidden rounded-full transition-all duration-500 ease-luxury sm:h-11 sm:w-11 ${
                  active
                    ? 'scale-110 border-2 border-[#E8C87E] shadow-[0_0_16px_rgba(232,200,126,0.75)]'
                    : 'border border-[#D4A95C]/35 opacity-55 hover:scale-105 hover:opacity-90'
                }`}
              >
                <img
                  src={m.imageSrc}
                  alt={m.title}
                  className="h-full w-full object-cover"
                />
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="h-[2px] w-32 overflow-hidden rounded-full bg-[#D4A95C]/25">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#D4A95C] to-[#E8C87E] transition-all duration-700 ease-luxury"
              style={{
                width: `${((activeIndex + 1) / MOMENTS.length) * 100}%`,
              }}
            />
          </div>
          <span className="text-xs tracking-[0.2em] text-[#E8C87E]/85">
            {activeIndex + 1} of {MOMENTS.length}
          </span>
        </div>
      </div>
    </section>
  )
}
