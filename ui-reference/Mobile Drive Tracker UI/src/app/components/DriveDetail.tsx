import { useState } from 'react';
import { ArrowLeft, Star, Share2 } from 'lucide-react';
import { mockDrives, getVehicle, formatDuration, formatDate, Drive } from './mockData';

const MINI_ROUTE = [[20, 80], [36, 80], [36, 64], [52, 52], [68, 40], [84, 28], [100, 18], [114, 10]];

function StaticMap({ drive }: { drive: Drive }) {
  const pts = MINI_ROUTE.map((p) => p.join(',')).join(' ');
  const segments: Array<{ x1: number; y1: number; x2: number; y2: number; c: string }> = [];
  for (let i = 1; i < MINI_ROUTE.length; i++) {
    const frac = i / MINI_ROUTE.length;
    const spd = drive.avgSpeed + frac * (drive.topSpeed - drive.avgSpeed);
    const c = spd < 60 ? '#3B82F6' : spd < 100 ? '#22C55E' : spd < 130 ? '#F97316' : '#EF4444';
    segments.push({ x1: MINI_ROUTE[i - 1][0], y1: MINI_ROUTE[i - 1][1], x2: MINI_ROUTE[i][0], y2: MINI_ROUTE[i][1], c });
  }
  return (
    <svg width="100%" height="110" viewBox="0 0 136 90" preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
      <rect width="136" height="90" fill="#0E0E1C" />
      {[18, 36, 54, 72].map((y) => (
        <line key={y} x1="0" y1={y} x2="136" y2={y} stroke="#161626" strokeWidth="6" />
      ))}
      {[20, 40, 60, 80, 100, 120].map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="90" stroke="#161626" strokeWidth="6" />
      ))}
      {segments.map((s, i) => (
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.c} strokeWidth="6" strokeLinecap="round" opacity="0.2" />
      ))}
      {segments.map((s, i) => (
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.c} strokeWidth="3" strokeLinecap="round" />
      ))}
      <circle cx={MINI_ROUTE[0][0]} cy={MINI_ROUTE[0][1]} r={5} fill="#22C55E" />
      <circle cx={MINI_ROUTE[MINI_ROUTE.length - 1][0]} cy={MINI_ROUTE[MINI_ROUTE.length - 1][1]} r={5} fill="#EF4444" />
    </svg>
  );
}

const SPEED_COLORS = ['#3B82F6', '#22C55E', '#F97316', '#EF4444', '#A855F7'];

