import * as FileSystem from 'expo-file-system/legacy';
import { DriveData } from './Database';

const STREAK_FILE = `${FileSystem.documentDirectory}gamification_streak.json`;
const MILESTONES_FILE = `${FileSystem.documentDirectory}gamification_milestones.json`;
const PERSONAL_BESTS_FILE = `${FileSystem.documentDirectory}gamification_personal_bests.json`;

export interface Milestone {
  id: string;
  title: string;
  description: string;
  achieved: boolean;
  dateAchieved?: string;
  icon: string;
}

export interface SpeedTrap {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface SpeedZone {
  id: string;
  name: string;
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
}

// Predefined Speed Traps
export const PREDEFINED_TRAPS: SpeedTrap[] = [
  { id: 'bsd_boulevard_trap', name: 'BSD Boulevard Trap', latitude: -6.3025, longitude: 106.6522 },
  { id: 'jorr_highway_trap', name: 'JORR Highway Trap', latitude: -6.2291, longitude: 106.8163 },
  { id: 'test_demo_trap', name: 'Del Road Demo Trap', latitude: -6.3000, longitude: 106.6500 }, // BSD area
];

// Predefined Speed Zones (Start -> End segments)
export const PREDEFINED_ZONES: SpeedZone[] = [
  { 
    id: 'bsd_boulevard_zone', 
    name: 'BSD Sprint Zone', 
    startLat: -6.3010, 
    startLon: 106.6495, 
    endLat: -6.3055, 
    endLon: 106.6535 
  },
  { 
    id: 'alam_sutera_zone', 
    name: 'Alam Sutera Runway', 
    startLat: -6.2205, 
    startLon: 106.6582, 
    endLat: -6.2265, 
    endLon: 106.6598 
  }
];

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in km
}

const readJson = async <T>(file: string, defaultValue: T): Promise<T> => {
  try {
    const info = await FileSystem.getInfoAsync(file);
    if (!info.exists) return defaultValue;
    const content = await FileSystem.readAsStringAsync(file);
    return JSON.parse(content);
  } catch (e) {
    return defaultValue;
  }
};

