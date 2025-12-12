const db = require('./shared/config/database');

async function checkCurrentWeek() {
  try {
    // Get current week start (Monday)
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    const startDate = monday.toISOString().split('T')[0];

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const endDate = sunday.toISOString().split('T')[0];

    console.log('Checking final schedules for week:', startDate, 'to', endDate);
    console.log('Today is:', today.toISOString().split('T')[0]);

    const [rows] = await db.query('SELECT COUNT(*) as count FROM final_schedule WHERE DATE(date_schedule) BETWEEN ? AND ?', [startDate, endDate]);
    console.log('Final schedule records for current week:', rows[0].count);

    if (rows[0].count > 0) {
      const [sample] = await db.query('SELECT DATE(date_schedule) as date, employee_name, shift_title FROM final_schedule WHERE DATE(date_schedule) BETWEEN ? AND ? ORDER BY date_schedule LIMIT 10', [startDate, endDate]);
      console.log('Sample records for current week:');
      console.log(JSON.stringify(sample, null, 2));
    } else {
      console.log('No final schedule records found for current week');
      // Check what dates do exist
      const [allDates] = await db.query('SELECT DISTINCT DATE(date_schedule) as date FROM final_schedule ORDER BY date LIMIT 10');
      console.log('Available dates in final_schedule:');
      console.log(JSON.stringify(allDates, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkCurrentWeek();
