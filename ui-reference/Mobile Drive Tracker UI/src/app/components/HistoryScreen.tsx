import { useState } from 'react';
import { Search, SlidersHorizontal, Heart, Share2, Star } from 'lucide-react';
import { mockDrives, mockVehicles, formatDuration, formatDate, Drive } from './mockData';

const MINI_ROUTES: [number, number][][] = [
  [[8,38],[16,38],[16,28],[26,28],[30,22],[38,18],[46,14],[54,10]],
  [[8,42],[18,42],[18,32],[28,24],[36,20],[44,16],[52,14]],
  [[8,44],[14,40],[22,34],[32,26],[40,20],[50,15],[58,10]],
  [[8,40],[20,40],[24,32],[28,26],[36,22],[44,18],[52,12]],
];

function MiniMap({ routeIdx, color }: { routeIdx: number; color: string }) {
  const pts = MINI_ROUTES[routeIdx % MINI_ROUTES.length];
  const pts2 = pts.map((p) => p.join(',')).join(' ');
  return (
    <svg width="66" height="50" viewBox="0 0 66 50" style={{ borderRadius: 10, overflow: 'hidden', display: 'block' }}>
      <rect width="66" height="50" fill="#141424" />
      {[12, 24, 36].map((y) => (
        <line key={y} x1="0" y1={y} x2="66" y2={y} stroke="#1A1A2E" strokeWidth="4" />
      ))}
      {[16, 32, 48].map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="50" stroke="#1A1A2E" strokeWidth="4" />
      ))}
      <polyline points={pts2} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      <polyline points={pts2} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[0][0]} cy={pts[0][1]} r={3} fill="#22C55E" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={3} fill="#EF4444" />
    </svg>
  );
}

const speedColors = ['#3B82F6', '#22C55E', '#F97316', '#EF4444'];

function DriveCard({
  drive,
  idx,
  onSelect,
}: {
  drive: Drive;
  idx: number;
  onSelect: () => void;
}) {
  const [fav, setFav] = useState(drive.favorite);
  const vehicle = mockVehicles.find((v) => v.id === drive.vehicleId);
  const color = speedColors[idx % speedColors.length];

  return (
    <button
      onClick={onSelect}
      className="w-full text-left rounded-2xl overflow-hidden transition-transform active:scale-[0.98]"
      style={{ background: '#111120', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Top bar */}
      <div
        className="h-0.5 w-full"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
      />
      <div className="p-3">
        <div className="flex items-start gap-3">
          {/* Mini map */}
          <MiniMap routeIdx={idx} color={color} />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="text-white font-semibold truncate" style={{ fontSize: '14px' }}>
                {drive.title}
              </div>
              {fav && <Star size={13} fill="#EAB308" color="#EAB308" className="shrink-0" />}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>
              {formatDate(drive.date)} · {vehicle?.brand} {vehicle?.model}
            </div>
            {/* Stats */}
            <div className="flex gap-3">
              {[
                { v: `${drive.distance} km`, l: 'Dist' },
                { v: formatDuration(drive.durationSeconds), l: 'Time' },
                { v: `${drive.avgSpeed} km/h`, l: 'Avg' },
              ].map((s) => (
                <div key={s.l}>
                  <div style={{ fontSize: '13px', color: 'white', fontWeight: 600 }}>{s.v}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div
          className="flex items-center justify-between mt-2 pt-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div
            className="px-2 py-0.5 rounded-full text-xs"
            style={{
              background: `${color}18`,
              color: color,
              fontSize: '10px',
              fontWeight: 600,
            }}
          >
            Top {drive.topSpeed} km/h
          </div>
          <div className="flex gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFav((p) => !p);
              }}
              className="transition-transform active:scale-90"
            >
              <Heart
                size={16}
                color={fav ? '#EF4444' : 'rgba(255,255,255,0.25)'}
                fill={fav ? '#EF4444' : 'none'}
              />
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              className="transition-transform active:scale-90"
            >
              <Share2 size={16} color="rgba(255,255,255,0.25)" />
            </button>
          </div>
        </div>
      </div>
    </button>
  );
}

export function HistoryScreen({ onSelectDrive }: { onSelectDrive: (id: string) => void }) {
  const [tab, setTab] = useState<'activities' | 'stats'>('activities');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const totalDist = mockDrives.reduce((a, d) => a + d.distance, 0).toFixed(1);
  const filtered = mockDrives.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="size-full flex flex-col overflow-hidden" style={{ background: '#09090F' }}>
      {/* Header */}
      <div className="px-5 pt-3 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-white" style={{ fontSize: '20px', fontWeight: 700 }}>History</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Your drive log</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSearch((p) => !p)}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#111120', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <Search size={16} color="rgba(255,255,255,0.5)" />
            </button>
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#111120', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <SlidersHorizontal size={16} color="rgba(255,255,255,0.5)" />
            </button>
          </div>
        </div>

        {/* Search input */}
        {showSearch && (
          <div
            className="flex items-center gap-2 rounded-xl px-3 mb-3"
            style={{
              background: '#111120',
              border: '1px solid rgba(255,255,255,0.08)',
              height: 40,
            }}
          >
            <Search size={14} color="rgba(255,255,255,0.3)" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search drives..."
              className="flex-1 bg-transparent outline-none text-white text-sm placeholder-white/20"
              autoFocus
            />
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'Total Distance', value: `${totalDist} km`, color: '#4B7EFF' },
            { label: 'Drives', value: `${mockDrives.length}`, color: '#22C55E' },
            { label: 'Favorites', value: `${mockDrives.filter((d) => d.favorite).length}`, color: '#EAB308' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl py-2.5 px-3 text-center"
              style={{ background: `${s.color}12`, border: `1px solid ${s.color}20` }}
            >
              <div style={{ fontSize: '16px', color: s.color, fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}>
                {s.label.toUpperCase()}
              </div>
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <div
          className="flex rounded-xl p-1"
          style={{ background: '#111120', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          {(['activities', 'stats'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-1.5 rounded-lg capitalize transition-all"
              style={{
                background: tab === t ? '#1E1E32' : 'transparent',
                color: tab === t ? 'white' : 'rgba(255,255,255,0.35)',
                fontSize: '13px',
                fontWeight: tab === t ? 600 : 400,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {tab === 'activities' ? (
          filtered.length > 0 ? (
            <div className="flex flex-col gap-3">
              {filtered.map((drive, i) => (
                <DriveCard
                  key={drive.id}
                  drive={drive}
                  idx={i}
                  onSelect={() => onSelectDrive(drive.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
              <div style={{ fontSize: '48px' }}>🗺️</div>
              <div className="text-white text-center" style={{ fontSize: '16px', fontWeight: 600 }}>No drives found</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Start your first drive on the Map tab</div>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-2 pt-1">
            {[
              { label: 'Avg Drive Distance', value: `${(Number(totalDist) / mockDrives.length).toFixed(1)} km` },
              { label: 'Avg Top Speed', value: `${Math.round(mockDrives.reduce((a, d) => a + d.topSpeed, 0) / mockDrives.length)} km/h` },
              { label: 'Total Drive Time', value: '4h 22m' },
              { label: 'Best Day', value: 'Jun 9' },
            ].map((s) => (
              <div
                key={s.label}
                className="flex justify-between items-center px-4 py-3 rounded-xl"
                style={{ background: '#111120', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>{s.label}</span>
                <span style={{ color: 'white', fontSize: '14px', fontWeight: 700 }}>{s.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
