-- Add date column to schedule_assignments table
ALTER TABLE schedule_assignments ADD COLUMN assignment_date DATE NOT NULL AFTER employee_id;

-- Update existing records to set assignment_date based on schedule_generation week_start
-- This is a placeholder - actual dates would need to be calculated based on business logic
-- For now, we'll set it to the week_start date
UPDATE schedule_assignments sa
JOIN schedule_generations sg ON sa.schedule_generation_id = sg.id
SET sa.assignment_date = sg.week_start;

-- Add index for the new column
ALTER TABLE schedule_assignments ADD INDEX idx_assignment_date (assignment_date);
