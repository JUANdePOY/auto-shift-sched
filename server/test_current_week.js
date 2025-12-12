const db = require('./shared/config/database');

async function testCurrentWeek() {
  try {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    const startDate = monday.toISOString().split('T')[0];
    console.log('Current week start:', startDate);

    const [rows] = await db.query('SELECT COUNT(*) as count FROM final_schedule WHERE DATE(date_schedule) >= ?', [startDate]);
    console.log('Final schedule records from current week start:', rows[0].count);

    if (rows[0].count > 0) {
      const [sample] = await db.query('SELECT DATE(date_schedule) as date, employee_name, shift_title FROM final_schedule WHERE DATE(date_schedule) >= ? ORDER BY date_schedule LIMIT 5', [startDate]);
      console.log('Sample records:');
      console.log(JSON.stringify(sample, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testCurrentWeek();
