import { useState, useEffect } from 'react';
import { Gauge, Map, List, TrendingUp, Car, User } from 'lucide-react';
import { Onboarding } from './components/Onboarding';
import { HUDScreen } from './components/HUDScreen';
import { MapScreen } from './components/MapScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { InsightsScreen } from './components/InsightsScreen';
import { GarageScreen } from './components/GarageScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { DriveDetail } from './components/DriveDetail';
import { CelebrationScreen } from './components/CelebrationScreen';

type MainTab = 'hud' | 'map' | 'history' | 'insights' | 'garage' | 'profile';
type Screen = MainTab | 'onboarding' | 'drive-detail' | 'celebration';

const TABS: { id: MainTab; label: string; Icon: React.FC<{ size: number; color: string }> }[] = [
  { id: 'hud', label: 'HUD', Icon: ({ size, color }) => <Gauge size={size} color={color} /> },
  { id: 'map', label: 'Map', Icon: ({ size, color }) => <Map size={size} color={color} /> },
  { id: 'history', label: 'Logs', Icon: ({ size, color }) => <List size={size} color={color} /> },
  { id: 'insights', label: 'Insights', Icon: ({ size, color }) => <TrendingUp size={size} color={color} /> },
  { id: 'garage', label: 'Garage', Icon: ({ size, color }) => <Car size={size} color={color} /> },
  { id: 'profile', label: 'Profile', Icon: ({ size, color }) => <User size={size} color={color} /> },
];

function StatusBar() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const h = time.getHours().toString().padStart(2, '0');
  const m = time.getMinutes().toString().padStart(2, '0');

  return (
    <div
      className="flex items-center justify-between shrink-0"
      style={{ padding: '10px 20px 4px', color: 'white' }}
    >
      <span style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.3px' }}>
        {h}:{m}
      </span>
      <div className="flex items-center gap-1.5">
        {/* Signal bars */}
        <div className="flex items-end gap-0.5">
          {[3, 5, 7, 9].map((h, i) => (
            <div
              key={i}
              className="rounded-sm"
              style={{
                width: 3,
                height: h,
                background: i < 3 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.25)',
              }}
            />
          ))}
        </div>
        {/* WiFi */}
        <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
          <path d="M7 8.5L5.5 7a2.12 2.12 0 013 0L7 8.5z" fill="rgba(255,255,255,0.85)" />
          <path d="M7 6L3.5 2.5a4.95 4.95 0 017 0L7 6z" fill="rgba(255,255,255,0.5)" />
          <path d="M7 3.5L1 -2.5a8 8 0 0112 0L7 3.5z" fill="rgba(255,255,255,0.2)" />
        </svg>
        {/* Battery */}
        <div className="flex items-center gap-0.5">
          <div
            className="rounded-sm relative overflow-hidden"
            style={{ width: 22, height: 11, border: '1.5px solid rgba(255,255,255,0.5)' }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-sm"
              style={{ width: '72%', background: 'rgba(255,255,255,0.9)', margin: 1 }}
            />
          </div>
          <div
            className="rounded-full"
            style={{ width: 2, height: 6, background: 'rgba(255,255,255,0.5)' }}
          />
        </div>
      </div>
    </div>
  );
}

