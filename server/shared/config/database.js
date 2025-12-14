const mysql = require('mysql2');

// Database connection pool
const db = mysql.createPool({
  host: 'localhost', // or your XAMPP host, usually 'localhost'
  user: 'root',      // default XAMPP user
  password: '',      // default XAMPP password is empty
  database: 'auto-shift-sched',
  // Return date/time fields as strings to avoid JS Date timezone shifts
  dateStrings: true,
  // Treat times as UTC when converting between JS and MySQL (helps consistent handling)
  timezone: 'Z',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Use promise-based API
const promiseDb = db.promise();

module.exports = promiseDb;
