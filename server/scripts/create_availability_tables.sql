-- Create availability_submissions table
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
  UNIQUE KEY unique_submission (employee_id, week_start, submission_date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_availability_employee_week ON availability_submissions(employee_id, week_start);
CREATE INDEX IF NOT EXISTS idx_availability_week_locked ON availability_submissions(week_start, is_locked);
CREATE INDEX IF NOT EXISTS idx_availability_submission_date ON availability_submissions(submission_date);

-- Update employees table to include default availability if needed
ALTER TABLE employees 
MODIFY COLUMN availability JSON DEFAULT ('{
  "monday": {"available": false},
  "tuesday": {"available": false},
  "wednesday": {"available": false},
  "thursday": {"available": false},
  "friday": {"available": false},
  "saturday": {"available": false},
  "sunday": {"available": false}
}');

-- Insert sample availability data (optional)
INSERT INTO availability_submissions (employee_id, week_start, availability, is_locked) VALUES
(1, '2024-01-01', '{
  "monday": {"available": true, "preferredStart": "08:00", "preferredEnd": "17:00"},
  "tuesday": {"available": true, "preferredStart": "09:00", "preferredEnd": "18:00"},
  "wednesday": {"available": false},
  "thursday": {"available": true, "preferredStart": "08:00", "preferredEnd": "16:00"},
  "friday": {"available": true, "preferredStart": "07:00", "preferredEnd": "15:00"},
  "saturday": {"available": false},
  "sunday": {"available": false}
}', true),
(2, '2024-01-01', '{
  "monday": {"available": true, "preferredStart": "12:00", "preferredEnd": "20:00"},
  "tuesday": {"available": true, "preferredStart": "10:00", "preferredEnd": "18:00"},
  "wednesday": {"available": true, "preferredStart": "08:00", "preferredEnd": "16:00"},
  "thursday": {"available": false},
  "friday": {"available": true, "preferredStart": "09:00", "preferredEnd": "17:00"},
  "saturday": {"available": true, "preferredStart": "08:00", "preferredEnd": "16:00"},
  "sunday": {"available": false}
}', true);

-- Create view for availability status
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
