-- Complete Database Setup for Auto Shift Scheduling System
-- This script creates the database, all tables, indexes, and sample data

-- Create database
CREATE DATABASE IF NOT EXISTS `auto-shift-sched`;
USE `auto-shift-sched`;

-- ===========================================
-- CORE TABLES
-- ===========================================

-- Employees table (with authentication and profile information)
CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'crew') NOT NULL DEFAULT 'crew',
  department VARCHAR(255),
  station JSON,
  position VARCHAR(255),
  availability JSON DEFAULT ('{
    "monday": {"available": false},
    "tuesday": {"available": false},
    "wednesday": {"available": false},
    "thursday": {"available": false},
    "friday": {"available": false},
    "saturday": {"available": false},
    "sunday": {"available": false}
  }'),
  maxHoursPerWeek INT DEFAULT 40,
  currentWeeklyHours INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_employees_email (email),
  INDEX idx_employees_role (role),
  INDEX idx_employees_department (department)
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_departments_name (name)
);

-- Stations table
CREATE TABLE IF NOT EXISTS stations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  departmentId INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (departmentId) REFERENCES departments(id) ON DELETE SET NULL,
  INDEX idx_stations_department (departmentId),
  UNIQUE KEY unique_station_dept (name, departmentId)
);

-- Shifts table (permanent shift templates)
CREATE TABLE IF NOT EXISTS shifts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  startTime TIME NOT NULL,
  endTime TIME NOT NULL,
  requiredStation JSON,
  requiredEmployees INT DEFAULT 1,
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  department VARCHAR(100) DEFAULT 'general',
  isActive BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_shifts_department (department),
  INDEX idx_shifts_priority (priority),
  INDEX idx_shifts_active (isActive)
);

-- Time off requests table
CREATE TABLE IF NOT EXISTS timeoff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by INT,
  approved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES employees(id) ON DELETE SET NULL,
  INDEX idx_timeoff_employee (employee_id),
  INDEX idx_timeoff_status (status),
  INDEX idx_timeoff_dates (start_date, end_date)
);

-- ===========================================
-- SCHEDULING TABLES
-- ===========================================

-- Schedule generations table
CREATE TABLE IF NOT EXISTS schedule_generations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  week_start DATE NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  generated_by INT,
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (generated_by) REFERENCES employees(id) ON DELETE SET NULL,
  INDEX idx_schedule_week (week_start),
  INDEX idx_schedule_status (status),
  UNIQUE KEY unique_week_generation (week_start, status)
);

-- AI suggestions table
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  schedule_generation_id INT NOT NULL,
  suggestion_type ENUM('assignment', 'swap', 'optimization') NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL,
  suggested_changes JSON NOT NULL,
  applied BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (schedule_generation_id) REFERENCES schedule_generations(id) ON DELETE CASCADE,
  INDEX idx_ai_schedule (schedule_generation_id),
  INDEX idx_ai_type (suggestion_type),
  INDEX idx_ai_applied (applied)
);

-- Schedule assignments table (links schedule generations to shifts and employees)
CREATE TABLE IF NOT EXISTS schedule_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  schedule_generation_id INT NOT NULL,
  shift_id INT NOT NULL,
  employee_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (schedule_generation_id) REFERENCES schedule_generations(id) ON DELETE CASCADE,
  FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY unique_assignment (schedule_generation_id, shift_id, employee_id),
  INDEX idx_assignments_schedule (schedule_generation_id),
  INDEX idx_assignments_employee (employee_id),
  INDEX idx_assignments_shift (shift_id)
);

-- Final schedule table (published schedules with additional details)
CREATE TABLE IF NOT EXISTS final_schedule (
  id INT PRIMARY KEY AUTO_INCREMENT,
  schedule_generation_id INT NOT NULL,
  shift_id INT NOT NULL,
  employee_id INT NOT NULL,
  time_in TIME,
  time_out TIME,
  employee_name VARCHAR(255),
  shift_title VARCHAR(255),
  department VARCHAR(100),
  date_schedule DATE NOT NULL,
  required_stations JSON,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,

  FOREIGN KEY (schedule_generation_id) REFERENCES schedule_generations(id) ON DELETE CASCADE,
  FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY unique_final_assignment (schedule_generation_id, shift_id, employee_id),
  INDEX idx_final_schedule_date (date_schedule),
  INDEX idx_final_schedule_employee (employee_id),
  INDEX idx_final_schedule_generation (schedule_generation_id)
);

