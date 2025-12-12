const db = require('./shared/config/database');

async function testRecentDates() {
  try {
    const [rows] = await db.query('SELECT DISTINCT DATE(date_schedule) as date FROM final_schedule ORDER BY date DESC LIMIT 5');
    console.log('Most recent final schedule dates:');
    console.log(JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testRecentDates();
