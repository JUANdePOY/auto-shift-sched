const db = require('./shared/config/database');

async function testJoinIssue() {
  try {
    // Check if the JOIN is failing - let's see what shift_id values exist
    const [shifts] = await db.query('SELECT DISTINCT shift_id FROM final_schedule LIMIT 5');
    console.log('shift_id values in final_schedule:', shifts.map(s => s.shift_id));

    // Check if these shift_ids exist in shifts table
    const shiftIds = shifts.map(s => s.shift_id);
    const [existingShifts] = await db.query('SELECT id FROM shifts WHERE id IN (?)', [shiftIds]);
    console.log('Existing shift_ids in shifts table:', existingShifts.map(s => s.id));

    // Check employee_ids too
    const [employees] = await db.query('SELECT DISTINCT employee_id FROM final_schedule LIMIT 5');
    console.log('employee_id values in final_schedule:', employees.map(e => e.employee_id));

    const employeeIds = employees.map(e => e.employee_id);
    const [existingEmployees] = await db.query('SELECT id FROM employees WHERE id IN (?)', [employeeIds]);
    console.log('Existing employee_ids in employees table:', existingEmployees.map(e => e.id));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testJoinIssue();
