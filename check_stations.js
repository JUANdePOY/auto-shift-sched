const db = require('./server/shared/config/database');

async function checkStations() {
  try {
    const [rows] = await db.execute('SELECT id, name, station FROM employees WHERE station IS NOT NULL LIMIT 5');
    console.log('Sample employee stations:');
    rows.forEach(row => {
      console.log(`${row.id}: ${row.name} - ${row.station}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkStations();
