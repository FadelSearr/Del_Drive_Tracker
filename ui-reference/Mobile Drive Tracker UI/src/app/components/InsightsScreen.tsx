import { mockDrives, mockMilestones } from './mockData';

const speedCategories = [
  { label: 'City', range: '0–40', color: '#22C55E' },
  { label: 'Suburban', range: '40–80', color: '#EAB308' },
  { label: 'Highway', range: '80–120', color: '#F97316' },
  { label: 'Track', range: '120+', color: '#EF4444' },
];

function calcSpeedProfile() {
  let city = 0, suburban = 0, highway = 0, track = 0;
  mockDrives.forEach((d) => {
    const avg = d.avgSpeed;
    const top = d.topSpeed;
    const mid = (avg + top) / 2;
    if (mid < 40) city++;
    else if (mid < 80) suburban++;
    else if (mid < 120) highway++;
    else track++;
  });
  const total = mockDrives.length;
  return [
    Math.round((city / total) * 100),
    Math.round((suburban / total) * 100),
    Math.round((highway / total) * 100),
    Math.round((track / total) * 100),
  ];
}

const HEATMAP_POINTS = Array.from({ length: 120 }, (_, i) => ({
  x: 30 + ((i * 137.5) % 320),
  y: 20 + ((i * 91.3) % 220),
  r: 4 + Math.sin(i * 0.7) * 3,
  o: 0.1 + Math.sin(i * 0.4) * 0.08 + Math.random() * 0.05,
  c: i % 4 === 0 ? '#EF4444' : i % 3 === 0 ? '#F97316' : i % 2 === 0 ? '#22C55E' : '#3B82F6',
}));

