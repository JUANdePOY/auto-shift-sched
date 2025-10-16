-- Adjust endtime in shifts table to match frontend logic (starttime + 6 hours)
-- This ensures consistency between database and frontend calculations

-- First, backup current endTime values (optional, for safety)
-- ALTER TABLE shifts ADD COLUMN endTime_backup TIME;

-- UPDATE shifts SET endTime_backup = endTime;

-- Update endTime to be startTime + 6 hours
UPDATE shifts SET endTime = ADDTIME(startTime, '06:00:00');

-- Verify the changes
SELECT id, title, startTime, endTime FROM shifts LIMIT 10;

-- Optional: Drop backup column after verification
-- ALTER TABLE shifts DROP COLUMN endTime_backup;
