const db = require('./shared/config/database');

async function testCorrectedQuery() {
  try {
    // The issue is that the API query uses LEFT(fs.date_schedule, 10) but date_schedule is a DATE type
    // Let's test the correct query
    const startDate = '2025-08-31';
    const endDate = '2025-09-06';

    // Correct query - date_schedule is already a DATE type, no need for LEFT()
    const query = `SELECT fs.shift_id, fs.employee_id, s.title as shift_title, fs.date_schedule as date, s.startTime, s.endTime, e.name as employee_name, fs.required_stations FROM final_schedule fs JOIN shifts s ON fs.shift_id = s.id JOIN employees e ON fs.employee_id = e.id WHERE fs.date_schedule BETWEEN ? AND ?`;
    const [results] = await db.query(query, [startDate, endDate]);
    console.log('Corrected API query results count:', results.length);

    if (results.length > 0) {
      console.log('Sample result:', JSON.stringify(results[0], null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testCorrectedQuery();
