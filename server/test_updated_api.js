const db = require('./shared/config/database');

async function testUpdatedAPI() {
  try {
    // Test the updated API query with LEFT JOIN
    const startDate = '2025-08-31';
    const endDate = '2025-09-06';

    const query = `SELECT fs.shift_id, fs.employee_id, COALESCE(s.title, fs.shift_title) as shift_title, fs.date_schedule as date, COALESCE(s.startTime, fs.time_in) as startTime, COALESCE(s.endTime, fs.time_out) as endTime, COALESCE(e.name, fs.employee_name) as employee_name, fs.required_stations FROM final_schedule fs LEFT JOIN shifts s ON fs.shift_id = s.id LEFT JOIN employees e ON fs.employee_id = e.id WHERE fs.date_schedule BETWEEN ? AND ?`;
    const [results] = await db.query(query, [startDate, endDate]);
    console.log('Updated API query results count:', results.length);

    if (results.length > 0) {
      console.log('Sample result:', JSON.stringify(results[0], null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testUpdatedAPI();
