const db = require('./server/shared/config/database');

async function fixAvailabilityData() {
  try {
    console.log('Checking for corrupted availability data...');

    // Find records where availability is stored as objects instead of JSON strings
    const [results] = await db.query('SELECT id, employee_id, availability FROM availability_submissions LIMIT 10');

    let fixedCount = 0;

    for (const row of results) {
      if (typeof row.availability === 'object' && row.availability !== null) {
        console.log(`Fixing record ID ${row.id} for employee ${row.employee_id}`);

        // Convert object to JSON string
        const jsonString = JSON.stringify(row.availability);

        await db.query(
          'UPDATE availability_submissions SET availability = ? WHERE id = ?',
          [jsonString, row.id]
        );

        fixedCount++;
        console.log(`Fixed: ${jsonString.substring(0, 50)}...`);
      }
    }

    console.log(`Fixed ${fixedCount} records`);

  } catch (error) {
    console.error('Error fixing data:', error);
  } finally {
    process.exit();
  }
}

fixAvailabilityData();
