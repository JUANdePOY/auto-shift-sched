const mysql = require('mysql2/promise');

async function checkValidAvailability() {
  const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'shift_app'
  });

  try {
    const [results] = await db.query('SELECT employee_id, availability FROM availability_submissions LIMIT 10');

    console.log('Sample availability data:');
    results.forEach((row, index) => {
      console.log(`Employee ${row.employee_id}:`);
      console.log(`Raw: ${row.availability}`);

      try {
        const parsed = JSON.parse(row.availability);
        console.log(`Parsed: ${JSON.stringify(parsed, null, 2)}`);
        console.log('Valid JSON: YES');
      } catch (e) {
        console.log(`Parse error: ${e.message}`);
        console.log('Valid JSON: NO');
      }
      console.log('---');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.end();
  }
}

checkValidAvailability();
