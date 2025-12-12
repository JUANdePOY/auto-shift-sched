const db = require('./server/shared/config/database');

async function inspectAvailabilityData() {
  try {
    console.log('Inspecting availability submissions...');

    // Get a few records to inspect the data type and content
    const [results] = await db.query(
      'SELECT id, employee_id, availability FROM availability_submissions LIMIT 5'
    );

    console.log('Raw database results:');
    results.forEach((row, index) => {
      console.log(`\nRecord ${index + 1}:`);
      console.log(`  ID: ${row.id}`);
      console.log(`  Employee ID: ${row.employee_id}`);
      console.log(`  Availability (typeof): ${typeof row.availability}`);
      console.log(`  Availability (value):`, row.availability);

      // Try to stringify if it's an object
      if (typeof row.availability === 'object') {
        try {
          const jsonStr = JSON.stringify(row.availability);
          console.log(`  JSON stringified: ${jsonStr.substring(0, 100)}...`);
        } catch (e) {
          console.log(`  Cannot stringify: ${e.message}`);
        }
      }

      // Try to parse if it's a string
      if (typeof row.availability === 'string') {
        try {
          const parsed = JSON.parse(row.availability);
          console.log(`  Parsed successfully:`, typeof parsed);
        } catch (e) {
          console.log(`  Parse error: ${e.message}`);
        }
      }
    });

    // Check table structure
    const [columns] = await db.query('DESCRIBE availability_submissions');
    console.log('\nTable structure:');
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type}`);
    });

  } catch (error) {
    console.error('Error inspecting data:', error);
  } finally {
    process.exit();
  }
}

inspectAvailabilityData();
