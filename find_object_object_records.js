const db = require('./server/shared/config/database');

async function findObjectObjectRecords() {
  try {
    console.log('Finding records with "[object Object]"...');

    // Find all records with "[object Object]" availability
    const [corruptedRecords] = await db.query(
      'SELECT id, employee_id, week_start, availability FROM availability_submissions WHERE availability = ?',
      ['[object Object]']
    );

    console.log(`Found ${corruptedRecords.length} records with "[object Object]"`);

    if (corruptedRecords.length > 0) {
      corruptedRecords.forEach(record => {
        console.log(`ID: ${record.id}, Employee: ${record.employee_id}, Week: ${record.week_start}`);
      });
    }

    // Also check for other corrupted strings
    const corruptedStrings = ['undefined', 'null', ''];
    for (const corruptedString of corruptedStrings) {
      const [records] = await db.query(
        'SELECT COUNT(*) as count FROM availability_submissions WHERE availability = ?',
        [corruptedString]
      );
      if (records[0].count > 0) {
        console.log(`Found ${records[0].count} records with "${corruptedString}"`);
      }
    }

  } catch (error) {
    console.error('Error finding corrupted records:', error);
  } finally {
    process.exit();
  }
}

findObjectObjectRecords();
