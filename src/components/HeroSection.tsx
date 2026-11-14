import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ChevronDown } from 'lucide-react'

interface HeroSectionProps {
  started: boolean
  onScrollNext: () => void
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  started,
  onScrollNext,
}) => {
  const sectionRef = useRef<HTMLElement | null>(null)
  const textRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!started || !textRef.current) return
    const words = textRef.current.querySelectorAll('.hero-word')
    const sub = textRef.current.querySelector('.hero-sub')
    const cta = textRef.current.querySelector('.hero-cta')

    gsap.fromTo(
      words,
      { y: 28, opacity: 0, filter: 'blur(6px)' },
      {
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
        duration: 1.0,
        stagger: 0.08,
        ease: 'power3.out',
        delay: 0.25,
      }
    )

    if (sub) {
      gsap.fromTo(
        sub,
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.0, ease: 'power3.out', delay: 0.8 }
      )
    }

    if (cta) {
      gsap.fromTo(
        cta,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.0, ease: 'power3.out', delay: 1.05 }
      )
    }
  }, [started])

  const titleWords = ['A', 'Story', 'Written', 'in', 'the', 'Stars']

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-5 pb-20 pt-24 sm:px-10 md:pt-20"
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-6 md:grid-cols-12 md:gap-4">
        {/* Left: Headline & Romantic Subtext */}
        <div
          ref={textRef}
          className="z-10 flex flex-col items-center text-center md:col-span-6 md:items-start md:text-left"
        >
          <span className="hero-word mb-2 font-script text-3xl text-[#F7C8D3] sm:text-4xl">
            Forever
          </span>
          <h1 className="font-serif text-4xl font-semibold leading-[1.12] tracking-tight text-[#D4A95C] sm:text-5xl lg:text-6xl">
            {titleWords.map((word, idx) => (
              <span
                key={idx}
                className="hero-word text-gold-gradient mr-[0.26em] inline-block"
              >
                {word}
              </span>
            ))}
          </h1>
          <p className="hero-sub mt-5 max-w-md text-base font-light leading-relaxed text-[#FFF8F0]/90 sm:text-lg">
            Two hearts, one journey. Forever begins today.
          </p>
          <div className="hero-cta mt-8 flex items-center gap-4">
            <button
              type="button"
              onClick={onScrollNext}
              className="glass-midnight group flex items-center gap-3 rounded-full px-6 py-3 text-sm tracking-[0.14em] text-[#E8C87E] uppercase transition-all duration-700 ease-luxury hover:scale-[1.04] hover:shadow-[0_0_26px_rgba(212,169,92,0.45)]"
            >
              <span>Begin Our Journey</span>
              <span className="transition-transform duration-500 group-hover:translate-x-1">
                →
              </span>
            </button>
          </div>
        </div>

        {/* Centre / Right: Golden Halo Stage reserved for the single fixed 3D couple */}
        <div className="relative z-10 flex h-[320px] items-center justify-center sm:h-[400px] md:col-span-6 lg:h-[480px]">
          <div
            aria-hidden="true"
            className="golden-halo pointer-events-none h-72 w-72 rounded-full opacity-75 sm:h-96 sm:w-96"
          />
        </div>
      </div>

      {/* Scroll Indicator */}
      <button
        type="button"
        onClick={onScrollNext}
        aria-label="Scroll to Our Story"
        className="absolute bottom-14 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1.5 text-xs tracking-[0.22em] text-[#E8C87E]/80 uppercase transition-opacity hover:text-[#E8C87E]"
      >
        <span>Scroll</span>
        <ChevronDown className="h-4 w-4 animate-bounce text-[#D4A95C]" />
      </button>
    </section>
  )
}
