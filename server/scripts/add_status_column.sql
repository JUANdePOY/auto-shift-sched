-- Add status column to employees table
-- This script adds a status column to track employee account status

USE `auto-shift-sched`;

-- Add status column
ALTER TABLE employees 
ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active' AFTER isActive;

-- Update existing records to set status based on isActive
UPDATE employees 
SET status = CASE 
    WHEN isActive = 1 THEN 'active' 
    ELSE 'inactive' 
END;

-- Show the updated table structure
DESCRIBE employees;