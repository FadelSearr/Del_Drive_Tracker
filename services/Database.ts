import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './Supabase';

export interface DriveData {
  id?: number;
  title: string;
  date: string;
  distance: string;
  duration: string;
  avgSpeed: string;
  topSpeed: string;
  weather: string;
  car: string;
  route: string;
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
  coordinates: { latitude: number; longitude: number; speed?: number }[];
  isFavorite?: number; // 0 or 1
  photos?: string[];
  driveStyle?: string;
  privacy?: string;
  vehicleId?: number;
  dashcamUri?: string;
}

export interface VehicleData {
  id: number;
  name: string;
  category: string;
  totalDistance: number;
  topSpeed: number;
  eloRating: number;
  isCurrent?: number; // 0 or 1
  driveCount?: number;
}

export interface SegmentAttempt {
  id: string;
  date: string;
  time: number; // in seconds
  topSpeed: number;
  avgSpeed: number;
  driveId?: number;
}

export interface VideoData {
  id: string;
  trip_id: string;
  file_path: string;
  cloud_url?: string; // Supabase Storage URL
  duration: number; // Duration in seconds
  file_size: number; // File size in bytes
  recording_started_at: string; // ISO timestamp
  recording_ended_at?: string; // ISO timestamp
  camera_type: 'back' | 'front';
  created_at?: string;
  updated_at?: string;
}

export interface SegmentData {
  id: string;
  title: string;
  type: string;
  speedLimit?: number;
  coordinates?: { latitude: number; longitude: number }[];
  startCoords?: { latitude: number; longitude: number };
  endCoords?: { latitude: number; longitude: number };
  bestTime?: number; // in seconds
  topSpeed?: number; // in km/h
  attempts?: SegmentAttempt[];
}

const DRIVES_FILE = `${FileSystem.documentDirectory}delroad_drives.json`;
const VEHICLES_FILE = `${FileSystem.documentDirectory}delroad_vehicles.json`;
const SEGMENTS_FILE = `${FileSystem.documentDirectory}delroad_segments.json`;

const readDrives = async (): Promise<DriveData[]> => {
  try {
    const info = await FileSystem.getInfoAsync(DRIVES_FILE);
    if (!info.exists) return [];
    const content = await FileSystem.readAsStringAsync(DRIVES_FILE);
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to read drives file', e);
    return [];
  }
};

const writeDrives = async (drives: DriveData[]) => {
  try {
    await FileSystem.writeAsStringAsync(DRIVES_FILE, JSON.stringify(drives));
  } catch (e) {
    console.error('Failed to write drives file', e);
  }
};

const readVehicles = async (): Promise<VehicleData[]> => {
  try {
    const info = await FileSystem.getInfoAsync(VEHICLES_FILE);
    if (!info.exists) {
      const defaults: VehicleData[] = [];
      await writeVehicles(defaults);
      return defaults;
    }
    const content = await FileSystem.readAsStringAsync(VEHICLES_FILE);
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to read vehicles file', e);
    return [];
  }
};

const writeVehicles = async (vehicles: VehicleData[]) => {
  try {
    await FileSystem.writeAsStringAsync(VEHICLES_FILE, JSON.stringify(vehicles));
  } catch (e) {
    console.error('Failed to write vehicles file', e);
  }
};

// Background Cloud Sync Function
const syncToCloud = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return; // User not logged in, skip sync

    const userId = session.user.id;
    const drives = await readDrives();
    const vehicles = await readVehicles();
    
    let segments: any[] = [];
    try {
      const segContent = await FileSystem.readAsStringAsync(SEGMENTS_FILE);
      segments = JSON.parse(segContent);
    } catch (e) {}

    // Sync Vehicles
    for (const v of vehicles) {
      await supabase.from('vehicles').upsert({
        user_id: userId,
        local_id: v.id,
        name: v.name,
        category: v.category,
        total_distance: v.totalDistance,
        top_speed: v.topSpeed,
        elo_rating: v.eloRating,
        is_current: v.isCurrent,
        drive_count: v.driveCount
      }, { onConflict: 'user_id,local_id' });
    }

    // Sync Drives
    for (const d of drives) {
      await supabase.from('drives').upsert({
        user_id: userId,
        local_id: d.id,
        title: d.title,
        date: d.date,
        distance: d.distance,
        duration: d.duration,
        avg_speed: d.avgSpeed,
        top_speed: d.topSpeed,
        weather: d.weather,
        car: d.car,
        route: d.route,
        altitude: d.altitude,
        brake_pressed: d.brakePressed,
        top_acceleration: d.topAcceleration,
        top_deceleration: d.topDeceleration,
        top_brake_force: d.topBrakeForce,
        left_turns: d.leftTurns,
        right_turns: d.rightTurns,
        stops_count: d.stopsCount,
        stops_duration: d.stopsDuration,
        lane_changes: d.laneChanges,
        is_favorite: d.isFavorite,
        privacy: d.privacy,
        vehicle_id: d.vehicleId,
        coordinates: d.coordinates,
        dashcam_uri: d.dashcamUri
      }, { onConflict: 'user_id,local_id' });
    }

    // Sync Segments
    for (const s of segments) {
      await supabase.from('segments').upsert({
        user_id: userId,
        local_id: s.id,
        title: s.title,
        type: s.type,
        speed_limit: s.speedLimit,
        coordinates: s.coordinates,
        start_coords: s.startCoords,
        end_coords: s.endCoords,
        best_time: s.bestTime,
        top_speed: s.topSpeed,
        attempts: s.attempts
      }, { onConflict: 'user_id,local_id' });
    }
    console.log('Cloud Sync Success');
  } catch (error) {
    console.error('Cloud Sync Failed', error);
  }
};

