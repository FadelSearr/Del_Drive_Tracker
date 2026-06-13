import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

const slides = [
  {
    title: 'Welcome to\nDel Road',
    subtitle: 'Your personal driving companion that makes every journey unforgettable.',
    emoji: '🚗',
    accent: '#4B7EFF',
    bgFrom: '#0D1220',
    bgTo: '#0A1030',
    ring: 'rgba(75,126,255,0.15)',
  },
  {
    title: 'Drive &\nTrack',
    subtitle: 'Record GPS routes, live speed, G-Force, altitude and full telematics in real-time.',
    emoji: '📍',
    accent: '#F97316',
    bgFrom: '#1A0E06',
    bgTo: '#120A04',
    ring: 'rgba(249,115,22,0.15)',
  },
  {
    title: 'Compete &\nShare',
    subtitle: 'Unlock milestones, beat personal bests on speed traps, and share beautiful drive cards.',
    emoji: '🏆',
    accent: '#A855F7',
    bgFrom: '#130D1A',
    bgTo: '#0E0912',
    ring: 'rgba(168,85,247,0.15)',
  },
];

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [current, setCurrent] = useState(0);
  const slide = slides[current];

  const next = () => {
    if (current < slides.length - 1) setCurrent(current + 1);
    else onComplete();
  };

  return (
    <div
      className="size-full flex flex-col relative overflow-hidden transition-all duration-700"
      style={{ background: `linear-gradient(160deg, ${slide.bgFrom} 0%, ${slide.bgTo} 100%)` }}
    >
      {/* Glow blobs */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 340,
          height: 340,
          background: slide.accent,
          opacity: 0.06,
          top: -100,
          right: -80,
          filter: 'blur(70px)',
          transition: 'background 0.7s',
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 260,
          height: 260,
          background: slide.accent,
          opacity: 0.04,
          bottom: 80,
          left: -80,
          filter: 'blur(60px)',
          transition: 'background 0.7s',
        }}
      />

      {/* Skip */}
      <div className="flex justify-end px-6 pt-4 relative z-10">
        {current < slides.length - 1 && (
          <button
            onClick={onComplete}
            className="text-sm px-3 py-1 rounded-full"
            style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)' }}
          >
            Skip
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
        {/* Emoji ring */}
        <div
          className="flex items-center justify-center rounded-full mb-8 transition-all duration-700"
          style={{
            width: 140,
            height: 140,
            background: slide.ring,
            border: `1px solid ${slide.accent}22`,
            fontSize: '72px',
          }}
        >
          {slide.emoji}
        </div>

        <h1
          className="text-white text-center mb-4"
          style={{
            fontSize: '36px',
            fontWeight: 700,
            lineHeight: 1.15,
            whiteSpace: 'pre-line',
            letterSpacing: '-0.5px',
          }}
        >
          {slide.title}
        </h1>

        <p
          className="text-center"
          style={{
            fontSize: '15px',
            lineHeight: 1.65,
            color: 'rgba(255,255,255,0.55)',
            maxWidth: 300,
          }}
        >
          {slide.subtitle}
        </p>
      </div>

      {/* Bottom controls */}
      <div className="px-6 pb-10 flex flex-col items-center gap-5 relative z-10">
        {/* Pagination dots */}
        <div className="flex gap-2">
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? 28 : 8,
                height: 8,
                background: i === current ? slide.accent : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={next}
          className="w-full flex items-center justify-center gap-2 rounded-2xl transition-transform active:scale-95"
          style={{
            height: 56,
            background: `linear-gradient(135deg, ${slide.accent} 0%, ${slide.accent}AA 100%)`,
            fontSize: '16px',
            fontWeight: 600,
            color: 'white',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: `0 8px 32px ${slide.accent}40`,
          }}
        >
          {current < slides.length - 1 ? 'Continue' : 'Get Started'}
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
