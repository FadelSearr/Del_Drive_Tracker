export interface Drive {
  id: string;
  title: string;
  date: string;
  distance: number;
  durationSeconds: number;
  topSpeed: number;
  avgSpeed: number;
  temperature: number;
  favorite: boolean;
  vehicleId: string;
  telematics: {
    brakeCount: number;
    topBrakeForce: number;
    topAcceleration: number;
    topDeceleration: number;
    turnsLeft: number;
    turnsRight: number;
    laneChanges: number;
    stops: number;
    stopDurationSeconds: number;
    altitude: number;
    maxGForce: number;
  };
  speedDistribution: number[];
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  useCase: 'Daily' | 'Track' | 'Off-road';
  elo: number;
  totalDistance: number;
  topSpeed: number;
  active: boolean;
  color: string;
}

export interface Milestone {
  id: string;
  icon: string;
  title: string;
  desc: string;
  unlocked: boolean;
  criteria: string;
}

export const mockDrives: Drive[] = [
  {
    id: '1',
    title: 'Morning Sprint',
    date: '2026-06-12T07:30:00',
    distance: 24.7,
    durationSeconds: 2712,
    topSpeed: 142,
    avgSpeed: 73,
    temperature: 28,
    favorite: true,
    vehicleId: '1',
    telematics: {
      brakeCount: 12,
      topBrakeForce: 0.82,
      topAcceleration: 4.2,
      topDeceleration: 5.1,
      turnsLeft: 8,
      turnsRight: 11,
      laneChanges: 6,
      stops: 4,
      stopDurationSeconds: 200,
      altitude: 45,
      maxGForce: 0.9,
    },
    speedDistribution: [8, 18, 28, 32, 14],
  },
  {
    id: '2',
    title: 'Evening Commute',
    date: '2026-06-11T18:15:00',
    distance: 18.3,
    durationSeconds: 1980,
    topSpeed: 98,
    avgSpeed: 55,
    temperature: 31,
    favorite: false,
    vehicleId: '2',
    telematics: {
      brakeCount: 24,
      topBrakeForce: 0.61,
      topAcceleration: 2.1,
      topDeceleration: 3.3,
      turnsLeft: 15,
      turnsRight: 13,
      laneChanges: 9,
      stops: 11,
      stopDurationSeconds: 480,
      altitude: 22,
      maxGForce: 0.64,
    },
    speedDistribution: [22, 35, 27, 14, 2],
  },
  {
    id: '3',
    title: 'Weekend Highway',
    date: '2026-06-09T10:00:00',
    distance: 67.2,
    durationSeconds: 5400,
    topSpeed: 163,
    avgSpeed: 89,
    temperature: 26,
    favorite: true,
    vehicleId: '1',
    telematics: {
      brakeCount: 8,
      topBrakeForce: 0.71,
      topAcceleration: 5.8,
      topDeceleration: 4.9,
      turnsLeft: 4,
      turnsRight: 5,
      laneChanges: 22,
      stops: 2,
      stopDurationSeconds: 60,
      altitude: 67,
      maxGForce: 1.1,
    },
    speedDistribution: [3, 8, 15, 35, 39],
  },
  {
    id: '4',
    title: 'City Loop',
    date: '2026-06-08T15:00:00',
    distance: 12.1,
    durationSeconds: 1440,
    topSpeed: 74,
    avgSpeed: 41,
    temperature: 29,
    favorite: false,
    vehicleId: '2',
    telematics: {
      brakeCount: 31,
      topBrakeForce: 0.55,
      topAcceleration: 1.8,
      topDeceleration: 2.9,
      turnsLeft: 22,
      turnsRight: 18,
      laneChanges: 4,
      stops: 15,
      stopDurationSeconds: 360,
      altitude: 18,
      maxGForce: 0.58,
    },
    speedDistribution: [35, 40, 20, 5, 0],
  },
];

export const mockVehicles: Vehicle[] = [
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

export const mockMilestones: Milestone[] = [
  {
    id: '1',
    icon: '🏅',
    title: 'First Drive',
    desc: 'Completed your first drive',
    criteria: '1 drive completed',
    unlocked: true,
  },
  {
    id: '2',
    icon: '⚡',
    title: 'Speed Demon',
    desc: 'Reached a top speed over 120 km/h',
    criteria: '120+ km/h',
    unlocked: true,
  },
  {
    id: '3',
    icon: '🗺️',
    title: 'Long Hauler',
    desc: 'Drove over 50 km in a single session',
    criteria: '50+ km single drive',
    unlocked: true,
  },
  {
    id: '4',
    icon: '🪶',
    title: 'Smooth Operator',
    desc: 'Complete a drive with max G-Force under 0.5G',
    criteria: 'G-Force < 0.5',
    unlocked: false,
  },
];

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getVehicle(id: string): Vehicle | undefined {
  return mockVehicles.find((v) => v.id === id);
}

export const streakData = { current: 5, best: 12 };