function BottomTabBar({
  active,
  onPress,
}: {
  active: MainTab;
  onPress: (t: MainTab) => void;
}) {
  return (
    <div
      className="shrink-0 flex items-stretch"
      style={{
        background: '#0C0C18',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingBottom: 6,
        paddingTop: 6,
      }}
    >
      {TABS.map(({ id, label, Icon }) => {
        const isActive = active === id;
        const color = isActive ? '#4B7EFF' : 'rgba(255,255,255,0.3)';
        return (
          <button
            key={id}
            onClick={() => onPress(id)}
            className="flex-1 flex flex-col items-center gap-0.5 py-1 transition-all active:scale-90"
            style={{ color }}
          >
            <div className="relative">
              {isActive && (
                <div
                  className="absolute -inset-1.5 rounded-full"
                  style={{ background: 'rgba(75,126,255,0.12)' }}
                />
              )}
              <div className="relative">
                <Icon size={20} color={color} />
              </div>
            </div>
            <span
              style={{
                fontSize: '9px',
                fontWeight: isActive ? 700 : 400,
                letterSpacing: '0.03em',
                color,
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('onboarding');
  const [activeTab, setActiveTab] = useState<MainTab>('hud');
  const [selectedDriveId, setSelectedDriveId] = useState<string>('1');

  const showTabBar: boolean =
    screen !== 'onboarding' &&
    screen !== 'drive-detail' &&
    screen !== 'celebration';

  const handleTabPress = (tab: MainTab) => {
    setActiveTab(tab);
    setScreen(tab);
  };

  return (
    <div
      className="size-full flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at center, #0D0D20 0%, #040408 100%)' }}
    >
      {/* Phone frame */}
      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          width: 390,
          height: 844,
          borderRadius: 48,
          background: '#09090F',
          boxShadow:
            '0 0 0 1.5px #1E1E30, 0 0 0 6px #0E0E1A, 0 40px 100px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        {/* Side buttons (decorative) */}
        <div
          className="absolute"
          style={{
            left: -5,
            top: 130,
            width: 4,
            height: 34,
            background: '#1A1A2A',
            borderRadius: '2px 0 0 2px',
          }}
        />
        <div
          className="absolute"
          style={{
            left: -5,
            top: 180,
            width: 4,
            height: 60,
            background: '#1A1A2A',
            borderRadius: '2px 0 0 2px',
          }}
        />
        <div
          className="absolute"
          style={{
            left: -5,
            top: 256,
            width: 4,
            height: 60,
            background: '#1A1A2A',
            borderRadius: '2px 0 0 2px',
          }}
        />
        <div
          className="absolute"
          style={{
            right: -5,
            top: 180,
            width: 4,
            height: 90,
            background: '#1A1A2A',
            borderRadius: '0 2px 2px 0',
          }}
        />

        {/* Notch area */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
          <div
            style={{
              width: 120,
              height: 32,
              background: '#09090F',
              borderRadius: '0 0 20px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {/* Camera */}
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#1A1A2A',
                border: '1px solid #252535',
              }}
            />
            {/* Speaker pill */}
            <div
              style={{
                width: 50,
                height: 5,
                borderRadius: 3,
                background: '#1A1A2A',
              }}
            />
          </div>
        </div>

        {/* Status bar */}
        <StatusBar />

        {/* Screen content */}
        <div className="flex-1 overflow-hidden relative">
          {screen === 'onboarding' && (
            <Onboarding onComplete={() => { setScreen('hud'); setActiveTab('hud'); }} />
          )}
          {screen === 'hud' && <HUDScreen />}
          {screen === 'map' && (
            <MapScreen onDriveComplete={() => setScreen('celebration')} />
          )}
          {screen === 'history' && (
            <HistoryScreen
              onSelectDrive={(id) => {
                setSelectedDriveId(id);
                setScreen('drive-detail');
              }}
            />
          )}
          {screen === 'insights' && <InsightsScreen />}
          {screen === 'garage' && <GarageScreen />}
          {screen === 'profile' && <ProfileScreen />}
          {screen === 'drive-detail' && (
            <DriveDetail
              driveId={selectedDriveId}
              onBack={() => setScreen(activeTab === 'history' ? 'history' : 'history')}
            />
          )}
          {screen === 'celebration' && (
            <CelebrationScreen
              onViewDrive={() => {
                setSelectedDriveId('1');
                setScreen('drive-detail');
              }}
              onBackToMap={() => {
                setActiveTab('map');
                setScreen('map');
              }}
            />
          )}
        </div>

        {/* Tab bar */}
        {showTabBar && (
          <BottomTabBar active={activeTab} onPress={handleTabPress} />
        )}

        {/* Home indicator */}
        <div
          className="flex justify-center pb-2 shrink-0"
          style={{ background: screen === 'onboarding' ? 'transparent' : '#0C0C18' }}
        >
          <div
            style={{
              width: 120,
              height: 4,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.15)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
