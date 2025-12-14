const db = require('./shared/config/database');

async function checkFinalSchedule() {
  try {
    // Use DATE_FORMAT to get a stable YYYY-MM-DD string for logging (avoids timezone-shifted Date objects)
    const [rows] = await db.query("SELECT *, DATE_FORMAT(date_schedule, '%Y-%m-%d') as date_only FROM final_schedule WHERE DATE(date_schedule) BETWEEN ? AND ?", ['2025-11-10', '2025-11-16']);
    console.log('Final schedule records for Nov 10-16, 2025:', rows.length);
    if (rows.length > 0) {
      console.log('Sample record:', rows[0]);
    } else {
      console.log('No records found for that date range');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

checkFinalSchedule();
