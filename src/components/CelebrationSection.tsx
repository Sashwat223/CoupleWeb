import React, { useCallback, useEffect } from 'react'
import confetti from 'canvas-confetti'

interface CelebrationSectionProps {
  active: boolean
}

export const CelebrationSection: React.FC<CelebrationSectionProps> = ({
  active,
}) => {
  const launchFireworks = useCallback(() => {
    const colors = ['#D4A95C', '#E8C87E', '#FF6FA5', '#F7C8D3', '#FFF8F0']

    confetti({
      particleCount: 95,
      spread: 85,
      origin: { y: 0.58 },
      colors,
    })

    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 65,
        origin: { x: 0.15, y: 0.65 },
        colors,
      })
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 65,
        origin: { x: 0.85, y: 0.65 },
        colors,
      })
    }, 320)
  }, [])

  useEffect(() => {
    if (!active) return
    launchFireworks()

    const interval = setInterval(() => {
      confetti({
        particleCount: 28,
        spread: 70,
        origin: { x: 0.2 + Math.random() * 0.6, y: 0.25 + Math.random() * 0.25 },
        colors: ['#D4A95C', '#E8C87E', '#FF6FA5', '#FFF8F0'],
        scalar: 0.9,
      })
    }, 4200)

    return () => clearInterval(interval)
  }, [active, launchFireworks])

  return (
    <section
      id="forever"
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 pb-24 pt-24 sm:px-8"
    >
      {/* Floating Gold Glass Chips */}
      <div className="pointer-events-none relative z-20 mb-2 flex flex-wrap items-center justify-center gap-3">
        <span className="glass-midnight rounded-full px-4 py-1.5 text-xs tracking-[0.18em] text-[#E8C87E] uppercase">
          Just Engaged ♡
        </span>
        <span className="glass-midnight rounded-full px-4 py-1.5 text-xs tracking-[0.18em] text-[#F7C8D3] uppercase">
          Forever Starts Now ✨
        </span>
      </div>

      {/* Centre Stage with Floating Polaroids */}
      <div className="relative flex w-full max-w-5xl items-center justify-center">
        {/* Left Tilted Polaroid */}
        <div
          style={{ '--float-rot': '-7deg' } as React.CSSProperties}
          className="animate-float-slow glass-midnight hidden w-40 shrink-0 -rotate-6 rounded-2xl p-2 pb-5 shadow-[0_18px_45px_rgba(7,20,54,0.75)] md:block lg:w-44"
        >
          <div className="h-36 w-full overflow-hidden rounded-xl border border-[#D4A95C]/40">
            <img
              src="./assets/images/IMG_5605.jpeg"
              alt="Our Moment"
              className="h-full w-full object-cover"
            />
          </div>
          <p className="mt-2.5 text-center font-script text-xl text-[#E8C87E]">
            Forever Us
          </p>
        </div>

        {/* Centre Golden Halo Stage for FixedCoupleStage3D */}
        <div className="relative z-10 flex h-[280px] w-[260px] items-center justify-center sm:h-[340px] sm:w-[340px] lg:h-[380px] lg:w-[400px]">
          <div
            aria-hidden="true"
            className="golden-halo pointer-events-none h-64 w-64 rounded-full opacity-85 sm:h-80 sm:w-80"
          />
        </div>

        {/* Right Tilted Polaroid */}
        <div
          style={{ '--float-rot': '7deg' } as React.CSSProperties}
          className="animate-float-slow glass-midnight hidden w-40 shrink-0 rotate-6 rounded-2xl p-2 pb-5 shadow-[0_18px_45px_rgba(7,20,54,0.75)] md:block lg:w-44"
        >
          <div className="h-36 w-full overflow-hidden rounded-xl border border-[#D4A95C]/40">
            <img
              src="./assets/images/IMG_5204.jpeg"
              alt="Hand in Hand"
              className="h-full w-full object-cover"
            />
          </div>
          <p className="mt-2.5 text-center font-script text-xl text-[#F7C8D3]">
            Hand in Hand
          </p>
        </div>
      </div>

      {/* Celebration Headline & CTA */}
      <div className="glass-midnight relative z-20 -mt-4 w-full max-w-xl rounded-3xl px-6 py-7 text-center sm:px-10 sm:py-8">
        <p className="font-script text-3xl text-[#F7C8D3] sm:text-4xl">
          Forever Starts Now
        </p>
        <h2 className="text-gold-gradient mt-1 font-serif text-4xl font-semibold tracking-wide sm:text-5xl md:text-6xl">
          She Said Yes!
        </h2>
        <p className="mt-3 text-sm font-light tracking-wide text-[#FFF8F0]/88 sm:text-base">
          Every star in the midnight sky is celebrating with us tonight.
        </p>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={launchFireworks}
            className="btn-yes flex items-center gap-2.5 rounded-full px-8 py-3.5 text-base font-medium tracking-wider text-[#FFF8F0]"
          >
            <span className="text-[#E8C87E]">♡</span>
            <span>Our Forever Begins</span>
          </button>
        </div>
      </div>
    </section>
  )
}
