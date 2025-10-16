-- Add missing columns to employees table for authentication
ALTER TABLE employees
ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN role ENUM('admin', 'manager', 'crew') NOT NULL DEFAULT 'crew',
ADD COLUMN position VARCHAR(255) DEFAULT NULL,
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Create index on email for faster lookups (MySQL 5.7+ compatible)
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_role ON employees(role);

-- Update existing employees with default passwords (their names)
UPDATE employees SET password = name WHERE password = '';

-- Hash the passwords (this would need to be done in application code, but for now we'll set simple defaults)
-- Note: In production, passwords should be properly hashed using bcrypt
UPDATE employees SET password = CONCAT('$2b$10$', MD5(RAND())) WHERE password != '';

-- Insert a default admin user if none exists
INSERT INTO employees (name, email, password, role, department)
SELECT 'Admin User', 'admin@shiftapp.com', '$2b$10$dummy.hash.for.admin', 'admin', 'Management'
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE role = 'admin' LIMIT 1);
