const db = require('./shared/config/database');

async function testAPIEndpoint() {
  try {
    // Test the API endpoint directly for the week that has data (Aug 31 - Sep 6)
    const startDate = '2025-08-31';
    const endDate = '2025-09-06';

    const [rows] = await db.query('SELECT COUNT(*) as count FROM final_schedule WHERE DATE(date_schedule) BETWEEN ? AND ?', [startDate, endDate]);
    console.log('Records in Aug 31 - Sep 6 week:', rows[0].count);

    // Test the API endpoint logic
    const query = `SELECT fs.shift_id, fs.employee_id, s.title as shift_title, LEFT(fs.date_schedule, 10) as date, s.startTime, s.endTime, e.name as employee_name, fs.required_stations FROM final_schedule fs JOIN shifts s ON fs.shift_id = s.id JOIN employees e ON fs.employee_id = e.id WHERE LEFT(fs.date_schedule, 10) BETWEEN ? AND ?`;
    const [results] = await db.query(query, [startDate, endDate]);
    console.log('API query results count:', results.length);

    if (results.length > 0) {
      console.log('Sample result:', JSON.stringify(results[0], null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testAPIEndpoint();
