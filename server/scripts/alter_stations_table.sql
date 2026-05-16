-- Add description and updated_at columns to stations table
ALTER TABLE stations
  ADD COLUMN IF NOT EXISTS description TEXT NULL AFTER name,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;
