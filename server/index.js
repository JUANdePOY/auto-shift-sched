const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const errorHandler = require('./shared/middleware/errorHandler');

// Import route handlers
const employeeRoutes = require('./features/employees/routes/employees');
const shiftRoutes = require('./features/schedule/routes/shifts');
const scheduleRoutes = require('./features/schedule/routes/schedule');
const assignmentRoutes = require('./features/schedule/routes/assignments');
const departmentRoutes = require('./features/employees/routes/departments');
const availabilityRoutes = require('./features/availability/routes/availability');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection for setup (without specifying database)
const setupDb = mysql.createConnection({
  host: 'localhost', // or your XAMPP host, usually 'localhost'
  user: 'root',      // default XAMPP user
  password: '',      // default XAMPP password is empty
});

// Setup database endpoint
app.get('/setup-database', (req, res) => {
  const createDatabaseQuery = 'CREATE DATABASE IF NOT EXISTS `auto-shift-sched`;';
  const createEmployeesTableQuery = `
    CREATE TABLE IF NOT EXISTS employees (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      department VARCHAR(255),
      station VARCHAR(255),
      availability JSON,
      maxHoursPerWeek INT,
      currentWeeklyHours INT
    );
  `;
  const createSchedulesTableQuery = `
    CREATE TABLE IF NOT EXISTS shifts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      startTime VARCHAR(8) NOT NULL,
      endTime VARCHAR(8) NOT NULL,
      date VARCHAR(10) NOT NULL,
      requiredStation JSON,
      requiredEmployees INT DEFAULT 1,
      assignedEmployees JSON,
      isCompleted BOOLEAN DEFAULT FALSE,
      priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
      department VARCHAR(100) DEFAULT 'general'
    );
  `;
const createDepartmentsTableQuery = `
    CREATE TABLE IF NOT EXISTS departments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL
    );
  `;
  const createStationsTableQuery = `
    CREATE TABLE IF NOT EXISTS stations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      departmentId INT,
      FOREIGN KEY (departmentId) REFERENCES departments(id)
    );
  `;
  const createTimeoffTableQuery = `
    CREATE TABLE IF NOT EXISTS timeoff (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT,
      start_date DATE,
      end_date DATE,
      reason TEXT,
      status VARCHAR(50),
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );
  `;

  setupDb.connect((err) => {
    if (err) {
      console.error('Error connecting to MySQL for setup:', err);
      return res.status(500).send('Error connecting to MySQL for setup: ' + err.message);
    }

    console.log('Successfully connected to MySQL for setup.');

    setupDb.query(createDatabaseQuery, (error, results) => {
      if (error) {
        setupDb.end();
        console.error('Error creating database:', error);
        return res.status(500).send('Error creating database: ' + error.message);
      }

      console.log('Database "auto-shift-sched" created or already exists.');

      setupDb.end(); // Close the setup connection

      // Now connect to the specific database to set up tables
      const setupDbPool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'auto-shift-sched',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      setupDbPool.getConnection((err, connection) => {
        if (err) {
          console.error('Error getting database connection after creation:', err);
          return res.status(500).send('Error getting database connection after creation: ' + err.message);
        }
        
        connection.query(createEmployeesTableQuery, (error, results) => {
          if (error) {
            connection.release();
            console.error('Error setting up employees table:', error);
            return res.status(500).send('Error setting up employees table: ' + error.message);
          }
          
          connection.query(createSchedulesTableQuery, (error, results) => {
            if (error) {
              connection.release();
              console.error('Error setting up shifts table:', error);
              return res.status(500).send('Error setting up shifts table: ' + error.message);
            }
            
            connection.query(createDepartmentsTableQuery, (error, results) => {
              if (error) {
                connection.release();
                console.error('Error setting up departments table:', error);
                return res.status(500).send('Error setting up departments table: ' + error.message);
              }
              
              connection.query(createStationsTableQuery, (error, results) => {
                if (error) {
                  connection.release();
                  console.error('Error setting up stations table:', error);
                  return res.status(500).send('Error setting up stations table: ' + error.message);
                }
                
                connection.query(createTimeoffTableQuery, (error, results) => {
                  connection.release();
                  if (error) {
                    console.error('Error setting up timeoff table:', error);
                    return res.status(500).send('Error setting up timeoff table: ' + error.message);
                  }
                  res.status(200).send('Database and tables created or already exist.');
                });
              });
            });
          });
        });
      });
    });
  });
});

// Basic route
app.get('/', (req, res) => {
  res.send('Hello from the backend server!');
});

// Use modular routes
app.use('/api/employees', employeeRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/shifts', assignmentRoutes); // Assignment routes are mounted under /api/shifts
app.use('/api/departments', departmentRoutes);
app.use('/api/availability', availabilityRoutes);

// Error handling middleware (should be last)
app.use(errorHandler);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
