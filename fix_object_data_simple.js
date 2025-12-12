const db = require('./server/shared/config/database');

async function fixObjectData() {
  try {
    console.log('Checking for "[object Object]" data...');

    // Find all records with "[object Object]" availability
    const [corruptedRecords] = await db.query(
      'SELECT id, employee_id, availability FROM availability_submissions WHERE availability = ?',
      ['[object Object]']
    );

    console.log(`Found ${corruptedRecords.length} corrupted records`);

    if (corruptedRecords.length === 0) {
      console.log('No corrupted data found.');
      return;
    }

    // Default availability JSON for corrupted records
    const defaultAvailability = JSON.stringify({
      monday: { available: true },
      tuesday: { available: true },
      wednesday: { available: true },
      thursday: { available: true },
      friday: { available: true },
      saturday: { available: true },
      sunday: { available: true }
    });

    // Update each corrupted record
    for (const record of corruptedRecords) {
      console.log(`Fixing record ID ${record.id} for employee ${record.employee_id}`);

      await db.query(
        'UPDATE availability_submissions SET availability = ? WHERE id = ?',
        [defaultAvailability, record.id]
      );
    }

    console.log(`Fixed ${corruptedRecords.length} records`);

  } catch (error) {
    console.error('Error fixing data:', error);
  }
}

fixObjectData();
