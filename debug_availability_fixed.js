const db = require('./server/shared/config/database');

async function debugAvailability() {
  try {
    console.log('Checking availability submissions...');

    // Check table structure
    const [tables] = await db.query('SHOW TABLES LIKE "availability_submissions"');
    if (tables.length === 0) {
      console.log('availability_submissions table does not exist');
      return;
    }

    // Check sample data
    const [results] = await db.query('SELECT employee_id, week_start, availability FROM availability_submissions LIMIT 5');
    console.log('Sample availability submissions:');
    results.forEach((row, index) => {
      let availStr = 'null';
      if (row.availability) {
        try {
          const parsed = JSON.parse(row.availability);
          availStr = JSON.stringify(parsed).substring(0, 100);
        } catch (e) {
          availStr = String(row.availability).substring(0, 100);
        }
      }
      console.log(`${index + 1}. Employee ${row.employee_id}: week=${row.week_start}, availability=${availStr}...`);
    });

    // Check for employees without submissions
    const [employees] = await db.query('SELECT id, name FROM employees LIMIT 5');
    console.log('\nSample employees:');
    employees.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.name} (ID: ${emp.id})`);
    });

    // Check how many employees have submissions for a recent week
    const recentWeek = '2024-09-30'; // Example week
    const [submissions] = await db.query('SELECT COUNT(*) as count FROM availability_submissions WHERE week_start = ?', [recentWeek]);
    console.log(`\nSubmissions for week ${recentWeek}: ${submissions[0].count}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

debugAvailability();
