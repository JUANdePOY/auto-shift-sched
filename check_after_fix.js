const db = require('./server/shared/config/database');

async function checkAfterFix() {
  try {
    const [results] = await db.query('SELECT employee_id, availability FROM availability_submissions LIMIT 3');

    results.forEach((row, index) => {
      console.log(`\nEmployee ${row.employee_id}:`);
      console.log('Raw data type:', typeof row.availability);
      console.log('Raw data preview:', String(row.availability).substring(0, 100));

      if (row.availability) {
        try {
          const parsed = JSON.parse(row.availability);
          console.log('Parsed successfully - keys:', Object.keys(parsed));
          console.log('Sample day data:', parsed.monday);
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

checkAfterFix();
