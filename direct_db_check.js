const db = require('./server/shared/config/database');

async function directDBCheck() {
  try {
    const [results] = await db.query('SELECT id, employee_id, availability FROM availability_submissions LIMIT 3');

    results.forEach((row, index) => {
      console.log(`\nRecord ${index + 1} (ID: ${row.id}, Employee: ${row.employee_id}):`);
      console.log('Type:', typeof row.availability);
      console.log('Value:', row.availability);

      if (typeof row.availability === 'string') {
        try {
          const parsed = JSON.parse(row.availability);
          console.log('Parsed successfully - keys:', Object.keys(parsed));
        } catch (e) {
          console.log('Parse error:', e.message);
        }
      } else if (typeof row.availability === 'object') {
        console.log('Object keys:', Object.keys(row.availability));
      }
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

directDBCheck();
