import { useCallback, useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import confetti from 'canvas-confetti'
import { AmbientCanvas } from './components/AmbientCanvas'
import { FixedCoupleStage3D } from './components/FixedCoupleStage3D'
import { PreloaderOverlay } from './components/PreloaderOverlay'
import { Navbar, SectionId } from './components/Navbar'
import { BottomProgress } from './components/BottomProgress'
import { HeroSection } from './components/HeroSection'
import { StoryCarouselSection } from './components/StoryCarouselSection'
import { QuestionSection } from './components/QuestionSection'
import { CelebrationSection } from './components/CelebrationSection'

gsap.registerPlugin(ScrollTrigger)

const SECTION_IDS: SectionId[] = ['hero', 'memories', 'question', 'forever']

export function App() {
  const [started, setStarted] = useState(false)
  const [showOverlay, setShowOverlay] = useState(true)
  const [activeSection, setActiveSection] = useState<SectionId>('hero')
  const [hasSaidYes, setHasSaidYes] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [goldFlash, setGoldFlash] = useState(false)
  const [mouseParallax, setMouseParallax] = useState({ x: 0, y: 0 })
  const [scrollProgress, setScrollProgress] = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lenisRef = useRef<Lenis | null>(null)

  // Initialize Lenis + GSAP ScrollTrigger
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.35,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    lenisRef.current = lenis

    lenis.on('scroll', (e: { progress?: number }) => {
      ScrollTrigger.update()
      if (typeof e.progress === 'number') {
        setScrollProgress(e.progress)
      }
    })

    const raf = (time: number) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  // Track active section on scroll
  useEffect(() => {
    const elements = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      Boolean
    ) as HTMLElement[]

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id as SectionId)
          }
        }
      },
      { threshold: 0.45 }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [hasSaidYes])

  // Subtle mouse parallax
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2
      const ny = (e.clientY / window.innerHeight - 0.5) * 2
      setMouseParallax({ x: nx, y: ny })
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  const fadeIntervalRef = useRef<number | null>(null)

  const fadeAudioTo = useCallback((targetVolume: number, durationMs = 2000) => {
    const audio = audioRef.current
    if (!audio) return
    if (fadeIntervalRef.current) {
      window.clearInterval(fadeIntervalRef.current)
      fadeIntervalRef.current = null
    }
    const startVol = audio.volume
    const steps = Math.max(1, Math.round(durationMs / 50))
    let stepCount = 0

    fadeIntervalRef.current = window.setInterval(() => {
      stepCount += 1
      const t = Math.min(1, stepCount / steps)
      audio.volume = Math.max(0, Math.min(1, startVol + (targetVolume - startVol) * t))
      if (t >= 1 && fadeIntervalRef.current) {
        window.clearInterval(fadeIntervalRef.current)
        fadeIntervalRef.current = null
      }
    }, 50)
  }, [])

  const startMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = false
    audio.loop = true
    if (audio.paused) {
      audio.volume = 0.15
      const playPromise = audio.play()
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise
          .then(() => {
            setIsMuted(false)
            fadeAudioTo(0.5, 2000)
          })
          .catch(() => {})
      }
    }
  }, [fadeAudioTo])

  const handleStart = useCallback(() => {
    setStarted(true)
    setTimeout(() => setShowOverlay(false), 1000)
    startMusic()
  }, [startMusic])

  // Fallback: if browser blocked initial play, resume on next user interaction
  useEffect(() => {
    if (!started) return
    const resumeIfNeeded = () => {
      const audio = audioRef.current
      if (audio && audio.paused && !isMuted) {
        startMusic()
      }
    }
    window.addEventListener('pointerdown', resumeIfNeeded, { once: true })
    window.addEventListener('keydown', resumeIfNeeded, { once: true })
    return () => {
      window.removeEventListener('pointerdown', resumeIfNeeded)
      window.removeEventListener('keydown', resumeIfNeeded)
    }
  }, [started, isMuted, startMusic])

  const handleToggleMute = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play().catch(() => {})
      audio.muted = false
      setIsMuted(false)
      fadeAudioTo(hasSaidYes ? 0.68 : 0.5, 800)
      return
    }
    const nextMuted = !isMuted
    audio.muted = nextMuted
    setIsMuted(nextMuted)
  }, [isMuted, hasSaidYes, fadeAudioTo])

  const navigateTo = useCallback((id: SectionId) => {
    const el = document.getElementById(id)
    if (!el) return
    if (lenisRef.current) {
      lenisRef.current.scrollTo(el, { duration: 1.25 })
    } else {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  const handleYes = useCallback(() => {
    setHasSaidYes(true)
    setGoldFlash(true)

    confetti({
      particleCount: 110,
      spread: 95,
      origin: { y: 0.6 },
      colors: ['#D4A95C', '#E8C87E', '#FF6FA5', '#F7C8D3', '#FFF8F0'],
    })

    if (audioRef.current && !audioRef.current.muted) {
      fadeAudioTo(0.68, 1500)
    }

    setTimeout(() => {
      setGoldFlash(false)
      navigateTo('forever')
    }, 520)
  }, [fadeAudioTo, navigateTo])

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#0B1E4A] text-[#FFF8F0]">
      {/* Background Music: Saathiya Tune Kya Kiya */}
      <audio
        ref={audioRef}
        src="./assets/audio/saathiya.mp3"
        preload="auto"
        loop
      />

      {/* Full-Screen Fixed Moonlit Blossom Forest Background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <video
          src="./assets/videos/forest-lantern.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover object-center"
        />
        {/* Soft dark midnight-blue gradient overlay at bottom for text readability */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(11, 30, 74, 0.72) 0%, rgba(11, 30, 74, 0.25) 45%, rgba(11, 30, 74, 0.14) 100%)',
          }}
        />
        {/* Romantic Rose-Burgundy & Champagne-Gold Twilight Glow during Couple Dance */}
        <div
          aria-hidden="true"
          className={`absolute inset-0 transition-opacity duration-[1400ms] ease-luxury ${
            hasSaidYes || activeSection === 'forever' || scrollProgress > 0.78
              ? 'opacity-100'
              : 'opacity-0'
          }`}
          style={{
            background:
              'radial-gradient(circle at 50% 42%, rgba(232, 200, 126, 0.22) 0%, rgba(255, 111, 165, 0.28) 32%, rgba(92, 15, 43, 0.62) 72%, rgba(43, 18, 54, 0.78) 100%)',
          }}
        />
      </div>

      {/* Lightweight 60fps Floating Petals, Fireflies & Celebration Hearts */}
      <AmbientCanvas celebration={hasSaidYes || activeSection === 'forever'} />

      {/* Single Fixed Full-Screen 3D Couple Stage (glides smoothly with scroll) */}
      <FixedCoupleStage3D
        scrollProgress={scrollProgress}
        activeSection={activeSection}
        mouseParallax={mouseParallax}
        started={started}
      />

      {/* Soft Gold Flash on Yes */}
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-50 bg-[#E8C87E]/30 backdrop-blur-[2px] transition-opacity duration-700 ${
          goldFlash ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Entry / Preloader Overlay */}
      {showOverlay && <PreloaderOverlay onStart={handleStart} />}

      {/* Floating Top Navigation */}
      <Navbar
        activeSection={activeSection}
        onNavigate={navigateTo}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        hasSaidYes={hasSaidYes}
      />

      {/* Main 4-Screen Story */}
      <main
        className={`relative z-30 transition-all duration-1000 ease-luxury ${
          started ? 'scale-100 opacity-100' : 'scale-[1.04] opacity-0'
        }`}
      >
        <HeroSection
          started={started}
          onScrollNext={() => navigateTo('memories')}
        />
        <StoryCarouselSection />
        <QuestionSection onYes={handleYes} />
        <CelebrationSection active={hasSaidYes || activeSection === 'forever'} />
      </main>

      {/* Bottom Thin Gold Progress Line + 4 Gold Dots */}
      <BottomProgress activeSection={activeSection} onNavigate={navigateTo} />
    </div>
  )
}

export default App
