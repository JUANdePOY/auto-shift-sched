-- Create schedule_generations table
CREATE TABLE IF NOT EXISTS schedule_generations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  week_start DATE NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  generated_by INT,
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (generated_by) REFERENCES users(id),
  INDEX idx_schedule_week (week_start),
  INDEX idx_schedule_status (status)
);

-- Create ai_suggestions table
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

-- Create schedule_assignments table to track assignments
CREATE TABLE IF NOT EXISTS schedule_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  schedule_generation_id INT NOT NULL,
  shift_id INT NOT NULL,
  employee_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (schedule_generation_id) REFERENCES schedule_generations(id) ON DELETE CASCADE,
  FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY unique_assignment (schedule_generation_id, shift_id, employee_id)
);

-- Insert sample schedule generation data
INSERT INTO schedule_generations (week_start, generated_by, status, notes) VALUES
('2024-01-01', 1, 'published', 'Initial automated schedule generation'),
('2024-01-08', 1, 'draft', 'Draft schedule for next week');

-- Insert sample AI suggestions
INSERT INTO ai_suggestions (schedule_generation_id, suggestion_type, confidence_score, suggested_changes) VALUES
(1, 'assignment', 0.85, '{"employeeId": "2", "shiftId": "1", "reason": "Better skill match"}'),
(1, 'optimization', 0.92, '{"type": "workload_balance", "changes": [{"employeeId": "3", "reduceHours": 2}]}');

-- Create view for schedule summary
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
