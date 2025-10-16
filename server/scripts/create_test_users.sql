-- Create test admin user with proper password (password: admin123)
INSERT INTO employees (name, email, password, role, department, maxHoursPerWeek, currentWeeklyHours)
SELECT 'Test Admin', 'admin@test.com', '$2b$10$7LPk1fn/u3FYXUzz8JhauOPy6fcUarrWetEix/tCj/yb5A.MKK/ui', 'admin', 'Management', 40, 0
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'admin@test.com');

-- Create test crew user with proper password (password: crew123)
INSERT INTO employees (name, email, password, role, department, maxHoursPerWeek, currentWeeklyHours)
SELECT 'Test Crew', 'crew@test.com', '$2b$10$5t2ErxyFYGgj8wHg9.dTS.HTVYh2T1RkblUhonfMVizaXMbKHbYyW', 'crew', 'Operations', 40, 0
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'crew@test.com');

-- Create another crew user (password: crew456)
INSERT INTO employees (name, email, password, role, department, maxHoursPerWeek, currentWeeklyHours)
SELECT 'Another Crew', 'crew2@test.com', '$2b$10$N0kPFC/Gxjg2IhGCp3cDoeQnfGwBl4C2Oxa0tI9DfdF4uQ7hdNI.W', 'crew', 'Operations', 40, 0
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'crew2@test.com');
