const db = require('./shared/config/database');

async function testAvailableDates() {
  try {
    // Let's check what dates are actually in the database
    const [dates] = await db.query('SELECT DISTINCT DATE(date_schedule) as date FROM final_schedule ORDER BY date_schedule DESC LIMIT 10');
    console.log('Available dates in final_schedule:');
    dates.forEach(row => console.log(row.date));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testAvailableDates();
