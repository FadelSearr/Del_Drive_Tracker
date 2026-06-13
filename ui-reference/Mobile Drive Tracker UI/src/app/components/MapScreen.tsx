import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Navigation } from 'lucide-react';

const ROUTE_POINTS: [number, number][] = [
  [55, 255], [90, 255], [90, 215], [130, 215], [155, 190],
  [185, 175], [210, 155], [230, 135], [255, 118], [285, 105],
  [310, 88], [338, 70], [358, 58],
];

function speedColor(spd: number): string {
  if (spd < 40) return '#3B82F6';
  if (spd < 80) return '#22C55E';
  if (spd < 120) return '#F97316';
  if (spd < 160) return '#EF4444';
  return '#A855F7';
}

function FakeMap({
  progress,
  active,
  currentSpeed,
}: {
  progress: number;
  active: boolean;
  currentSpeed: number;
}) {
  const maxPt = Math.max(2, Math.floor(progress * ROUTE_POINTS.length));
  const visible = ROUTE_POINTS.slice(0, maxPt);
  const cur = visible[visible.length - 1] || ROUTE_POINTS[0];
  const color = speedColor(currentSpeed);

  // Build colored segments
  const segments: Array<{ x1: number; y1: number; x2: number; y2: number; spd: number }> = [];
  for (let i = 1; i < visible.length; i++) {
    const frac = i / ROUTE_POINTS.length;
    const spd = currentSpeed * (0.7 + frac * 0.3) + (Math.random() - 0.5) * 10;
    segments.push({
      x1: visible[i - 1][0],
      y1: visible[i - 1][1],
      x2: visible[i][0],
      y2: visible[i][1],
      spd,
    });
  }

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 390 290"
      preserveAspectRatio="xMidYMid slice"
      style={{ display: 'block' }}
    >
      {/* Background */}
      <rect width="390" height="290" fill="#141422" />

      {/* Major horizontal streets */}
      {[48, 95, 143, 190, 238, 285].map((y) => (
        <line key={y} x1="0" y1={y} x2="390" y2={y} stroke="#1E1E32" strokeWidth="11" />
      ))}
      {/* Major vertical streets */}
      {[52, 104, 156, 208, 260, 312, 364].map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="290" stroke="#1E1E32" strokeWidth="11" />
      ))}

      {/* Minor horizontals */}
      {[24, 72, 119, 167, 215, 263].map((y) => (
        <line key={y} x1="0" y1={y} x2="390" y2={y} stroke="#191928" strokeWidth="4" />
      ))}
      {/* Minor verticals */}
      {[26, 78, 130, 182, 234, 286, 338].map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="290" stroke="#191928" strokeWidth="4" />
      ))}

      {/* Street labels */}
      <text x="56" y="44" fill="#252545" fontSize="8" fontFamily="system-ui">MAIN ST</text>
      <text x="108" y="91" fill="#252545" fontSize="8" fontFamily="system-ui">HIGHWAY BLVD</text>

      {/* Route glow */}
      {segments.map((seg, i) => (
        <line
          key={i}
          x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
          stroke={speedColor(seg.spd)}
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.15"
        />
      ))}

      {/* Route */}
      {segments.map((seg, i) => (
        <line
          key={i}
          x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
          stroke={speedColor(seg.spd)}
          strokeWidth="4"
          strokeLinecap="round"
        />
      ))}

      {/* Start marker */}
      {visible.length > 0 && (
        <>
          <circle cx={ROUTE_POINTS[0][0]} cy={ROUTE_POINTS[0][1]} r={9} fill="rgba(34,197,94,0.2)" />
          <circle cx={ROUTE_POINTS[0][0]} cy={ROUTE_POINTS[0][1]} r={5} fill="#22C55E" />
          <text x={ROUTE_POINTS[0][0] + 10} y={ROUTE_POINTS[0][1] + 4} fill="#22C55E" fontSize="9" fontFamily="system-ui" fontWeight="700">START</text>
        </>
      )}

      {/* Current position */}
      {active && visible.length > 1 && (
        <>
          <circle cx={cur[0]} cy={cur[1]} r={14} fill={`${color}22`} />
          <circle cx={cur[0]} cy={cur[1]} r={9} fill={`${color}44`} />
          <circle cx={cur[0]} cy={cur[1]} r={5} fill={color} />
          <circle cx={cur[0]} cy={cur[1]} r={2.5} fill="white" />
        </>
      )}

      {/* Speed legend */}
      <g transform="translate(14, 250)">
        <rect x="0" y="0" width="120" height="30" rx="6" fill="rgba(10,10,20,0.75)" />
        {[
          ['#3B82F6', '<40'],
          ['#22C55E', '40-80'],
          ['#F97316', '80-120'],
          ['#EF4444', '120+'],
        ].map(([c, label], i) => (
          <g key={i} transform={`translate(${6 + i * 29}, 8)`}>
            <rect width="20" height="5" rx="2" fill={c} />
            <text x="0" y="18" fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="system-ui">{label}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function formatTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export function MapScreen({ onDriveComplete }: { onDriveComplete: () => void }) {
  const [state, setState] = useState<'idle' | 'recording' | 'paused'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [topSpeed, setTopSpeed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [alert, setAlert] = useState<string | null>(null);
  const tickRef = useRef(0);

  useEffect(() => {
    if (state !== 'recording') return;
    const interval = setInterval(() => {
      tickRef.current += 1;
      const t = tickRef.current;
      const spd = 70 + Math.sin(t * 0.15) * 40 + Math.sin(t * 0.4) * 15 + (Math.random() - 0.5) * 8;
      const s = Math.max(5, spd);
      setCurrentSpeed(s);
      setTopSpeed((prev) => Math.max(prev, s));
      setDistance((prev) => prev + s / 3600);
      setElapsed((prev) => prev + 1);
      setProgress((prev) => Math.min(1, prev + 0.008));

      // Random trap alert
      if (t === 15) {
        setAlert('⚡ BSD Boulevard Trap — 124 km/h');
        setTimeout(() => setAlert(null), 3000);
      }
      if (t === 35) {
        setAlert('🔵 BSD Sprint Zone — Start!');
        setTimeout(() => setAlert(null), 3000);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [state]);

  const handleStart = () => {
    setState('recording');
    tickRef.current = 0;
  };
  const handlePause = () => setState(state === 'paused' ? 'recording' : 'paused');
  const handleEnd = () => {
    setState('idle');
    onDriveComplete();
  };

  return (
    <div className="size-full flex flex-col" style={{ background: '#09090F' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-3 pb-2 shrink-0">
        <div>
          <div className="text-white" style={{ fontSize: '20px', fontWeight: 700 }}>Map</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Drive Recording</div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: state === 'recording' ? '#22C55E' : state === 'paused' ? '#F97316' : '#3A3A5A',
              boxShadow: state === 'recording' ? '0 0 6px #22C55E' : 'none',
            }}
          />
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
            {state === 'recording' ? 'Recording' : state === 'paused' ? 'Paused' : 'Standby'}
          </span>
        </div>
      </div>

      {/* Map */}
      <div className="relative shrink-0" style={{ height: 290 }}>
        <FakeMap
          progress={progress}
          active={state === 'recording'}
          currentSpeed={currentSpeed}
        />

        {/* Alert banner */}
        {alert && (
          <div
            className="absolute top-3 left-3 right-3 px-4 py-2 rounded-xl flex items-center gap-2"
            style={{
              background: 'rgba(10,10,22,0.92)',
              border: '1px solid rgba(249,115,22,0.4)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ fontSize: '14px', color: '#FB923C', fontWeight: 600 }}>{alert}</span>
          </div>
        )}

        {/* Follow mode indicator */}
        <div
          className="absolute bottom-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(10,10,22,0.85)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Navigation size={16} color="#4B7EFF" />
        </div>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3 shrink-0">
        {[
          { label: 'Time', value: formatTime(elapsed) },
          { label: 'Top Speed', value: `${Math.round(topSpeed)} km/h` },
          { label: 'Distance', value: `${distance.toFixed(2)} km` },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl py-3 px-2 text-center"
            style={{ background: '#111120', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', marginBottom: 4 }}>
              {s.label.toUpperCase()}
            </div>
            <div style={{ fontSize: '15px', color: 'white', fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Speed zones info */}
      <div className="px-4 shrink-0">
        <div
          className="px-3 py-2.5 rounded-xl flex items-center justify-between"
          style={{ background: '#111120', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '16px' }}>⚡</span>
            <div>
              <div style={{ fontSize: '12px', color: 'white', fontWeight: 600 }}>BSD Sprint Zone</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>PB: 47.3s · 1.2 km ahead</div>
            </div>
          </div>
          <div
            className="px-2 py-0.5 rounded-full text-xs"
            style={{ background: 'rgba(75,126,255,0.15)', color: '#60A5FA', fontSize: '10px' }}
          >
            ZONE
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
        {state === 'idle' ? (
          <button
            onClick={handleStart}
            className="w-full flex items-center justify-center gap-3 rounded-2xl transition-transform active:scale-95"
            style={{
              height: 60,
              background: 'linear-gradient(135deg, #22C55E, #16A34A)',
              fontSize: '17px',
              fontWeight: 700,
              color: 'white',
              boxShadow: '0 8px 32px rgba(34,197,94,0.3)',
            }}
          >
            <Play size={22} fill="white" />
            Start Drive
          </button>
        ) : (
          <div className="w-full flex gap-3">
            <button
              onClick={handlePause}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl transition-transform active:scale-95"
              style={{
                height: 56,
                background: state === 'paused' ? 'linear-gradient(135deg, #22C55E, #16A34A)' : '#1C1C2E',
                border: state === 'paused' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                color: 'white',
                fontWeight: 600,
                fontSize: '15px',
              }}
            >
              {state === 'paused' ? <Play size={18} fill="white" /> : <Pause size={18} />}
              {state === 'paused' ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={handleEnd}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl transition-transform active:scale-95"
              style={{
                height: 56,
                background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                color: 'white',
                fontWeight: 600,
                fontSize: '15px',
                boxShadow: '0 6px 20px rgba(239,68,68,0.3)',
              }}
            >
              <Square size={16} fill="white" />
              End Drive
            </button>
          </div>
        )}

        {state === 'recording' && (
          <div
            className="w-full px-4 py-3 rounded-xl flex items-center gap-3"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}
          >
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: '#22C55E', boxShadow: '0 0 8px #22C55E', animation: 'pulse 1.5s infinite' }}
            />
            <div>
              <div style={{ color: '#22C55E', fontSize: '12px', fontWeight: 600 }}>GPS Active · High Accuracy</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>Haversine distance · 2s polling · Accel @ 10Hz</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