export function InsightsScreen() {
  const totalDist = mockDrives.reduce((a, d) => a + d.distance, 0).toFixed(0);
  const allTopSpeed = Math.max(...mockDrives.map((d) => d.topSpeed));
  const totalTime = mockDrives.reduce((a, d) => a + d.durationSeconds, 0);
  const totalH = Math.floor(totalTime / 3600);
  const totalM = Math.floor((totalTime % 3600) / 60);

  const profile = calcSpeedProfile();

  return (
    <div className="size-full flex flex-col overflow-hidden" style={{ background: '#09090F' }}>
      {/* Header */}
      <div className="px-5 pt-3 pb-3 shrink-0">
        <div className="text-white" style={{ fontSize: '20px', fontWeight: 700 }}>Insights</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Driving Analytics</div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* Global stats 2×2 */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { label: 'Total Distance', value: `${totalDist} km`, icon: '🗺️', color: '#4B7EFF' },
            { label: 'Top Speed', value: `${allTopSpeed} km/h`, icon: '⚡', color: '#F97316' },
            { label: 'Drive Time', value: `${totalH}h ${totalM}m`, icon: '⏱️', color: '#22C55E' },
            { label: 'Total Drives', value: `${mockDrives.length}`, icon: '🚗', color: '#A855F7' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-4"
              style={{ background: '#111120', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div className="text-2xl mb-2">{s.icon}</div>
              <div style={{ fontSize: '22px', color: s.color, fontWeight: 700, lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Speed Profile */}
        <div
          className="rounded-2xl p-4 mb-4"
          style={{ background: '#111120', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex justify-between items-center mb-3">
            <div className="text-white font-semibold" style={{ fontSize: '14px' }}>Speed Profile</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>All drives</div>
          </div>

          {/* Stacked bar */}
          <div className="flex rounded-full overflow-hidden mb-3" style={{ height: 10 }}>
            {speedCategories.map((cat, i) => (
              <div
                key={cat.label}
                style={{
                  width: `${profile[i]}%`,
                  background: cat.color,
                  transition: 'width 0.6s ease',
                }}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {speedCategories.map((cat, i) => (
              <div key={cat.label} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: cat.color }}
                />
                <div>
                  <span style={{ fontSize: '12px', color: 'white', fontWeight: 600 }}>{profile[i]}%</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>
                    {cat.label} ({cat.range})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap */}
        <div
          className="rounded-2xl overflow-hidden mb-4"
          style={{ background: '#111120', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="px-4 pt-4 pb-2 flex justify-between items-center">
            <div className="text-white font-semibold" style={{ fontSize: '14px' }}>Driving Heatmap</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>All GPS points</div>
          </div>
          <div style={{ height: 180, position: 'relative' }}>
            <svg width="100%" height="180" viewBox="0 0 390 180" preserveAspectRatio="xMidYMid slice">
              <rect width="390" height="180" fill="#0E0E1C" />
              {[30, 60, 90, 120, 150].map((y) => (
                <line key={y} x1="0" y1={y} x2="390" y2={y} stroke="#161628" strokeWidth="3" />
              ))}
              {[60, 120, 180, 240, 300, 360].map((x) => (
                <line key={x} x1={x} y1="0" x2={x} y2="180" stroke="#161628" strokeWidth="3" />
              ))}
              <defs>
                {HEATMAP_POINTS.map((p, i) => (
                  <radialGradient key={i} id={`hg${i}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={p.c} stopOpacity={p.o * 2} />
                    <stop offset="100%" stopColor={p.c} stopOpacity="0" />
                  </radialGradient>
                ))}
              </defs>
              {HEATMAP_POINTS.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={p.r * 4} fill={`url(#hg${i})`} />
              ))}
              {HEATMAP_POINTS.filter((_, i) => i % 8 === 0).map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={1.5} fill={p.c} opacity={0.6} />
              ))}
            </svg>
          </div>
        </div>

        {/* Milestones */}
        <div
          className="rounded-2xl p-4"
          style={{ background: '#111120', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="text-white font-semibold mb-3" style={{ fontSize: '14px' }}>
            Milestones
          </div>
          <div className="flex flex-col gap-2">
            {mockMilestones.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 px-3 py-3 rounded-xl"
                style={{
                  background: m.unlocked ? 'rgba(75,126,255,0.07)' : 'rgba(255,255,255,0.03)',
                  border: m.unlocked
                    ? '1px solid rgba(75,126,255,0.15)'
                    : '1px solid rgba(255,255,255,0.05)',
                  opacity: m.unlocked ? 1 : 0.5,
                }}
              >
                <div style={{ fontSize: '24px' }}>{m.icon}</div>
                <div className="flex-1">
                  <div style={{ color: m.unlocked ? 'white' : 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 600 }}>
                    {m.title}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>{m.desc}</div>
                </div>
                {m.unlocked ? (
                  <div
                    className="px-2 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(34,197,94,0.15)',
                      color: '#22C55E',
                      fontSize: '9px',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      border: '1px solid rgba(34,197,94,0.2)',
                    }}
                  >
                    UNLOCKED
                  </div>
                ) : (
                  <div
                    className="px-2 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.25)',
                      fontSize: '9px',
                      letterSpacing: '0.05em',
                    }}
                  >
                    LOCKED
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Driving Streak */}
        <div
          className="rounded-2xl p-4 mt-4"
          style={{
            background: 'linear-gradient(135deg, rgba(75,126,255,0.15), rgba(168,85,247,0.1))',
            border: '1px solid rgba(75,126,255,0.2)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-semibold" style={{ fontSize: '14px' }}>Driving Streak</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>Consecutive days with a drive</div>
            </div>
            <div className="text-center">
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#4B7EFF', lineHeight: 1 }}>5</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>days</div>
            </div>
          </div>
          <div
            className="mt-3 pt-3 flex justify-between"
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>CURRENT STREAK</div>
              <div style={{ color: 'white', fontSize: '16px', fontWeight: 700 }}>🔥 5 days</div>
            </div>
            <div className="text-right">
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>BEST STREAK</div>
              <div style={{ color: 'white', fontSize: '16px', fontWeight: 700 }}>⭐ 12 days</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
