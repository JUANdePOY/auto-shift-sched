const db = require('./shared/config/database');

async function testTableStructure() {
  try {
    // Check the structure of final_schedule table
    const [structure] = await db.query('DESCRIBE final_schedule');
    console.log('final_schedule table structure:');
    structure.forEach(col => console.log(`${col.Field}: ${col.Type}`));

    // Check sample data
    const [sample] = await db.query('SELECT * FROM final_schedule LIMIT 1');
    console.log('\nSample final_schedule record:');
    console.log(JSON.stringify(sample[0], null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testTableStructure();
