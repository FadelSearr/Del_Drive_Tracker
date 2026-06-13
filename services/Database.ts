import * as FileSystem from 'expo-file-system/legacy';

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

export interface SegmentData {
  id: string;
  name: string;
  startCoords: { latitude: number; longitude: number };
  endCoords: { latitude: number; longitude: number };
  bestTime: number; // in seconds
  topSpeed: number; // in km/h
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
      // Seed default vehicles
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

export const Database = {
  init: () => {
    // FileSystem doesn't need explicit initialization
  },

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
      await writeVehicles(vehicles);
    }

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
    } catch (e) {
      console.error('Failed to write segments file', e);
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
