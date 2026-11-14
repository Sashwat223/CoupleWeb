import React from 'react'

interface QuestionSectionProps {
  onYes: () => void
}

export const QuestionSection: React.FC<QuestionSectionProps> = ({ onYes }) => {
  return (
    <section
      id="question"
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 pb-24 pt-24 sm:px-8"
    >
      {/* Centre Glowing Arched Proposal Video (3D couple flanks this from FixedCoupleStage3D) */}
      <div className="relative flex w-full max-w-4xl flex-col items-center justify-center">
        <div className="relative z-10 h-64 w-56 shrink-0 overflow-hidden rounded-t-full border-2 border-[#D4A95C]/60 shadow-[0_0_55px_rgba(212,169,92,0.34)] sm:h-80 sm:w-72 md:h-[340px] md:w-[290px]">
          <video
            src="./assets/videos/boy-proposing.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgba(11, 30, 74, 0.72) 0%, rgba(11, 30, 74, 0.06) 50%, rgba(11, 30, 74, 0.2) 100%)',
            }}
          />
        </div>

        {/* Midnight-Blue Glass Proposal Panel */}
        <div className="glass-midnight relative z-20 -mt-5 w-full max-w-xl rounded-3xl px-6 py-7 text-center sm:px-10 sm:py-8">
          <p className="mb-1.5 font-script text-2xl text-[#F7C8D3] sm:text-3xl">
            My Forever &amp; Always
          </p>
          <h2 className="text-gold-gradient font-serif text-3xl font-semibold tracking-wide sm:text-4xl md:text-5xl">
            Will You Marry Me?
          </h2>

          {/* Pill Buttons: stacked on mobile, side-by-side on sm+ */}
          <div className="mt-7 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
            <button
              type="button"
              onClick={onYes}
              className="btn-yes flex w-full items-center justify-center gap-2.5 rounded-full px-8 py-3.5 text-base font-medium tracking-wider text-[#FFF8F0] sm:w-auto"
            >
              <span className="text-[#E8C87E]">♡</span>
              <span>Yes, Forever</span>
            </button>

            {/* NO button: strictly does nothing on click */}
            <button
              type="button"
              onClick={() => {}}
              className="btn-gold-outline flex w-full items-center justify-center rounded-full px-10 py-3.5 text-base font-normal tracking-wider text-[#FFF8F0]/90 sm:w-auto"
            >
              No
            </button>
          </div>

          <p className="mt-5 text-xs tracking-[0.16em] text-[#FFF8F0]/75 italic sm:text-sm">
            Take your time, my love...
          </p>
        </div>
      </div>
    </section>
  )
}
