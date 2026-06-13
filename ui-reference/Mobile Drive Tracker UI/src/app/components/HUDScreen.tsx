import { useState, useEffect, useRef } from 'react';

function SpeedometerRing({ speed, maxSpeed = 200 }: { speed: number; maxSpeed?: number }) {
  const size = 230;
  const cx = size / 2;
  const cy = size / 2;
  const r = 94;
  const circumference = 2 * Math.PI * r;
  const arcFraction = 0.75;
  const arcLength = circumference * arcFraction;
  const normalized = Math.min(speed / maxSpeed, 1);
  const dashOffset = arcLength - normalized * arcLength;

  const color =
    speed < 80 ? '#3B82F6' : speed < 120 ? '#F97316' : '#EF4444';
  const glowColor =
    speed < 80 ? '59,130,246' : speed < 120 ? '249,115,22' : '239,68,68';

  const ticks = Array.from({ length: 21 }, (_, i) => {
    const fraction = i / 20;
    const angle = (135 + fraction * 270) * (Math.PI / 180);
    const inner = r - 10;
    const outer = r - (i % 5 === 0 ? 18 : 12);
    return {
      x1: cx + Math.cos(angle) * inner,
      y1: cy + Math.sin(angle) * inner,
      x2: cx + Math.cos(angle) * outer,
      y2: cy + Math.sin(angle) * outer,
      major: i % 5 === 0,
    };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id="innerGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#111125" />
          <stop offset="100%" stopColor="#0C0C1A" />
        </radialGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Track ring */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="#1A1A2E"
        strokeWidth="20"
        strokeDasharray={`${arcLength} ${circumference}`}
        strokeDashoffset={0}
        transform={`rotate(135 ${cx} ${cy})`}
      />

      {/* Progress ring */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth="20"
        strokeLinecap="round"
        strokeDasharray={`${arcLength} ${circumference}`}
        strokeDashoffset={dashOffset}
        transform={`rotate(135 ${cx} ${cy})`}
        filter="url(#glow)"
        style={{ transition: 'stroke-dashoffset 0.12s linear, stroke 0.4s ease' }}
      />

      {/* Glow under ring */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth="32"
        strokeLinecap="round"
        strokeDasharray={`${arcLength} ${circumference}`}
        strokeDashoffset={dashOffset}
        transform={`rotate(135 ${cx} ${cy})`}
        opacity="0.08"
        style={{ transition: 'stroke-dashoffset 0.12s linear, stroke 0.4s ease' }}
      />

      {/* Tick marks */}
      {ticks.map((t, i) => (
        <line
          key={i}
          x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke={t.major ? '#3A3A5C' : '#252538'}
          strokeWidth={t.major ? 2 : 1}
        />
      ))}

      {/* Inner disc */}
      <circle cx={cx} cy={cy} r={r - 26} fill="url(#innerGrad)" />

      {/* Speed value */}
      <text
        x={cx} y={cy - 10}
        textAnchor="middle"
        fill="white"
        fontSize="46"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
        style={{ transition: 'fill 0.3s' }}
      >
        {Math.round(speed)}
      </text>
      <text
        x={cx} y={cy + 16}
        textAnchor="middle"
        fill="rgba(255,255,255,0.3)"
        fontSize="13"
        fontWeight="500"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="2"
      >
        KM/H
      </text>

      {/* Color indicator dot */}
      <circle cx={cx} cy={cy + 40} r="4" fill={color} style={{ transition: 'fill 0.4s' }} />
    </svg>
  );
}

function GForceMeter({ value, tick }: { value: number; tick: number }) {
  const dotX = Math.sin(tick * 0.8) * value * 0.55;
  const dotY = Math.cos(tick * 0.6) * value * 0.35;

  return (
    <div
      className="rounded-2xl p-3 flex flex-col"
      style={{ background: '#111120', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div
        className="text-xs uppercase tracking-widest mb-2"
        style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}
      >
        G-Force
      </div>
      <div className="flex items-center gap-3">
        {/* Crosshair */}
        <svg width="72" height="72" viewBox="-1 -1 2 2">
          <circle cx="0" cy="0" r="1" fill="none" stroke="#1E2040" strokeWidth="0.06" />
          <circle cx="0" cy="0" r="0.66" fill="none" stroke="#1A1C38" strokeWidth="0.04" />
          <circle cx="0" cy="0" r="0.33" fill="none" stroke="#161830" strokeWidth="0.03" />
          <line x1="-1" y1="0" x2="1" y2="0" stroke="#1A1C38" strokeWidth="0.04" />
          <line x1="0" y1="-1" x2="0" y2="1" stroke="#1A1C38" strokeWidth="0.04" />
          {/* Dot trail */}
          <circle
            cx={dotX * 0.8}
            cy={dotY * 0.8}
            r="0.14"
            fill="rgba(249,115,22,0.25)"
          />
          {/* Main dot */}
          <circle
            cx={dotX}
            cy={dotY}
            r="0.1"
            fill="#F97316"
          />
          <circle
            cx={dotX}
            cy={dotY}
            r="0.05"
            fill="white"
          />
        </svg>
        <div>
          <div className="text-white" style={{ fontSize: '26px', fontWeight: 700, lineHeight: 1 }}>
            {value.toFixed(2)}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>G units</div>
        </div>
      </div>
    </div>
  );
}

function CompassWidget({ heading }: { heading: number }) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const dir = directions[Math.round(heading / 45) % 8];

  return (
    <div
      className="rounded-2xl p-3 flex flex-col"
      style={{ background: '#111120', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div
        className="text-xs uppercase tracking-widest mb-2"
        style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}
      >
        Heading
      </div>
      <div className="flex items-center gap-3">
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r="32" fill="#0E0E1C" stroke="#1E2040" strokeWidth="2" />
          {['N', 'E', 'S', 'W'].map((d, i) => {
            const a = (i * 90 - 90) * (Math.PI / 180);
            return (
              <text
                key={d}
                x={36 + Math.cos(a) * 22}
                y={36 + Math.sin(a) * 22 + 4}
                textAnchor="middle"
                fill={d === 'N' ? '#EF4444' : '#3A4060'}
                fontSize="9"
                fontWeight="700"
              >
                {d}
              </text>
            );
          })}
          <g transform={`rotate(${heading} 36 36)`}>
            <polygon points="36,10 38.5,36 36,42 33.5,36" fill="#EF4444" />
            <polygon points="36,62 38.5,36 36,30 33.5,36" fill="#2A3060" />
          </g>
          <circle cx="36" cy="36" r="4" fill="#1A1A2E" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
        </svg>
        <div>
          <div className="text-white" style={{ fontSize: '26px', fontWeight: 700, lineHeight: 1 }}>
            {dir}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>{Math.round(heading)}°</div>
        </div>
      </div>
    </div>
  );
}

export function HUDScreen() {
  const [speed, setSpeed] = useState(0);
  const [gForce, setGForce] = useState(0.12);
  const [heading, setHeading] = useState(225);
  const [tick, setTick] = useState(0);
  const tRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      tRef.current += 0.1;
      const t = tRef.current;
      const base = 82 + Math.sin(t * 0.25) * 28 + Math.sin(t * 0.6) * 12;
      setSpeed(Math.max(0, base + (Math.random() - 0.5) * 4));
      setGForce((prev) =>
        Math.max(0.05, Math.min(1.4, prev + (Math.abs(Math.sin(t * 0.4)) * 0.3 - prev * 0.1) + (Math.random() - 0.5) * 0.04))
      );
      setHeading((h) => (h + (Math.random() - 0.5) * 1.2 + 360) % 360);
      setTick(t);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const speedColor =
    speed < 80 ? '#3B82F6' : speed < 120 ? '#F97316' : '#EF4444';
  const speedLabel =
    speed < 40 ? 'City' : speed < 80 ? 'Suburban' : speed < 120 ? 'Highway' : 'Track';

  return (
    <div
      className="size-full flex flex-col overflow-y-auto"
      style={{ background: '#09090F' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-3 pb-2 shrink-0">
        <div>
          <div className="text-white" style={{ fontSize: '20px', fontWeight: 700 }}>HUD</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Live Dashboard</div>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{
            background: 'rgba(34,197,94,0.12)',
            border: '1px solid rgba(34,197,94,0.25)',
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{
              background: '#22C55E',
              boxShadow: '0 0 6px #22C55E',
              animation: 'pulse 2s infinite',
            }}
          />
          <span style={{ color: '#22C55E', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em' }}>LIVE</span>
        </div>
      </div>

      {/* Speedometer */}
      <div className="flex justify-center shrink-0" style={{ paddingTop: 4 }}>
        <SpeedometerRing speed={speed} />
      </div>

      {/* Speed mode badge */}
      <div className="flex justify-center mb-3 shrink-0">
        <div
          className="px-4 py-1 rounded-full text-xs font-semibold tracking-wide"
          style={{
            background: `${speedColor}18`,
            border: `1px solid ${speedColor}30`,
            color: speedColor,
            transition: 'all 0.4s',
          }}
        >
          {speedLabel} Mode
        </div>
      </div>

      {/* G-Force + Compass */}
      <div className="grid grid-cols-2 gap-2 px-4 shrink-0">
        <GForceMeter value={gForce} tick={tick} />
        <CompassWidget heading={heading} />
      </div>

      {/* Bottom stats */}
      <div className="grid grid-cols-3 gap-2 px-4 mt-2 shrink-0">
        {[
          { label: 'Altitude', value: '45 m' },
          { label: 'GPS Lock', value: '12 sat' },
          { label: 'Accuracy', value: '±3 m' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl px-2 py-3 text-center"
            style={{ background: '#111120', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', marginBottom: 4 }}>
              {s.label.toUpperCase()}
            </div>
            <div style={{ fontSize: '13px', color: 'white', fontWeight: 600 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Speed trap alert (decorative) */}
      <div
        className="mx-4 mt-2 mb-4 px-4 py-3 rounded-xl flex items-center gap-3"
        style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)' }}
      >
        <div className="text-xl">⚡</div>
        <div>
          <div style={{ color: '#FB923C', fontSize: '12px', fontWeight: 600 }}>BSD Boulevard Trap</div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>Personal best: 124 km/h · 850m ahead</div>
        </div>
      </div>
    </div>
  );
}
