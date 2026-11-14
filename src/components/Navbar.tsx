import React, { useState } from 'react'
import { Volume2, VolumeX, Menu, X } from 'lucide-react'

export type SectionId = 'hero' | 'memories' | 'question' | 'forever'

interface NavbarProps {
  activeSection: SectionId
  onNavigate: (id: SectionId) => void
  isMuted: boolean
  onToggleMute: () => void
  hasSaidYes: boolean
}

const NAV_ITEMS: { id: SectionId; label: string }[] = [
  { id: 'hero', label: 'Our Story' },
  { id: 'memories', label: 'Memories' },
  { id: 'question', label: 'The Question' },
  { id: 'forever', label: 'Forever' },
]

export const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  onNavigate,
  isMuted,
  onToggleMute,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleNav = (id: SectionId) => {
    setMobileOpen(false)
    onNavigate(id)
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-4 py-4 sm:px-8 sm:py-5">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Left: Gold heart logo + "Forever Us" */}
        <button
          type="button"
          onClick={() => handleNav('hero')}
          className="group flex items-center gap-2.5 text-left focus:outline-none"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D4A95C]/50 bg-[#0B1E4A]/55 backdrop-blur-md transition-transform duration-500 group-hover:scale-105">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-[#E8C87E]"
              fill="currentColor"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </span>
          <span className="font-serif text-xl font-medium tracking-wide text-[#D4A95C] sm:text-2xl">
            Forever Us
          </span>
        </button>

        {/* Right: Desktop Links + Music Equalizer Button */}
        <div className="flex items-center gap-3 sm:gap-6">
          <nav
            aria-label="Primary Navigation"
            className="hidden items-center gap-6 md:flex"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  className={`relative py-1 text-sm tracking-wider transition-colors duration-500 ${
                    isActive
                      ? 'text-[#E8C87E]'
                      : 'text-[#FFF8F0]/85 hover:text-[#FFF8F0]'
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute inset-x-0 -bottom-0.5 h-[1.5px] rounded-full bg-[#D4A95C] transition-all duration-500 ease-luxury ${
                      isActive ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
                    }`}
                  />
                </button>
              )
            })}
          </nav>

          {/* Floating Gold Music Button with Live Equalizer */}
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute romantic music' : 'Mute romantic music'}
            className="glass-midnight flex h-10 items-center gap-2 rounded-full px-3.5 text-[#E8C87E] transition-transform duration-500 hover:scale-105"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-[#D4A95C]/80" />
            ) : (
              <>
                <Volume2 className="h-4 w-4 text-[#E8C87E]" />
                <span className="flex h-3.5 items-end gap-[2.5px]">
                  <span className="eq-bar h-3 w-[2px] rounded-full bg-[#E8C87E]" />
                  <span className="eq-bar h-3.5 w-[2px] rounded-full bg-[#D4A95C]" />
                  <span className="eq-bar h-2.5 w-[2px] rounded-full bg-[#FF6FA5]" />
                  <span className="eq-bar h-3 w-[2px] rounded-full bg-[#E8C87E]" />
                </span>
              </>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="glass-midnight flex h-10 w-10 items-center justify-center rounded-full text-[#E8C87E] md:hidden"
          >
            {mobileOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="glass-midnight mx-auto mt-3 flex max-w-xs flex-col gap-1 rounded-2xl p-3 md:hidden">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm tracking-wide transition-colors ${
                  isActive
                    ? 'bg-[#D4A95C]/15 text-[#E8C87E]'
                    : 'text-[#FFF8F0]/90 hover:bg-white/5'
                }`}
              >
                <span>{item.label}</span>
                {isActive && <span className="text-[#D4A95C]">♡</span>}
              </button>
            )
          })}
        </div>
      )}
    </header>
  )
}