const writeJson = async <T>(file: string, data: T): Promise<void> => {
  try {
    await FileSystem.writeAsStringAsync(file, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to write JSON file', file, e);
  }
};

export const GamificationEngine = {
  // Initialize Default Milestones
  async initMilestones(): Promise<Milestone[]> {
    const defaultMilestones: Milestone[] = [
      { id: 'first_drive', title: 'First Drive', description: 'Complete your first drive.', achieved: false, icon: 'award' },
      { id: 'speed_demon', title: 'Speed Demon', description: 'Reach a top speed over 120 km/h.', achieved: false, icon: 'zap' },
      { id: 'long_hauler', title: 'Long Hauler', description: 'Drive over 50 km in a single session.', achieved: false, icon: 'map' },
      { id: 'smooth_operator', title: 'Smooth Operator', description: 'Complete a drive with max G-Force under 0.5 G.', achieved: false, icon: 'feather' },
    ];
    
    const stored = await readJson<Milestone[] | null>(MILESTONES_FILE, null);
    if (stored) return stored;
    
    await writeJson(MILESTONES_FILE, defaultMilestones);
    return defaultMilestones;
  },

  // Evaluate a drive to unlock new milestones
  async evaluateDrive(drive: DriveData): Promise<Milestone[]> {
    const milestones = await this.initMilestones();
    const newlyAchieved: Milestone[] = [];
    const today = new Date().toISOString();

    const topSpeedNum = parseFloat(drive.topSpeed.split(' ')[0]) || 0;
    const distanceNum = parseFloat(drive.distance.split(' ')[0]) || 0;
    const gForceNum = parseFloat(drive.topBrakeForce?.split(' ')[0] ?? '0');

    const updatedMilestones = milestones.map(m => {
      if (m.achieved) return m;

      let achievedNow = false;
      if (m.id === 'first_drive') achievedNow = true;
      if (m.id === 'speed_demon' && topSpeedNum > 120) achievedNow = true;
      if (m.id === 'long_hauler' && distanceNum > 50) achievedNow = true;
      if (m.id === 'smooth_operator' && gForceNum < 0.5 && gForceNum > 0) achievedNow = true;

      if (achievedNow) {
        const achievedMilestone = { ...m, achieved: true, dateAchieved: today };
        newlyAchieved.push(achievedMilestone);
        return achievedMilestone;
      }
      return m;
    });

    if (newlyAchieved.length > 0) {
      await writeJson(MILESTONES_FILE, updatedMilestones);
    }

    // Update Streaks
    await this.updateStreak();

    return newlyAchieved;
  },

  // Get current streak
  async getStreak(): Promise<{ current: number; best: number; lastDriveDate: string | null }> {
    return await readJson(STREAK_FILE, { current: 0, best: 0, lastDriveDate: null });
  },

  // Update driving streak based on days
  async updateStreak() {
    const streak = await this.getStreak();
    const today = new Date().toDateString();
    
    if (streak.lastDriveDate === today) return streak; // Already drove today

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (streak.lastDriveDate === yesterday.toDateString()) {
      // Continuous streak
      streak.current += 1;
    } else {
      // Streak broken
      streak.current = 1;
    }

    if (streak.current > streak.best) {
      streak.best = streak.current;
    }
    streak.lastDriveDate = today;

    await writeJson(STREAK_FILE, streak);
    return streak;
  },

  // Get all Personal Bests for traps and zones
  async getPersonalBests(): Promise<{ traps: Record<string, number>; zones: Record<string, number> }> {
    return await readJson(PERSONAL_BESTS_FILE, { traps: {}, zones: {} });
  },

  // Check if coordinates trigger any Speed Trap
  async checkSpeedTrap(latitude: number, longitude: number, currentSpeed: number): Promise<{ name: string; speed: number; isNewRecord: boolean; personalBest: number } | null> {
    const pb = await this.getPersonalBests();
    
    for (const trap of PREDEFINED_TRAPS) {
      const dist = getDistance(latitude, longitude, trap.latitude, trap.longitude);
      
      // Within 50 meters (0.05 km) of speed trap
      if (dist < 0.05) {
        const prevBest = pb.traps[trap.id] || 0;
        let isNewRecord = false;
        
        if (currentSpeed > prevBest) {
          pb.traps[trap.id] = currentSpeed;
          await writeJson(PERSONAL_BESTS_FILE, pb);
          isNewRecord = true;
        }

        return {
          name: trap.name,
          speed: currentSpeed,
          isNewRecord,
          personalBest: Math.max(currentSpeed, prevBest)
        };
      }
    }
    return null;
  },

  // Check if coordinates start or end any Speed Zone
  async checkSpeedZone(
    latitude: number, 
    longitude: number, 
    activeZone: { id: string; startTime: number } | null
  ): Promise<{ action: 'started' | 'completed'; zoneId: string; name: string; timeSecs?: number; isNewRecord?: boolean; personalBest?: number } | null> {
    const pb = await this.getPersonalBests();

    // 1. If not currently in a zone, check if we entered a start line
    if (!activeZone) {
      for (const zone of PREDEFINED_ZONES) {
        const dist = getDistance(latitude, longitude, zone.startLat, zone.startLon);
        if (dist < 0.05) { // within 50 meters of start line
          return {
            action: 'started',
            zoneId: zone.id,
            name: zone.name
          };
        }
      }
    } else {
      // 2. If already in a zone, check if we crossed the finish line of the ACTIVE zone
      const zone = PREDEFINED_ZONES.find(z => z.id === activeZone.id);
      if (zone) {
        const dist = getDistance(latitude, longitude, zone.endLat, zone.endLon);
        if (dist < 0.05) { // within 50 meters of finish line
          const elapsedSecs = Math.round((Date.now() - activeZone.startTime) / 1000);
          const prevBest = pb.zones[zone.id] || 999999; // Lower time is better
          let isNewRecord = false;

          if (elapsedSecs < prevBest) {
            pb.zones[zone.id] = elapsedSecs;
            await writeJson(PERSONAL_BESTS_FILE, pb);
            isNewRecord = true;
          }

          return {
            action: 'completed',
            zoneId: zone.id,
            name: zone.name,
            timeSecs: elapsedSecs,
            isNewRecord,
            personalBest: Math.min(elapsedSecs, prevBest) === 999999 ? elapsedSecs : Math.min(elapsedSecs, prevBest)
          };
        }
      }
    }
    return null;
  }
};
