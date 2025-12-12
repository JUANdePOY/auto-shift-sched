const db = require('./shared/config/database');

async function checkFinalSchedule() {
  try {
    const [rows] = await db.query('SELECT COUNT(*) as count FROM final_schedule');
    console.log('Total final schedule records:', rows[0].count);

    if (rows[0].count > 0) {
      const [sample] = await db.query('SELECT * FROM final_schedule LIMIT 5');
      console.log('Sample final schedule records:');
      console.log(JSON.stringify(sample, null, 2));
    } else {
      console.log('No final schedule records found');
    }
  } catch (error) {
    console.error('Error checking final schedule:', error);
  } finally {
    process.exit(0);
  }
}

checkFinalSchedule();