-- ===========================================
-- AVAILABILITY TABLES
-- ===========================================

-- Availability submissions table
CREATE TABLE IF NOT EXISTS availability_submissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  week_start DATE NOT NULL,
  availability JSON NOT NULL,
  submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY unique_submission (employee_id, week_start, submission_date),
  INDEX idx_availability_employee_week (employee_id, week_start),
  INDEX idx_availability_week_locked (week_start, is_locked),
  INDEX idx_availability_submission_date (submission_date)
);

-- ===========================================
-- VIEWS
-- ===========================================

-- Schedule summary view
CREATE OR REPLACE VIEW schedule_summary AS
SELECT
  sg.id,
  sg.week_start,
  sg.generated_at,
  sg.status,
  COUNT(sa.id) as total_assignments,
  COUNT(DISTINCT sa.employee_id) as unique_employees,
  COUNT(DISTINCT sa.shift_id) as shifts_covered,
  (SELECT COUNT(*) FROM ai_suggestions WHERE schedule_generation_id = sg.id AND applied = true) as applied_suggestions
FROM schedule_generations sg
LEFT JOIN schedule_assignments sa ON sg.id = sa.schedule_generation_id
GROUP BY sg.id, sg.week_start, sg.generated_at, sg.status
ORDER BY sg.generated_at DESC;

-- Availability status view
CREATE OR REPLACE VIEW availability_status AS
SELECT
  week_start,
  COUNT(DISTINCT employee_id) as submissions,
  COUNT(CASE WHEN is_locked THEN 1 END) as locked_submissions,
  (SELECT COUNT(*) FROM employees) as total_employees,
  ROUND((COUNT(DISTINCT employee_id) / (SELECT COUNT(*) FROM employees)) * 100, 2) as submission_rate
FROM availability_submissions
GROUP BY week_start
ORDER BY week_start DESC;

-- ===========================================
-- SAMPLE DATA INSERTION
-- ===========================================

