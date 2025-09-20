-- Create final_schedule table to store finalized schedules
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
  UNIQUE KEY unique_final_assignment (schedule_generation_id, shift_id, employee_id)
);
-- Create final_schedule table to store finalized schedules
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
  UNIQUE KEY unique_final_assignment (schedule_generation_id, shift_id, employee_id)
);
