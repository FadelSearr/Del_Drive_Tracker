import { useState, useEffect } from 'react';

export interface Drive {
  id: string;
  title: string;
  date: string;
  distance: string;
  duration: string;
  avgSpeed: string;
  topSpeed: string;
  weather: string;
  car: string;
  route: string;
  coordinates: { latitude: number; longitude: number }[];
  // Telematics Report
  altitude: string;
  brakePressed: number;
  topAcceleration: string;
  topDeceleration: string;
  topBrakeForce: string;
  leftTurns: number;
  rightTurns: number;
  stopsCount: number;
  stopsDuration: string;
  laneChanges: number;
}

// Initial mock data with realistic driving stats
let drivesList: Drive[] = [
  {
    id: '1',
    title: 'Morning Drive',
    date: 'Jun 9, 10:52 AM',
    distance: '42.3 km',
    duration: '45:56',
    avgSpeed: '56 km/h',
    topSpeed: '128 km/h',
    weather: '28°C',
    car: '2018 PORSCHE 911 GT3',
    route: 'TANGERANG SELATAN',
    coordinates: [
      { latitude: -6.3, longitude: 106.65 },
      { latitude: -6.31, longitude: 106.66 }
    ],
    altitude: '112 m',
    brakePressed: 14,
    topAcceleration: '4.8 m/s²',
    topDeceleration: '6.2 m/s²',
    topBrakeForce: '0.63 G',
    leftTurns: 8,
    rightTurns: 11,
    stopsCount: 5,
    stopsDuration: '3m 12s',
    laneChanges: 18
  },
  {
    id: '2',
    title: 'Weekend Cruise',
    date: 'Jun 7, 08:30 AM',
    distance: '120.5 km',
    duration: '02:15:00',
    avgSpeed: '65 km/h',
    topSpeed: '142 km/h',
    weather: '26°C',
    car: '2018 PORSCHE 911 GT3',
    route: 'JAKARTA - BANDUNG',
    coordinates: [
      { latitude: -6.2, longitude: 106.8 },
      { latitude: -6.9, longitude: 107.6 }
    ],
    altitude: '768 m',
    brakePressed: 32,
    topAcceleration: '5.2 m/s²',
    topDeceleration: '7.1 m/s²',
    topBrakeForce: '0.72 G',
    leftTurns: 24,
    rightTurns: 28,
    stopsCount: 3,
    stopsDuration: '1m 45s',
    laneChanges: 42
  }
];

const listeners = new Set<() => void>();

export const DriveStore = {
  getDrives() {
    return drivesList;
  },
  getDrive(id: string) {
    return drivesList.find(d => d.id === id);
  },
  addDrive(drive: Omit<Drive, 'id'>) {
    const newDrive: Drive = {
      ...drive,
      id: String(drivesList.length + 1)
    };
    drivesList = [newDrive, ...drivesList];
    listeners.forEach(listener => listener());
    return newDrive;
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
};

export function useDrives() {
  const [drives, setDrives] = useState(DriveStore.getDrives());
  useEffect(() => {
    return DriveStore.subscribe(() => {
      setDrives(DriveStore.getDrives());
    });
  }, []);
  return drives;
}
