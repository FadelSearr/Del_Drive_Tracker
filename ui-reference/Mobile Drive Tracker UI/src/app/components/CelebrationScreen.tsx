import { useEffect, useState } from 'react';
import { CheckCircle, Map, BarChart2 } from 'lucide-react';

const CONFETTI_ITEMS = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: -10 - Math.random() * 20,
  size: 4 + Math.random() * 6,
  color: ['#4B7EFF', '#22C55E', '#F97316', '#EF4444', '#A855F7', '#EAB308'][i % 6],
  speed: 1.5 + Math.random() * 2,
  sway: (Math.random() - 0.5) * 40,
}));

function ConfettiBit({ item, tick }: { item: typeof CONFETTI_ITEMS[0]; tick: number }) {
  const progress = Math.min(1, (tick / 100) * item.speed);
  const y = item.y + progress * 120;
  const x = item.x + Math.sin(tick * 0.08 + item.id) * (item.sway * 0.3);
  if (progress >= 1) return null;
  return (
    <div
      className="absolute rounded-sm"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: item.size,
        height: item.size,
        background: item.color,
        opacity: 1 - progress * 0.8,
        transform: `rotate(${tick * 3 + item.id * 30}deg)`,
        pointerEvents: 'none',
      }}
    />
  );
}

const newMilestones = [
  { icon: '⚡', title: 'Speed Demon', sub: 'Reached 120+ km/h!' },
  { icon: '🔥', title: '5-Day Streak!', sub: 'Drove 5 days in a row' },
];

export function CelebrationScreen({
  onViewDrive,
  onBackToMap,
}: {
  onViewDrive: () => void;
  onBackToMap: () => void;
}) {
  const [tick, setTick] = useState(0);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 100);
    const interval = setInterval(() => setTick((p) => p + 1), 50);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className="size-full flex flex-col overflow-hidden relative"
      style={{ background: 'linear-gradient(160deg, #0A0F1E 0%, #09090F 100%)' }}
    >
      {/* Confetti */}
      {CONFETTI_ITEMS.map((item) => (
        <ConfettiBit key={item.id} item={item} tick={tick} />
      ))}

      {/* Glow */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 300,
          height: 300,
          background: '#22C55E',
          opacity: 0.06,
          top: -60,
          left: '50%',
          transform: 'translateX(-50%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 relative z-10">
        {/* Check icon */}
        <div
          style={{
            transform: animate ? 'scale(1)' : 'scale(0.4)',
            opacity: animate ? 1 : 0,
            transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease',
          }}
        >
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(34,197,94,0.15)',
              border: '2px solid rgba(34,197,94,0.3)',
              boxShadow: '0 0 40px rgba(34,197,94,0.2)',
            }}
          >
            <CheckCircle size={52} color="#22C55E" />
          </div>
        </div>

        {/* Title */}
        <div
          className="text-center"
          style={{
            opacity: animate ? 1 : 0,
            transform: animate ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.5s ease 0.2s',
          }}
        >
          <div className="text-white font-bold" style={{ fontSize: '28px', lineHeight: 1.2 }}>
            Drive Complete!
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginTop: 6 }}>
            Great drive — here's your summary
          </div>
        </div>

        {/* Quick stats */}
        <div
          className="w-full grid grid-cols-3 gap-2"
          style={{
            opacity: animate ? 1 : 0,
            transform: animate ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.5s ease 0.35s',
          }}
        >
          {[
            { label: 'Distance', value: '24.7 km' },
            { label: 'Duration', value: '45m 12s' },
            { label: 'Top Speed', value: '142 km/h' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl py-3 px-2 text-center"
              style={{ background: '#111120', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div style={{ fontSize: '15px', color: 'white', fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Streak card */}
        <div
          className="w-full rounded-2xl p-4"
          style={{
            background: 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(234,179,8,0.06))',
            border: '1px solid rgba(234,179,8,0.2)',
            opacity: animate ? 1 : 0,
            transform: animate ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.5s ease 0.45s',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span style={{ fontSize: '28px' }}>🔥</span>
              <div>
                <div style={{ color: '#EAB308', fontSize: '14px', fontWeight: 700 }}>
                  Driving Streak
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
                  Keep it up — drive tomorrow!
                </div>
              </div>
            </div>
            <div className="text-right">
              <div style={{ color: '#EAB308', fontSize: '28px', fontWeight: 800, lineHeight: 1 }}>5</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>days</div>
            </div>
          </div>
          <div
            className="mt-2 pt-2 flex justify-between text-sm"
            style={{ borderTop: '1px solid rgba(234,179,8,0.15)' }}
          >
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>
              Current: <strong style={{ color: '#EAB308' }}>🔥 5</strong>
            </span>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>
              Best: <strong style={{ color: 'white' }}>⭐ 12</strong>
            </span>
          </div>
        </div>

        {/* Milestones */}
        <div
          className="w-full"
          style={{
            opacity: animate ? 1 : 0,
            transform: animate ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.5s ease 0.55s',
          }}
        >
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: 8, letterSpacing: '0.06em' }}>
            MILESTONES UNLOCKED
          </div>
          <div className="flex flex-col gap-2">
            {newMilestones.map((m) => (
              <div
                key={m.title}
                className="flex items-center gap-3 rounded-2xl px-3 py-3"
                style={{
                  background: 'rgba(75,126,255,0.1)',
                  border: '1px solid rgba(75,126,255,0.2)',
                }}
              >
                <span style={{ fontSize: '22px' }}>{m.icon}</span>
                <div className="flex-1">
                  <div style={{ color: 'white', fontSize: '13px', fontWeight: 600 }}>{m.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{m.sub}</div>
                </div>
                <div
                  className="px-2 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(34,197,94,0.15)',
                    color: '#22C55E',
                    fontSize: '9px',
                    fontWeight: 700,
                    border: '1px solid rgba(34,197,94,0.2)',
                    letterSpacing: '0.05em',
                  }}
                >
                  NEW
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA buttons */}
      <div
        className="px-5 pb-6 flex flex-col gap-3 shrink-0 relative z-10"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.5s ease 0.65s',
        }}
      >
        <button
          onClick={onViewDrive}
          className="w-full flex items-center justify-center gap-2 rounded-2xl font-semibold transition-transform active:scale-95"
          style={{
            height: 54,
            background: 'linear-gradient(135deg, #4B7EFF, #7B4FFF)',
            color: 'white',
            fontSize: '16px',
            boxShadow: '0 8px 24px rgba(75,126,255,0.3)',
          }}
        >
          <BarChart2 size={18} />
          View Drive Summary
        </button>
        <button
          onClick={onBackToMap}
          className="w-full flex items-center justify-center gap-2 rounded-2xl font-semibold transition-transform active:scale-95"
          style={{
            height: 50,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '15px',
          }}
        >
          <Map size={16} />
          Back to Map
        </button>
      </div>
    </div>
  );
}
