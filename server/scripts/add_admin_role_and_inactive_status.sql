-- Add admin role and inactive status to employees table
USE `auto-shift-sched`;

-- Add isActive column to employees table
ALTER TABLE employees 
ADD COLUMN isActive BOOLEAN DEFAULT TRUE AFTER currentWeeklyHours;

-- Update role enum to include admin
ALTER TABLE employees 
MODIFY COLUMN role ENUM('admin', 'manager', 'crew') NOT NULL DEFAULT 'crew';

-- Add index for isActive column for better performance
ALTER TABLE employees 
ADD INDEX idx_employees_active (isActive);

-- Update existing employees to be active by default
UPDATE employees SET isActive = TRUE WHERE isActive IS NULL;

SELECT 'Admin role and inactive status added successfully!' as status;