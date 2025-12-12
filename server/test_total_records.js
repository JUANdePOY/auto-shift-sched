const db = require('./shared/config/database');

async function testTotalRecords() {
  try {
    const [rows] = await db.query('SELECT COUNT(*) as count FROM final_schedule');
    console.log('Total final schedule records:', rows[0].count);

    if (rows[0].count > 0) {
      const [sample] = await db.query('SELECT DATE(date_schedule) as date, employee_name, shift_title FROM final_schedule ORDER BY date_schedule DESC LIMIT 3');
      console.log('Sample records:');
      console.log(JSON.stringify(sample, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testTotalRecords();
