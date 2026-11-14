import React from 'react'
import { SectionId } from './Navbar'

interface BottomProgressProps {
  activeSection: SectionId
  onNavigate: (id: SectionId) => void
}

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'hero', label: 'Our Story' },
  { id: 'memories', label: 'Memories' },
  { id: 'question', label: 'The Question' },
  { id: 'forever', label: 'Forever' },
]

export const BottomProgress: React.FC<BottomProgressProps> = ({
  activeSection,
  onNavigate,
}) => {
  const activeIdx = SECTIONS.findIndex((s) => s.id === activeSection)
  const progressPct = ((activeIdx + 1) / SECTIONS.length) * 100

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-6">
      <div className="pointer-events-auto flex w-full max-w-xs flex-col items-center gap-2.5">
        <div className="relative flex w-full items-center justify-between">
          {/* Thin gold background line */}
          <div className="absolute inset-x-0 top-1/2 h-[1px] -translate-y-1/2 bg-[#D4A95C]/30" />
          {/* Active gold progress line */}
          <div
            className="absolute left-0 top-1/2 h-[1.5px] -translate-y-1/2 bg-gradient-to-r from-[#D4A95C] to-[#E8C87E] transition-all duration-700 ease-luxury"
            style={{ width: `${Math.max(0, (activeIdx / (SECTIONS.length - 1)) * 100)}%` }}
          />
          {SECTIONS.map((sec, idx) => {
            const active = idx === activeIdx
            const passed = idx < activeIdx
            return (
              <button
                key={sec.id}
                type="button"
                aria-label={`Jump to ${sec.label}`}
                onClick={() => onNavigate(sec.id)}
                className="relative z-10 flex h-5 w-5 items-center justify-center focus:outline-none"
              >
                <span
                  className={`block rounded-full border border-[#D4A95C] transition-all duration-500 ${
                    active
                      ? 'h-3 w-3 bg-[#E8C87E] shadow-[0_0_12px_rgba(232,200,126,0.9)]'
                      : passed
                        ? 'h-2 w-2 bg-[#D4A95C]'
                        : 'h-2 w-2 bg-[#0B1E4A]'
                  }`}
                />
              </button>
            )
          })}
        </div>
        <span className="sr-only">Section progress {Math.round(progressPct)}%</span>
      </div>
    </div>
  )
}
