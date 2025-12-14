const db = require('./shared/config/database');

async function updateShiftDate() {
  try {
    // Update the date_schedule from 2025-11-09 to 2025-11-10 for the shift
    const [result] = await db.query(
      'UPDATE final_schedule SET date_schedule = ? WHERE date_schedule = ? AND shift_title = ?',
      ['2025-11-10', '2025-11-09', 'Production Shift']
    );
    console.log('Update result:', result);
    console.log('Rows affected:', result.affectedRows);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

updateShiftDate();
