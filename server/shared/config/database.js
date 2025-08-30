const mysql = require('mysql2');

// Database connection pool
const db = mysql.createPool({
  host: 'localhost', // or your XAMPP host, usually 'localhost'
  user: 'root',      // default XAMPP user
  password: '',      // default XAMPP password is empty
  database: 'auto-shift-sched',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db;
