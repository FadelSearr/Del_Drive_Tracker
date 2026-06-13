import { useState } from 'react';
import { Plus, X, ChevronRight } from 'lucide-react';
import { Vehicle } from './mockData';

const initialVehicles: Vehicle[] = [
  {
    id: '1',
    brand: 'Porsche',
    model: '911 GT3 RS',
    year: 2023,
    useCase: 'Track',
    elo: 1850,
    totalDistance: 1247,
    topSpeed: 163,
    active: true,
    color: '#EF4444',
  },
  {
    id: '2',
    brand: 'Toyota',
    model: 'Tacoma',
    year: 2021,
    useCase: 'Daily',
    elo: 1200,
    totalDistance: 3891,
    topSpeed: 98,
    active: false,
    color: '#3B82F6',
  },
];

const USE_CASES = ['Daily', 'Track', 'Off-road'] as const;

const categoryColors: Record<string, string> = {
  Daily: '#22C55E',
  Track: '#EF4444',
  'Off-road': '#F97316',
};

function CarSVG({ color }: { color: string }) {
  return (
    <svg width="100" height="48" viewBox="0 0 100 48" fill="none">
      <rect x="10" y="20" width="80" height="20" rx="6" fill={color} opacity="0.2" />
      <rect x="10" y="20" width="80" height="20" rx="6" stroke={color} strokeWidth="1.5" />
      <path d="M22 20 L30 8 L70 8 L78 20" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1" />
      <circle cx="25" cy="42" r="6" fill="#1A1A2E" stroke={color} strokeWidth="1.5" />
      <circle cx="25" cy="42" r="2.5" fill={color} opacity="0.6" />
      <circle cx="75" cy="42" r="6" fill="#1A1A2E" stroke={color} strokeWidth="1.5" />
      <circle cx="75" cy="42" r="2.5" fill={color} opacity="0.6" />
      <rect x="32" y="12" width="16" height="8" rx="2" fill={color} opacity="0.15" stroke={color} strokeWidth="1" />
      <rect x="52" y="12" width="16" height="8" rx="2" fill={color} opacity="0.15" stroke={color} strokeWidth="1" />
      <rect x="12" y="26" width="10" height="6" rx="2" fill="rgba(255,200,50,0.4)" />
      <rect x="78" y="26" width="10" height="6" rx="2" fill="rgba(255,80,80,0.4)" />
    </svg>
  );
}

function EloBar({ elo }: { elo: number }) {
  const pct = Math.min(100, ((elo - 800) / 1400) * 100);
  const color = elo > 1600 ? '#EF4444' : elo > 1300 ? '#F97316' : '#3B82F6';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span style={{ fontSize: '12px', color, fontWeight: 700 }}>{elo}</span>
    </div>
  );
}

