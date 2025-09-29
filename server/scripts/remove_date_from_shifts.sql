-- Remove date column from shifts table to make shifts permanent templates
-- This assumes all existing shifts have been processed and dates are now in assignments

-- First, backup the data if needed (optional)
-- CREATE TABLE shifts_backup AS SELECT * FROM shifts;

-- Drop the date column
ALTER TABLE shifts DROP COLUMN date;

-- Update any indexes or constraints if necessary
-- Note: If there was an index on date, it will be dropped automatically

-- Verify the change
DESCRIBE shifts;

-- Optional: Add a comment to the table
ALTER TABLE shifts COMMENT = 'Permanent shift templates without date - dates handled in assignments';
