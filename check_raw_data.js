const db = require('./server/shared/config/database');

async function checkRawData() {
  try {
    const [results] = await db.query('SELECT employee_id, availability FROM availability_submissions LIMIT 3');

    results.forEach((row, index) => {
      console.log(`\nEmployee ${row.employee_id}:`);
      console.log('Raw data:', row.availability);
      console.log('Type:', typeof row.availability);

      if (row.availability) {
        try {
          const parsed = JSON.parse(row.availability);
          console.log('Parsed successfully:', JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log('Parse error:', e.message);
        }
      }
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

checkRawData();