function AddVehicleModal({ onClose, onAdd }: { onClose: () => void; onAdd: (v: Vehicle) => void }) {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('2024');
  const [useCase, setUseCase] = useState<'Daily' | 'Track' | 'Off-road'>('Daily');

  const handleAdd = () => {
    if (!brand || !model) return;
    onAdd({
      id: Date.now().toString(),
      brand,
      model,
      year: Number(year),
      useCase,
      elo: 1000,
      totalDistance: 0,
      topSpeed: 0,
      active: false,
      color: categoryColors[useCase],
    });
    onClose();
  };

  const inputStyle = {
    background: '#1A1A2C',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    height: 46,
    color: 'white',
    fontSize: '14px',
    padding: '0 14px',
    width: '100%',
    outline: 'none',
  };

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="rounded-t-3xl p-5"
        style={{ background: '#0F0F1E', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.2)' }} />

        <div className="flex justify-between items-center mb-5">
          <div className="text-white font-bold" style={{ fontSize: '18px' }}>Add Vehicle</div>
          <button onClick={onClose}>
            <X size={20} color="rgba(255,255,255,0.4)" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: 6, letterSpacing: '0.06em' }}>
              BRAND
            </div>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Porsche"
              style={inputStyle}
              className="placeholder-white/20"
            />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: 6, letterSpacing: '0.06em' }}>
              MODEL
            </div>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. 911 GT3 RS"
              style={inputStyle}
              className="placeholder-white/20"
            />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: 6, letterSpacing: '0.06em' }}>
              YEAR
            </div>
            <input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2024"
              type="number"
              style={inputStyle}
              className="placeholder-white/20"
            />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: 6, letterSpacing: '0.06em' }}>
              USE CASE
            </div>
            <div className="flex gap-2">
              {USE_CASES.map((uc) => (
                <button
                  key={uc}
                  onClick={() => setUseCase(uc)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: useCase === uc ? `${categoryColors[uc]}22` : 'rgba(255,255,255,0.04)',
                    border: useCase === uc ? `1px solid ${categoryColors[uc]}40` : '1px solid rgba(255,255,255,0.07)',
                    color: useCase === uc ? categoryColors[uc] : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {uc}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleAdd}
            className="w-full rounded-2xl font-bold mt-1 transition-transform active:scale-95"
            style={{
              height: 52,
              background: 'linear-gradient(135deg, #4B7EFF, #7B4FFF)',
              color: 'white',
              fontSize: '16px',
            }}
          >
            Add to Garage
          </button>
        </div>
      </div>
    </div>
  );
}

export function GarageScreen() {
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [showModal, setShowModal] = useState(false);

  const setActive = (id: string) => {
    setVehicles((prev) => prev.map((v) => ({ ...v, active: v.id === id })));
  };

  const addVehicle = (v: Vehicle) => {
    setVehicles((prev) => [...prev, v]);
  };

  return (
    <div className="size-full flex flex-col overflow-hidden relative" style={{ background: '#09090F' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-3 pb-3 shrink-0">
        <div>
          <div className="text-white" style={{ fontSize: '20px', fontWeight: 700 }}>Garage</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
            {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-transform active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #4B7EFF, #7B4FFF)',
            color: 'white',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <Plus size={15} />
          Add
        </button>
      </div>

      {/* Vehicles */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-3">
        {vehicles.map((v) => {
          const catColor = categoryColors[v.useCase];
          return (
            <button
              key={v.id}
              onClick={() => setActive(v.id)}
              className="w-full text-left rounded-2xl overflow-hidden transition-transform active:scale-[0.98]"
              style={{
                background: '#111120',
                border: v.active ? `1px solid ${v.color}40` : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {/* Active stripe */}
              {v.active && (
                <div
                  className="h-0.5 w-full"
                  style={{ background: `linear-gradient(90deg, ${v.color}, transparent)` }}
                />
              )}

              <div className="p-4">
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-white font-bold" style={{ fontSize: '16px' }}>
                        {v.brand} {v.model}
                      </span>
                      {v.active && (
                        <span
                          className="px-2 py-0.5 rounded-full"
                          style={{
                            background: 'rgba(34,197,94,0.15)',
                            color: '#22C55E',
                            fontSize: '9px',
                            fontWeight: 700,
                            border: '1px solid rgba(34,197,94,0.25)',
                            letterSpacing: '0.05em',
                          }}
                        >
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                      {v.year} ·{' '}
                      <span style={{ color: catColor }}>{v.useCase}</span>
                    </div>
                  </div>
                  <ChevronRight size={18} color="rgba(255,255,255,0.2)" />
                </div>

                {/* Car illustration */}
                <div className="flex justify-center mb-3">
                  <CarSVG color={v.color} />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: 'Distance', value: `${v.totalDistance} km` },
                    { label: 'Top Speed', value: `${v.topSpeed} km/h` },
                    { label: 'Drives', value: v.id === '1' ? '18' : '32' },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-xl py-2 px-2 text-center"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      <div style={{ fontSize: '13px', color: 'white', fontWeight: 700 }}>{s.value}</div>
                      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* ELO */}
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>Elo Rating</span>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                      {v.elo > 1600 ? '🏆 Elite' : v.elo > 1300 ? '🥇 Pro' : '🥈 Amateur'}
                    </span>
                  </div>
                  <EloBar elo={v.elo} />
                </div>
              </div>
            </button>
          );
        })}

        {vehicles.length === 0 && (
          <div className="flex flex-col items-center justify-center h-60 gap-3 opacity-50">
            <div style={{ fontSize: '48px' }}>🚗</div>
            <div className="text-white font-semibold" style={{ fontSize: '16px' }}>No vehicles yet</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Add your first car above</div>
          </div>
        )}
      </div>

      {/* Add modal */}
      {showModal && (
        <AddVehicleModal onClose={() => setShowModal(false)} onAdd={addVehicle} />
      )}
    </div>
  );
}