export const Database = {
  init: () => {},
  
  syncNow: syncToCloud, // Expose for manual sync

  addDrive: async (driveData: DriveData) => {
    const drives = await readDrives();
    const newId = drives.length > 0 ? (Math.max(...drives.map(d => d.id || 0)) + 1) : 1;
    const newDrive = { ...driveData, id: newId, isFavorite: 0 };
    drives.push(newDrive);
    await writeDrives(drives);

    // Update active vehicle stats
    const vehicles = await readVehicles();
    const active = vehicles.find(v => v.isCurrent === 1);
    if (active) {
      const driveDist = parseFloat(driveData.distance) || 0;
      const driveSpeed = parseInt(driveData.topSpeed) || 0;
      
      active.totalDistance += driveDist;
      if (driveSpeed > active.topSpeed) {
        active.topSpeed = driveSpeed;
      }
      active.driveCount = (active.driveCount || 0) + 1;
      await writeVehicles(vehicles);
    }
    
    // Trigger sync in background
    syncToCloud();

    return newDrive;
  },

  getAllDrives: async (): Promise<DriveData[]> => {
    return await readDrives();
  },

  getDriveById: async (id: number): Promise<DriveData | null> => {
    const drives = await readDrives();
    return drives.find(d => d.id === id) || null;
  },

  toggleFavorite: async (id: number): Promise<boolean> => {
    const drives = await readDrives();
    let newState = false;
    const updated = drives.map(d => {
      if (d.id === id) {
        newState = !d.isFavorite;
        return { ...d, isFavorite: newState ? 1 : 0 };
      }
      return d;
    });
    await writeDrives(updated);
    return newState;
  },

  deleteDrive: async (id: number): Promise<void> => {
    const drives = await readDrives();
    const updated = drives.filter(d => d.id !== id);
    await writeDrives(updated);
  },

  updateDriveDetails: async (id: number, details: Partial<DriveData>): Promise<void> => {
    const drives = await readDrives();
    const updated = drives.map(d => {
      if (d.id === id) {
        // If the car changes based on vehicleId we could also update `car` string, but let's just merge what is passed
        return { ...d, ...details };
      }
      return d;
    });
    await writeDrives(updated);
  },

  // Vehicle Management
  getAllVehicles: async (): Promise<VehicleData[]> => {
    return await readVehicles();
  },

  addVehicle: async (name: string, category: string): Promise<VehicleData> => {
    const vehicles = await readVehicles();
    const newId = vehicles.length > 0 ? (Math.max(...vehicles.map(v => v.id)) + 1) : 1;
    const newVehicle: VehicleData = {
      id: newId,
      name,
      category,
      totalDistance: 0,
      topSpeed: 0,
      eloRating: 1000,
      isCurrent: vehicles.length === 0 ? 1 : 0
    };
    vehicles.push(newVehicle);
    await writeVehicles(vehicles);
    return newVehicle;
  },

  setCurrentVehicle: async (id: number): Promise<void> => {
    const vehicles = await readVehicles();
    const updated = vehicles.map(v => ({
      ...v,
      isCurrent: v.id === id ? 1 : 0
    }));
    await writeVehicles(updated);
  },

  getCurrentVehicle: async (): Promise<VehicleData | null> => {
    const vehicles = await readVehicles();
    return vehicles.find(v => v.isCurrent === 1) || null;
  },

  deleteVehicle: async (id: number): Promise<void> => {
    const vehicles = await readVehicles();
    const updated = vehicles.filter(v => v.id !== id);
    // If we deleted the current vehicle, make the first one current if exists
    if (vehicles.find(v => v.id === id)?.isCurrent === 1 && updated.length > 0) {
      updated[0].isCurrent = 1;
    }
    await writeVehicles(updated);
  },
  
  // --- Segments ---
  getAllSegments: async (): Promise<SegmentData[]> => {
    try {
      const info = await FileSystem.getInfoAsync(SEGMENTS_FILE);
      if (!info.exists) return [];
      const content = await FileSystem.readAsStringAsync(SEGMENTS_FILE);
      return JSON.parse(content);
    } catch (e) {
      console.error('Failed to read segments file', e);
      return [];
    }
  },

  addSegment: async (title: string, type: string, coordinates: {latitude: number, longitude: number}[], speedLimit?: number) => {
    const newSegment: SegmentData = {
      id: Date.now().toString(),
      title,
      type,
      coordinates,
      speedLimit,
      bestTime: 0,
      topSpeed: 0
    };
    await Database.saveSegment(newSegment);
    return newSegment;
  },

  saveSegment: async (segment: SegmentData) => {
    const segments = await Database.getAllSegments();
    const existingIndex = segments.findIndex(s => s.id === segment.id);
    if (existingIndex >= 0) {
      segments[existingIndex] = segment;
    } else {
      segments.push(segment);
    }
    try {
      await FileSystem.writeAsStringAsync(SEGMENTS_FILE, JSON.stringify(segments));
      syncToCloud(); // Trigger sync
    } catch (e) {
      console.error('Failed to write segments file', e);
      throw e;
    }
  },

  deleteSegment: async (id: string) => {
    const segments = await Database.getAllSegments();
    const updated = segments.filter(s => s.id !== id);
    try {
      await FileSystem.writeAsStringAsync(SEGMENTS_FILE, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to delete segment', e);
    }
  }
};
