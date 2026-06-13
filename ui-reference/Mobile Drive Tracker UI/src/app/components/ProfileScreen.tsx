import { Settings, Download, Info, ChevronRight } from 'lucide-react';
import { mockDrives } from './mockData';

export function ProfileScreen() {
  const totalDist = mockDrives.reduce((a, d) => a + d.distance, 0).toFixed(1);
  const maxSpeed = Math.max(...mockDrives.map((d) => d.topSpeed));
  const maxGForce = Math.max(...mockDrives.map((d) => d.telematics.maxGForce));

  const menuItems = [
    { icon: Settings, label: 'Settings', sub: 'App preferences & notifications' },
    { icon: Download, label: 'Export Data', sub: 'Download all drives as JSON' },
    { icon: Info, label: 'About Del Road', sub: 'Version 1.0.0 · FadelSearr' },
  ];

  return (
    <div className="size-full flex flex-col overflow-y-auto" style={{ background: '#09090F' }}>
      {/* Header */}
      <div className="px-5 pt-3 pb-2 shrink-0">
        <div className="text-white" style={{ fontSize: '20px', fontWeight: 700 }}>Profile</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Your driver dashboard</div>
      </div>

      {/* Avatar section */}
      <div className="flex flex-col items-center px-5 pb-5 shrink-0">
        <div className="relative mb-3">
          {/* Avatar ring */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center relative"
            style={{
              background: 'linear-gradient(135deg, #4B7EFF, #7B4FFF)',
              boxShadow: '0 0 0 3px rgba(75,126,255,0.2), 0 0 30px rgba(75,126,255,0.3)',
            }}
          >
            <span style={{ fontSize: '28px', fontWeight: 800, color: 'white', letterSpacing: '-1px' }}>
              FS
            </span>
          </div>
          {/* Badge */}
          <div
            className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #F97316, #EF4444)',
              fontSize: '9px',
              fontWeight: 700,
              color: 'white',
              letterSpacing: '0.05em',
              border: '1.5px solid #09090F',
            }}
          >
            PRO
          </div>
        </div>

        <div className="text-white font-bold" style={{ fontSize: '20px' }}>FadelSearr</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
          Pro Driver · Jakarta, ID
        </div>

        {/* Streak badge */}
        <div
          className="flex items-center gap-2 mt-3 px-4 py-2 rounded-full"
          style={{
            background: 'rgba(234,179,8,0.1)',
            border: '1px solid rgba(234,179,8,0.2)',
          }}
        >
          <span style={{ fontSize: '16px' }}>🔥</span>
          <span style={{ color: '#EAB308', fontSize: '13px', fontWeight: 600 }}>5-day streak</span>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}>· Best: 12</span>
        </div>
      </div>

      {/* Stats 2×2 */}
      <div className="grid grid-cols-2 gap-2 px-4 mb-4 shrink-0">
        {[
          { label: 'Total Distance', value: `${totalDist} km`, icon: '🗺️', color: '#4B7EFF' },
          { label: 'Max Speed', value: `${maxSpeed} km/h`, icon: '⚡', color: '#F97316' },
          { label: 'Total Drives', value: `${mockDrives.length}`, icon: '🚗', color: '#22C55E' },
          { label: 'Max G-Force', value: `${maxGForce.toFixed(2)} G`, icon: '💥', color: '#A855F7' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-4"
            style={{ background: '#111120', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="text-2xl mb-1">{s.icon}</div>
            <div style={{ fontSize: '20px', color: s.color, fontWeight: 700, lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Achievements bar */}
      <div
        className="mx-4 mb-4 p-4 rounded-2xl shrink-0"
        style={{ background: '#111120', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex justify-between items-center mb-3">
          <div style={{ color: 'white', fontSize: '14px', fontWeight: 600 }}>Achievements</div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>3 / 4 unlocked</div>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-full rounded-full"
            style={{ width: '75%', background: 'linear-gradient(90deg, #4B7EFF, #A855F7)' }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {['🏅', '⚡', '🗺️', '🪶'].map((icon, i) => (
            <div
              key={i}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: i < 3 ? 'rgba(75,126,255,0.15)' : 'rgba(255,255,255,0.05)',
                border: i < 3 ? '1px solid rgba(75,126,255,0.25)' : '1px solid rgba(255,255,255,0.07)',
                fontSize: '18px',
                opacity: i < 3 ? 1 : 0.35,
              }}
            >
              {icon}
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-4 mb-6 flex flex-col gap-2 shrink-0">
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginBottom: 2, letterSpacing: '0.08em' }}>
          QUICK ACTIONS
        </div>
        {menuItems.map((item) => (
          <button
            key={item.label}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-transform active:scale-[0.98]"
            style={{ background: '#111120', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(75,126,255,0.12)' }}
            >
              <item.icon size={17} color="#4B7EFF" />
            </div>
            <div className="flex-1 text-left">
              <div style={{ color: 'white', fontSize: '14px', fontWeight: 600 }}>{item.label}</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>{item.sub}</div>
            </div>
            <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
          </button>
        ))}
      </div>

      {/* App branding */}
      <div className="flex flex-col items-center pb-8 gap-1 shrink-0">
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.2)' }}>🚗 Del Road</div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.12)' }}>Built with ❤️ using React Native & Expo</div>
      </div>
    </div>
  );
}
