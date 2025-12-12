const db = require('./shared/config/database');

async function testCurrentWeekCalc() {
  try {
    // Check what week the user is actually viewing - let's see what the current week calculation gives us
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Sunday
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);

    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, '0');
    const day = String(monday.getDate()).padStart(2, '0');
    const currentWeekStart = `${year}-${month}-${day}`;

    console.log('Current week start date:', currentWeekStart);

    // Check if there's data for this week
    const endDateObj = new Date(monday);
    endDateObj.setDate(monday.getDate() + 6);
    const endDate = endDateObj.toISOString().split('')[0];

    console.log('Current week end date:', endDate);

    const [rows] = await db.query('SELECT COUNT(*) as count FROM final_schedule WHERE DATE(date_schedule) BETWEEN ? AND ?', [currentWeekStart, endDate]);
    console.log('Records in current week:', rows[0].count);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testCurrentWeekCalc();