function SpeedDistribution({ drive }: { drive: Drive }) {
  const [mode, setMode] = useState<'time' | 'dist'>('time');
  const pct = drive.speedDistribution;
  const maxSpd = drive.topSpeed;
  const labels = pct.map((_, i) => {
    const lo = Math.round((i / 5) * maxSpd);
    const hi = Math.round(((i + 1) / 5) * maxSpd);
    return `${lo}–${hi}`;
  });
  const totalSeconds = drive.durationSeconds;
  const times = pct.map((p) => Math.round((p / 100) * totalSeconds));

  const dominant = pct.indexOf(Math.max(...pct));

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: '#111120', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="flex justify-between items-center mb-3">
        <div style={{ color: 'white', fontSize: '14px', fontWeight: 600 }}>Speed Distribution</div>
        <div
          className="flex rounded-lg overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {(['time', 'dist'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-2.5 py-1 capitalize"
              style={{
                background: mode === m ? 'rgba(75,126,255,0.3)' : 'transparent',
                color: mode === m ? '#60A5FA' : 'rgba(255,255,255,0.4)',
                fontSize: '11px',
                fontWeight: mode === m ? 600 : 400,
              }}
            >
              {m === 'time' ? 'Time' : 'Dist'}
            </button>
          ))}
        </div>
      </div>

      {/* Stacked bar */}
      <div className="flex rounded-full overflow-hidden mb-4" style={{ height: 12 }}>
        {pct.map((p, i) => (
          <div
            key={i}
            style={{ width: `${p}%`, background: SPEED_COLORS[i], transition: 'width 0.5s' }}
          />
        ))}
      </div>

      {/* Dominant range */}
      <div
        className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl"
        style={{ background: `${SPEED_COLORS[dominant]}12`, border: `1px solid ${SPEED_COLORS[dominant]}20` }}
      >
        <div className="w-2 h-2 rounded-full" style={{ background: SPEED_COLORS[dominant] }} />
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>Dominant range:</span>
        <span style={{ color: SPEED_COLORS[dominant], fontSize: '12px', fontWeight: 700 }}>
          {labels[dominant]} km/h ({pct[dominant]}%)
        </span>
      </div>

      {/* Breakdown */}
      <div className="flex flex-col gap-2">
        {pct.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: SPEED_COLORS[i] }} />
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', width: 56 }}>{labels[i]}</div>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full" style={{ width: `${p}%`, background: SPEED_COLORS[i] }} />
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', width: 46, textAlign: 'right' }}>
              {mode === 'time'
                ? `${Math.floor(times[i] / 60)}m ${times[i] % 60}s`
                : `${((drive.distance * p) / 100).toFixed(1)} km`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DriveDetail({ driveId, onBack }: { driveId: string; onBack: () => void }) {
  const drive = mockDrives.find((d) => d.id === driveId) ?? mockDrives[0];
  const vehicle = getVehicle(drive.vehicleId);
  const [fav, setFav] = useState(drive.favorite);
  const t = drive.telematics;

  return (
    <div className="size-full flex flex-col overflow-hidden" style={{ background: '#09090F' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2 shrink-0">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: '#111120', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <ArrowLeft size={18} color="white" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold truncate" style={{ fontSize: '17px' }}>{drive.title}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{formatDate(drive.date)}</div>
        </div>
        <button onClick={() => setFav((p) => !p)}>
          <Star size={18} color={fav ? '#EAB308' : 'rgba(255,255,255,0.3)'} fill={fav ? '#EAB308' : 'none'} />
        </button>
        <button>
          <Share2 size={18} color="rgba(255,255,255,0.3)" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* Map + core stats */}
        <div
          className="rounded-2xl overflow-hidden mb-3"
          style={{ background: '#111120', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <StaticMap drive={drive} />
          <div className="p-3 grid grid-cols-4 gap-2">
            {[
              { label: 'Distance', value: `${drive.distance} km` },
              { label: 'Duration', value: formatDuration(drive.durationSeconds) },
              { label: 'Top Speed', value: `${drive.topSpeed} km/h` },
              { label: 'Avg Speed', value: `${drive.avgSpeed} km/h` },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div style={{ fontSize: '13px', color: 'white', fontWeight: 700 }}>{s.value}</div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle + weather */}
        <div className="flex gap-2 mb-3">
          <div
            className="flex-1 rounded-2xl px-3 py-3 flex items-center gap-2"
            style={{ background: '#111120', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <span style={{ fontSize: '18px' }}>🚗</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>
                {vehicle?.brand} {vehicle?.model}
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>{vehicle?.year} · {vehicle?.useCase}</div>
            </div>
          </div>
          <div
            className="flex-1 rounded-2xl px-3 py-3 flex items-center gap-2"
            style={{ background: '#111120', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <span style={{ fontSize: '18px' }}>🌡️</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>{drive.temperature}°C</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>Weather · Sunny</div>
            </div>
          </div>
        </div>

        {/* Telematics */}
        <div
          className="rounded-2xl p-4 mb-3"
          style={{ background: '#111120', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div style={{ color: 'white', fontSize: '14px', fontWeight: 600, marginBottom: 12 }}>
            Telematics Report
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Brake Pressed', value: `${t.brakeCount}×` },
              { label: 'Top Brake Force', value: `${t.topBrakeForce.toFixed(2)} G` },
              { label: 'Top Acceleration', value: `${t.topAcceleration.toFixed(1)} m/s²` },
              { label: 'Top Deceleration', value: `${t.topDeceleration.toFixed(1)} m/s²` },
              { label: 'Turns L / R', value: `${t.turnsLeft} / ${t.turnsRight}` },
              { label: 'Lane Changes', value: `${t.laneChanges}×` },
              { label: 'Stops', value: `${t.stops}` },
              { label: 'Stop Duration', value: formatDuration(t.stopDurationSeconds) },
              { label: 'Max G-Force', value: `${t.maxGForce.toFixed(2)} G` },
              { label: 'Altitude', value: `${t.altitude} m` },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl px-3 py-2.5"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: '14px', color: 'white', fontWeight: 700 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Speed distribution */}
        <SpeedDistribution drive={drive} />

        {/* Share button */}
        <button
          className="w-full mt-3 flex items-center justify-center gap-2 rounded-2xl transition-transform active:scale-95"
          style={{
            height: 52,
            background: 'linear-gradient(135deg, #4B7EFF, #7B4FFF)',
            color: 'white',
            fontSize: '15px',
            fontWeight: 600,
          }}
        >
          <Share2 size={18} />
          Share Drive Card
        </button>
      </div>
    </div>
  );
}
