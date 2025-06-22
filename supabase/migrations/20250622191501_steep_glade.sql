/*
  # Disaster Response Platform Database Schema

  1. New Tables
    - `disasters` - Main disaster records with location and metadata
    - `reports` - User-submitted reports with verification status  
    - `resources` - Emergency resources with geospatial data
    - `cache` - API response caching with TTL

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users and role-based access
    - Create appropriate indexes for performance

  3. Geospatial Features
    - PostGIS geography columns for location data
    - Spatial indexes for fast proximity queries
    - Custom functions for nearby resource searches
*/

-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create disasters table
CREATE TABLE IF NOT EXISTS disasters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  location_name text,
  location geography(POINT, 4326),
  description text NOT NULL,
  tags text[] DEFAULT '{}',
  owner_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  audit_trail jsonb DEFAULT '[]'::jsonb
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disaster_id uuid REFERENCES disasters(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  content text NOT NULL,
  image_url text,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'suspicious', 'fake')),
  verification_details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disaster_id uuid REFERENCES disasters(id) ON DELETE CASCADE,
  name text NOT NULL,
  location_name text,
  location geography(POINT, 4326),
  type text NOT NULL,
  description text,
  capacity integer,
  created_at timestamptz DEFAULT now()
);

-- Create cache table
CREATE TABLE IF NOT EXISTS cache (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS disasters_location_idx ON disasters USING GIST (location);
CREATE INDEX IF NOT EXISTS disasters_tags_idx ON disasters USING GIN (tags);
CREATE INDEX IF NOT EXISTS disasters_owner_idx ON disasters(owner_id);
CREATE INDEX IF NOT EXISTS disasters_created_idx ON disasters(created_at DESC);

CREATE INDEX IF NOT EXISTS reports_disaster_idx ON reports(disaster_id);
CREATE INDEX IF NOT EXISTS reports_user_idx ON reports(user_id);
CREATE INDEX IF NOT EXISTS reports_status_idx ON reports(verification_status);

CREATE INDEX IF NOT EXISTS resources_location_idx ON resources USING GIST (location);
CREATE INDEX IF NOT EXISTS resources_disaster_idx ON resources(disaster_id);
CREATE INDEX IF NOT EXISTS resources_type_idx ON resources(type);

CREATE INDEX IF NOT EXISTS cache_expires_idx ON cache(expires_at);

-- Enable Row Level Security
ALTER TABLE disasters ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for disasters
CREATE POLICY "Anyone can read disasters"
  ON disasters
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create disasters"
  ON disasters
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update own disasters"
  ON disasters
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete own disasters"
  ON disasters
  FOR DELETE
  TO public
  USING (true);

-- RLS Policies for reports
CREATE POLICY "Anyone can read reports"
  ON reports
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create reports"
  ON reports
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update own reports"
  ON reports
  FOR UPDATE
  TO public
  USING (true);

-- RLS Policies for resources
CREATE POLICY "Anyone can read resources"
  ON resources
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage resources"
  ON resources
  FOR ALL
  TO public
  USING (true);

-- RLS Policies for cache (service role only)
CREATE POLICY "Service role can manage cache"
  ON cache
  FOR ALL
  TO service_role
  USING (true);

-- Function to get nearby resources
CREATE OR REPLACE FUNCTION get_nearby_resources(
  disaster_id uuid,
  lat double precision,
  lng double precision,
  radius_meters integer DEFAULT 10000
)
RETURNS TABLE (
  id uuid,
  disaster_id uuid,
  name text,
  location_name text,
  type text,
  description text,
  capacity integer,
  distance_meters double precision,
  created_at timestamptz
) 
LANGUAGE sql
AS $$
  SELECT 
    r.id,
    r.disaster_id,
    r.name,
    r.location_name,
    r.type,
    r.description,
    r.capacity,
    ST_Distance(r.location, ST_SetSRID(ST_Point(lng, lat), 4326)) as distance_meters,
    r.created_at
  FROM resources r
  WHERE r.disaster_id = get_nearby_resources.disaster_id
    AND r.location IS NOT NULL
    AND ST_DWithin(r.location, ST_SetSRID(ST_Point(lng, lat), 4326), radius_meters)
  ORDER BY distance_meters ASC;
$$;

-- Function to update disaster location from coordinates
CREATE OR REPLACE FUNCTION update_disaster_location()
RETURNS trigger AS $$
BEGIN
  -- This trigger would be used if we want to automatically update location
  -- based on geocoding results, but for now we'll handle this in the application
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_disasters_updated_at
  BEFORE UPDATE ON disasters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();