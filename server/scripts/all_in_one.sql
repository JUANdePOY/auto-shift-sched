-- ============================================================
-- Auto Shift Scheduling System - Full Database Setup
-- Combined from: server/scripts/*.sql
-- Run in MySQL console: source .../all_in_one.sql
-- ============================================================

-- ============================================================
-- SECTION 1: Create Database
-- ============================================================

CREATE DATABASE IF NOT EXISTS `auto-shift-sched`;
USE `auto-shift-sched`;


-- ============================================================
-- SECTION 2: Core Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS employees (
  id               INT              AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(255)     NOT NULL,
  email            VARCHAR(255)              UNIQUE,
  password         VARCHAR(255)     NOT NULL,
  role             ENUM('admin','manager','crew') NOT NULL DEFAULT 'crew',
  department       VARCHAR(255),
  station          JSON                         DEFAULT NULL,
  position         VARCHAR(255)                 DEFAULT NULL,
  availability     JSON                         DEFAULT ('{
    "monday":{"available":false},"tuesday":{"available":false},
    "wednesday":{"available":false},"thursday":{"available":false},
    "friday":{"available":false},"saturday":{"available":false},
    "sunday":{"available":false}
  }'),
  maxHoursPerWeek  INT            DEFAULT 40,
  currentWeeklyHours INT          DEFAULT 0,
  status           ENUM('active','inactive') DEFAULT 'active',
  isActive         BOOLEAN                   DEFAULT TRUE,
  created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_employees_email  (email),
  INDEX idx_employees_role   (role),
  INDEX idx_employees_dept   (department),
  INDEX idx_employees_active (isActive, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS departments (
  id         INT  AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uniq_departments_name (name),
  INDEX idx_departments_name     (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS stations (
  id         INT            AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255)   NOT NULL,
  departmentId INT,
  created_at TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,

  -- NOTE: unique_station_dept (VARCHAR(255) utf8mb4 = 1020 bytes) was dropped.
  -- It exceeded MySQL's 1000-byte per-key limit on InnoDB with utf8mb4.
  -- Enforce uniqueness at the application level before INSERT if needed.
  FOREIGN KEY (departmentId) REFERENCES departments(id) ON DELETE SET NULL,
  INDEX idx_stations_department (departmentId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS timeoff (
  id          INT      AUTO_INCREMENT PRIMARY KEY,
  employee_id INT      NOT NULL,
  start_date  DATE     NOT NULL,
  end_date    DATE     NOT NULL,
  reason      TEXT,
  status      ENUM('pending','approved','rejected') DEFAULT 'pending',
  approved_by INT,
  approved_at TIMESTAMP NULL,
  created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (employee_id) REFERENCES employees(id)            ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES employees(id)            ON DELETE SET NULL,
  INDEX idx_timeoff_employee        (employee_id),
  INDEX idx_timeoff_status          (status),
  INDEX idx_timeoff_dates          (start_date, end_date),
  INDEX idx_timeoff_approved_by    (approved_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS shifts (
  id                INT          AUTO_INCREMENT PRIMARY KEY,
  title             VARCHAR(255) NOT NULL,
  startTime         TIME         NOT NULL,
  endTime           TIME         NOT NULL,
  requiredStation   JSON         DEFAULT NULL,
  requiredEmployees INT          DEFAULT 1,
  priority          ENUM('low','medium','high') DEFAULT 'medium',
  department        VARCHAR(100) DEFAULT 'general',
  isActive          BOOLEAN      DEFAULT TRUE,
  created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_shifts_department (department),
  INDEX idx_shifts_priority   (priority),
  INDEX idx_shifts_active     (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- SECTION 3: Scheduling Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS schedule_generations (
  id          INT          AUTO_INCREMENT PRIMARY KEY,
  week_start  DATE         NOT NULL,
  generated_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  generated_by INT,
  status      ENUM('draft','published','archived') DEFAULT 'draft',
  notes       TEXT,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (generated_by)         REFERENCES employees(id) ON DELETE SET NULL,
  UNIQUE KEY uniq_week_status        (week_start, status),
  INDEX idx_schedule_week           (week_start),
  INDEX idx_schedule_status         (status),
  INDEX idx_schedule_generated_by   (generated_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ai_suggestions (
  id                   INT           AUTO_INCREMENT PRIMARY KEY,
  schedule_generation_id INT         NOT NULL,
  suggestion_type      ENUM('assignment','swap','optimization') NOT NULL,
  confidence_score     DECIMAL(3,2)  NOT NULL,
  suggested_changes    JSON         NOT NULL,
  applied              BOOLEAN       DEFAULT FALSE,
  applied_at           TIMESTAMP     NULL,
  created_at           TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (schedule_generation_id) REFERENCES schedule_generations(id) ON DELETE CASCADE,
  INDEX idx_ai_schedule            (schedule_generation_id),
  INDEX idx_ai_type               (suggestion_type),
  INDEX idx_ai_applied             (applied)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS schedule_assignments (
  id                 INT      AUTO_INCREMENT PRIMARY KEY,
  schedule_generation_id INT  NOT NULL,
  shift_id           INT      NOT NULL,
  employee_id        INT      NOT NULL,
  assignment_date    DATE     NOT NULL,
  assigned_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (schedule_generation_id) REFERENCES schedule_generations(id) ON DELETE CASCADE,
  FOREIGN KEY (shift_id)               REFERENCES shifts(id)               ON DELETE CASCADE,
  FOREIGN KEY (employee_id)            REFERENCES employees(id)             ON DELETE CASCADE,
  UNIQUE KEY uniq_assignment          (schedule_generation_id, shift_id, employee_id),
  INDEX idx_assignments_schedule     (schedule_generation_id),
  INDEX idx_assignments_employee     (employee_id),
  INDEX idx_assignments_shift        (shift_id),
  INDEX idx_assignment_date          (assignment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS final_schedule (
  id                     INT      AUTO_INCREMENT PRIMARY KEY,
  schedule_generation_id INT      NOT NULL,
  shift_id               INT      NOT NULL,
  employee_id            INT      NOT NULL,
  time_in                TIME,
  time_out               TIME,
  employee_name          VARCHAR(255),
  shift_title            VARCHAR(255),
  department             VARCHAR(100),
  date_schedule          DATE     NOT NULL,
  required_stations      JSON     DEFAULT NULL,
  assigned_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes                  TEXT,

  FOREIGN KEY (schedule_generation_id) REFERENCES schedule_generations(id) ON DELETE CASCADE,
  FOREIGN KEY (shift_id)               REFERENCES shifts(id)               ON DELETE CASCADE,
  FOREIGN KEY (employee_id)            REFERENCES employees(id)             ON DELETE CASCADE,
  UNIQUE KEY uniq_final_assignment    (schedule_generation_id, shift_id, employee_id),
  INDEX idx_final_schedule_date      (date_schedule),
  INDEX idx_final_schedule_employee  (employee_id),
  INDEX idx_final_schedule_generation(schedule_generation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- SECTION 4: Availability Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS availability_submissions (
  id              INT      AUTO_INCREMENT PRIMARY KEY,
  employee_id     INT      NOT NULL,
  week_start      DATE     NOT NULL,
  availability    JSON     NOT NULL,
  submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_locked       BOOLEAN  DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  -- NOTE: original unique_submission (employee_id, week_start, submission_date) was
  -- dropped; submitted_at has default a future time; covers would be cleaner.
  UNIQUE KEY uniq_submission (employee_id, week_start),
  INDEX idx_avail_employee_week (employee_id, week_start),
  INDEX idx_avail_week_locked   (week_start, is_locked),
  INDEX idx_avail_submission    (submission_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- SECTION 5: Views
-- ============================================================

CREATE OR REPLACE VIEW schedule_summary AS
SELECT
  sg.id,
  sg.week_start,
  sg.generated_at,
  sg.status,
  COUNT(sa.id)                          AS total_assignments,
  COUNT(DISTINCT sa.employee_id)        AS unique_employees,
  COUNT(DISTINCT sa.shift_id)           AS shifts_covered,
  (SELECT COUNT(*) FROM ai_suggestions
     WHERE schedule_generation_id = sg.id AND applied = TRUE) AS applied_suggestions
FROM schedule_generations  sg
LEFT JOIN schedule_assignments sa ON sg.id = sa.schedule_generation_id
GROUP BY sg.id, sg.week_start, sg.generated_at, sg.status
ORDER BY sg.generated_at DESC;

CREATE OR REPLACE VIEW availability_status AS
SELECT
  week_start,
  COUNT(DISTINCT employee_id)                                               AS submissions,
  COUNT(CASE WHEN is_locked THEN 1 END)                                      AS locked_submissions,
  (SELECT COUNT(*) FROM employees)                                          AS total_employees,
  ROUND((COUNT(DISTINCT employee_id) / (SELECT COUNT(*) FROM employees)) * 100, 2) AS submission_rate
FROM availability_submissions
GROUP BY week_start
ORDER BY week_start DESC;


-- ============================================================
-- SECTION 6: Set default employee status where table was created
--              before columns existed
-- ============================================================

-- Set any NULL isActive to TRUE (handles re-run of add_admin_role)
UPDATE employees SET isActive = TRUE WHERE isActive IS NULL;

-- Set any NULL status to 'active' (handles re-run of add_status_column)
UPDATE employees SET status = 'active' WHERE status IS NULL;


-- ============================================================
-- SECTION 7: Update shift endTime to startTime + 6 hours
-- ============================================================

UPDATE shifts SET endTime = ADDTIME(startTime, '06:00:00');


-- ============================================================
-- SECTION 8: Sample Departments
-- ============================================================

INSERT INTO departments (name) VALUES
  ('Kitchen'),
  ('Service'),
  ('Bar'),
  ('Management')
ON DUPLICATE KEY UPDATE name = VALUES(name);


-- ============================================================
-- SECTION 9: Sample Stations
-- ============================================================

INSERT INTO stations (name, departmentId) VALUES
  ('Grill Station',    (SELECT id FROM departments WHERE name = 'Kitchen')),
  ('Prep Station',     (SELECT id FROM departments WHERE name = 'Kitchen')),
  ('Fry Station',      (SELECT id FROM departments WHERE name = 'Kitchen')),
  ('Salad Station',    (SELECT id FROM departments WHERE name = 'Kitchen')),
  ('Dish Station',     (SELECT id FROM departments WHERE name = 'Kitchen')),
  ('Host Station',     (SELECT id FROM departments WHERE name = 'Service')),
  ('Server Station',   (SELECT id FROM departments WHERE name = 'Service')),
  ('Bus Station',      (SELECT id FROM departments WHERE name = 'Service')),
  ('Takeout Station',  (SELECT id FROM departments WHERE name = 'Service')),
  ('Main Bar',         (SELECT id FROM departments WHERE name = 'Bar')),
  ('Service Bar',      (SELECT id FROM departments WHERE name = 'Bar')),
  ('Wine Station',     (SELECT id FROM departments WHERE name = 'Bar')),
  ('Cocktail Station', (SELECT id FROM departments WHERE name = 'Bar')),
  ('Office',           (SELECT id FROM departments WHERE name = 'Management')),
  ('Floor Manager',    (SELECT id FROM departments WHERE name = 'Management')),
  ('Shift Lead',       (SELECT id FROM departments WHERE name = 'Management'))
ON DUPLICATE KEY UPDATE name = VALUES(name);


-- ============================================================
-- SECTION 10: Sample Shifts
-- ============================================================

INSERT INTO shifts (title, startTime, endTime, requiredStation, requiredEmployees, priority, department) VALUES
  ('Morning Grill',   '06:00:00', '14:00:00', '["Grill Station"]',   2, 'high',   'Kitchen'),
  ('Lunch Prep',      '10:00:00', '18:00:00', '["Prep Station"]',    1, 'medium', 'Kitchen'),
  ('Evening Service', '16:00:00', '22:00:00', '["Server Station"]',  3, 'high',   'Service'),
  ('Bar Shift',       '17:00:00', '01:00:00', '["Main Bar"]',        2, 'medium', 'Bar'),
  ('Closing Clean',   '22:00:00', '02:00:00', '["Dish Station"]',    1, 'low',    'Kitchen'),
  ('Host Shift',      '11:00:00', '19:00:00', '["Host Station"]',    1, 'medium', 'Service')
ON DUPLICATE KEY UPDATE title = VALUES(title);


-- ============================================================
-- SECTION 11: Sample Users
--   Passwords (bcrypt hashes):  admin123 | manager123 | crew123 | crew456
-- ============================================================

INSERT INTO employees (name, email, password, role, department,
                        maxHoursPerWeek, currentWeeklyHours, status, isActive)
VALUES
  ('System Admin',  'admin@test.com',   '$2b$10$7LPk1fn/u3FYXUzz8JhauOPy6fcUarrWetEix/tCj/yb5A.MKK/ui', 'admin',   'Management', 40, 0, 'active', TRUE),
  ('Manager User',  'manager@test.com', '$2b$10$dummy.hash.for.manager',                            'manager',  'Management', 40, 0, 'active', TRUE),
  ('Crew Member 1', 'crew1@test.com',   '$2b$10$5t2ErxyFYGgj8wHg9.dTS.HTVYh2T1RkblUhonfMVizaXMbKHbYyW', 'crew', 'Kitchen',   40, 0, 'active', TRUE),
  ('Crew Member 2', 'crew2@test.com',   '$2b$10$N0kPFC/Gxjg2IhGCp3cDoeQnfGwBl4C2Oxa0tI9DfdF4uQ7hdNI.W', 'crew', 'Service',   40, 0, 'active', TRUE),
  ('Crew Member 3', 'crew3@test.com',   '$2b$10$another.hash.for.crew3',                            'crew', 'Bar',       40, 0, 'active', TRUE)
ON DUPLICATE KEY UPDATE
  name  = VALUES(name),
  role  = VALUES(role),
  status = VALUES(status);


-- ============================================================
-- SECTION 12: Sample Schedule Generation
-- ============================================================

INSERT INTO schedule_generations (week_start, generated_by, status, notes)
  SELECT
    DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) AS week_start,
    (SELECT id FROM employees WHERE email = 'admin@test.com' LIMIT 1) AS generated_by,
    'draft',
    'Sample draft schedule for testing'
  FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM schedule_generations
  WHERE week_start = DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
    AND status = 'draft'
);


-- ============================================================
-- SECTION 13: Sample AI Suggestions
-- ============================================================

INSERT INTO ai_suggestions (schedule_generation_id, suggestion_type, confidence_score, suggested_changes)
  SELECT
    (SELECT id FROM schedule_generations LIMIT 1) AS schedule_generation_id,
    'assignment'  AS suggestion_type,
    0.85          AS confidence_score,
    '{"employeeId":"2","shiftId":"1","reason":"Better skill match"}' AS suggested_changes
  FROM DUAL
  UNION ALL
  SELECT
    (SELECT id FROM schedule_generations LIMIT 1),
    'optimization', 0.92,
    '{"type":"workload_balance","changes":[{"employeeId":"3","reduceHours":2}]}'
  FROM DUAL
ON DUPLICATE KEY UPDATE suggested_changes = VALUES(suggested_changes);


-- ============================================================
-- SECTION 14: Sample Availability Submissions
-- ============================================================

INSERT INTO availability_submissions (employee_id, week_start, availability, is_locked)
  SELECT
    e.id,
    DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) AS week_start,
    '{
      "monday":{"available":true,"preferredStart":"08:00","preferredEnd":"17:00"},
      "tuesday":{"available":true,"preferredStart":"09:00","preferredEnd":"18:00"},
      "wednesday":{"available":false},
      "thursday":{"available":true,"preferredStart":"08:00","preferredEnd":"16:00"},
      "friday":{"available":true,"preferredStart":"07:00","preferredEnd":"15:00"},
      "saturday":{"available":false},
      "sunday":{"available":false}
    }' AS availability,
    TRUE AS is_locked
  FROM employees e WHERE e.email = 'crew1@test.com'
  UNION ALL
  SELECT
    e.id,
    DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY),
    '{
      "monday":{"available":true,"preferredStart":"12:00","preferredEnd":"20:00"},
      "tuesday":{"available":true,"preferredStart":"10:00","preferredEnd":"18:00"},
      "wednesday":{"available":true,"preferredStart":"08:00","preferredEnd":"16:00"},
      "thursday":{"available":false},
      "friday":{"available":true,"preferredStart":"09:00","preferredEnd":"17:00"},
      "saturday":{"available":true,"preferredStart":"08:00","preferredEnd":"16:00"},
      "sunday":{"available":false}
    }',
    TRUE
  FROM employees e WHERE e.email = 'crew2@test.com'
ON DUPLICATE KEY UPDATE availability = VALUES(availability);


-- ============================================================
-- SECTION 15: Verification Summary
-- ============================================================

SELECT '==========================================================' AS ' ';
SELECT '  Auto Shift Sched DB Setup Complete!'                   AS status;
SELECT '==========================================================' AS ' ';

SELECT
  (SELECT COUNT(*) FROM employees)               AS total_employees,
  (SELECT COUNT(*) FROM departments)             AS total_departments,
  (SELECT COUNT(*) FROM stations)                AS total_stations,
  (SELECT COUNT(*) FROM shifts)                  AS total_shifts,
  (SELECT COUNT(*) FROM timeoff)                 AS total_timeoff_requests,
  (SELECT COUNT(*) FROM schedule_generations)    AS total_schedule_generations,
  (SELECT COUNT(*) FROM ai_suggestions)          AS total_ai_suggestions,
  (SELECT COUNT(*) FROM schedule_assignments)    AS total_schedule_assignments,
  (SELECT COUNT(*) FROM final_schedule)          AS total_final_schedule,
  (SELECT COUNT(*) FROM availability_submissions) AS total_availability_submissions;
