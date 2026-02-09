-- telemetry: data sent from ESP32
CREATE TABLE IF NOT EXISTS telemetry (
  id SERIAL PRIMARY KEY,
  device_id TEXT NOT NULL,
  temperature REAL,
  humidity REAL,
  fan_rpm INTEGER,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- commands: commands issued by user/frontend
CREATE TABLE IF NOT EXISTS commands (
  id SERIAL PRIMARY KEY,
  device_id TEXT NOT NULL,
  command_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  delivered BOOLEAN DEFAULT false
);
