const db = require('./shared/config/database');

async function testCurrentWeekExact() {
  try {
    // Check current week (2025-11-03 to 2025-11-09)
    const startDate = '2025-11-03';
    const endDate = '2025-11-09';

    const [rows] = await db.query('SELECT COUNT(*) as count FROM final_schedule WHERE DATE(date_schedule) BETWEEN ? AND ?', [startDate, endDate]);
    console.log('Records in current week (2025-11-03 to 2025-11-09):', rows[0].count);

    if (rows[0].count > 0) {
      const [sample] = await db.query('SELECT DATE(date_schedule) as date, employee_name, shift_title FROM final_schedule WHERE DATE(date_schedule) BETWEEN ? AND ? ORDER BY date_schedule LIMIT 5', [startDate, endDate]);
      console.log('Sample records:');
      console.log(JSON.stringify(sample, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testCurrentWeekExact();
