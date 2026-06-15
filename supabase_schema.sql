-- Supabase Schema for Del Road
-- Jalankan kode SQL ini di SQL Editor Supabase Anda

-- 1. Create table for Vehicles
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    local_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    total_distance FLOAT,
    top_speed FLOAT,
    elo_rating INTEGER,
    is_current INTEGER,
    drive_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, local_id)
);

-- 2. Create table for Drives
CREATE TABLE drives (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    local_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    date TEXT,
    distance TEXT,
    duration TEXT,
    avg_speed TEXT,
    top_speed TEXT,
    weather TEXT,
    car TEXT,
    route TEXT,
    altitude TEXT,
    brake_pressed INTEGER,
    top_acceleration TEXT,
    top_deceleration TEXT,
    top_brake_force TEXT,
    left_turns INTEGER,
    right_turns INTEGER,
    stops_count INTEGER,
    stops_duration TEXT,
    lane_changes INTEGER,
    is_favorite INTEGER,
    privacy TEXT,
    vehicle_id INTEGER,
    dashcam_uri TEXT,
    -- Simpan koordinat rute sebagai JSONB
    coordinates JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, local_id)
);

-- Row Level Security (RLS)
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own vehicles" 
ON vehicles FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own drives" 
ON drives FOR ALL USING (auth.uid() = user_id);

-- 3. Create table for Segments
CREATE TABLE segments (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    local_id TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT,
    speed_limit FLOAT,
    coordinates JSONB,
    start_coords JSONB,
    end_coords JSONB,
    best_time FLOAT,
    top_speed FLOAT,
    attempts JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, local_id)
);

ALTER TABLE segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own segments" 
ON segments FOR ALL USING (auth.uid() = user_id);