-- Insert sample departments
INSERT INTO departments (name) VALUES
('Kitchen'),
('Service'),
('Bar'),
('Management')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Insert sample stations
INSERT INTO stations (name, departmentId) VALUES
('Grill Station', (SELECT id FROM departments WHERE name = 'Kitchen')),
('Prep Station', (SELECT id FROM departments WHERE name = 'Kitchen')),
('Fry Station', (SELECT id FROM departments WHERE name = 'Kitchen')),
('Salad Station', (SELECT id FROM departments WHERE name = 'Kitchen')),
('Dish Station', (SELECT id FROM departments WHERE name = 'Kitchen')),
('Host Station', (SELECT id FROM departments WHERE name = 'Service')),
('Server Station', (SELECT id FROM departments WHERE name = 'Service')),
('Bus Station', (SELECT id FROM departments WHERE name = 'Service')),
('Takeout Station', (SELECT id FROM departments WHERE name = 'Service')),
('Main Bar', (SELECT id FROM departments WHERE name = 'Bar')),
('Service Bar', (SELECT id FROM departments WHERE name = 'Bar')),
('Wine Station', (SELECT id FROM departments WHERE name = 'Bar')),
('Cocktail Station', (SELECT id FROM departments WHERE name = 'Bar')),
('Office', (SELECT id FROM departments WHERE name = 'Management')),
('Floor Manager', (SELECT id FROM departments WHERE name = 'Management')),
('Shift Lead', (SELECT id FROM departments WHERE name = 'Management'))
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Insert sample shifts
INSERT INTO shifts (title, startTime, endTime, requiredStation, requiredEmployees, priority, department) VALUES
('Morning Grill', '06:00:00', '14:00:00', '["Grill Station"]', 2, 'high', 'Kitchen'),
('Lunch Prep', '10:00:00', '18:00:00', '["Prep Station"]', 1, 'medium', 'Kitchen'),
('Evening Service', '16:00:00', '22:00:00', '["Server Station"]', 3, 'high', 'Service'),
('Bar Shift', '17:00:00', '01:00:00', '["Main Bar"]', 2, 'medium', 'Bar'),
('Closing Clean', '22:00:00', '02:00:00', '["Dish Station"]', 1, 'low', 'Kitchen'),
('Host Shift', '11:00:00', '19:00:00', '["Host Station"]', 1, 'medium', 'Service')
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- Insert test users with hashed passwords
-- Passwords: admin123, manager123, crew123, crew456
INSERT INTO employees (name, email, password, role, department, maxHoursPerWeek, currentWeeklyHours) VALUES
('System Admin', 'admin@test.com', '$2b$10$7LPk1fn/u3FYXUzz8JhauOPy6fcUarrWetEix/tCj/yb5A.MKK/ui', 'admin', 'Management', 40, 0),
('Manager User', 'manager@test.com', '$2b$10$dummy.hash.for.manager', 'manager', 'Management', 40, 0),
('Crew Member 1', 'crew1@test.com', '$2b$10$5t2ErxyFYGgj8wHg9.dTS.HTVYh2T1RkblUhonfMVizaXMbKHbYyW', 'crew', 'Kitchen', 40, 0),
('Crew Member 2', 'crew2@test.com', '$2b$10$N0kPFC/Gxjg2IhGCp3cDoeQnfGwBl4C2Oxa0tI9DfdF4uQ7hdNI.W', 'crew', 'Service', 40, 0),
('Crew Member 3', 'crew3@test.com', '$2b$10$another.hash.for.crew3', 'crew', 'Bar', 40, 0)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Insert sample availability for current week
INSERT INTO availability_submissions (employee_id, week_start, availability, is_locked) VALUES
(3, DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), '{
  "monday": {"available": true, "preferredStart": "08:00", "preferredEnd": "17:00"},
  "tuesday": {"available": true, "preferredStart": "09:00", "preferredEnd": "18:00"},
  "wednesday": {"available": false},
  "thursday": {"available": true, "preferredStart": "08:00", "preferredEnd": "16:00"},
  "friday": {"available": true, "preferredStart": "07:00", "preferredEnd": "15:00"},
  "saturday": {"available": false},
  "sunday": {"available": false}
}', true),
(4, DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), '{
  "monday": {"available": true, "preferredStart": "12:00", "preferredEnd": "20:00"},
  "tuesday": {"available": true, "preferredStart": "10:00", "preferredEnd": "18:00"},
  "wednesday": {"available": true, "preferredStart": "08:00", "preferredEnd": "16:00"},
  "thursday": {"available": false},
  "friday": {"available": true, "preferredStart": "09:00", "preferredEnd": "17:00"},
  "saturday": {"available": true, "preferredStart": "08:00", "preferredEnd": "16:00"},
  "sunday": {"available": false}
}', true)
ON DUPLICATE KEY UPDATE availability = VALUES(availability);

-- Insert sample schedule generation
INSERT INTO schedule_generations (week_start, generated_by, status, notes) VALUES
(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), 1, 'draft', 'Sample draft schedule for testing')
ON DUPLICATE KEY UPDATE notes = VALUES(notes);

-- ===========================================
-- FINAL SETUP MESSAGES
-- ===========================================

SELECT 'Database setup completed successfully!' as status;
SELECT
  (SELECT COUNT(*) FROM employees) as total_employees,
  (SELECT COUNT(*) FROM departments) as total_departments,
  (SELECT COUNT(*) FROM stations) as total_stations,
  (SELECT COUNT(*) FROM shifts) as total_shifts,
  (SELECT COUNT(*) FROM schedule_generations) as total_schedule_generations;
