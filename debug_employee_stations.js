const db = require('./server/shared/config/database');

async function debugEmployeeStations() {
  try {
    console.log('Checking employee stations and shift requirements...');

    // Get all employees
    const [employees] = await db.query('SELECT id, name, department, station FROM employees');
    console.log('\nEmployees:');
    employees.forEach(emp => {
      console.log(`${emp.id}: ${emp.name} - Dept: ${emp.department} - Station: ${emp.station}`);
    });

    // Get all shifts
    const [shifts] = await db.query('SELECT id, title, department, requiredStation FROM shifts');
    console.log('\nShifts:');
    shifts.forEach(shift => {
      console.log(`${shift.id}: ${shift.title} - Dept: ${shift.department} - Required: ${shift.requiredStation}`);
    });

    // Check for a specific shift and see matching employees
    if (shifts.length > 0) {
      const testShift = shifts[0];
      console.log(`\nTesting shift: ${testShift.title} (Dept: ${testShift.department}, Required: ${testShift.requiredStation})`);

      let requiredStations = [];
      if (Array.isArray(testShift.requiredStation)) {
        requiredStations = testShift.requiredStation.map(s => String(s).trim().toLowerCase());
      } else if (testShift.requiredStation) {
        requiredStations = [String(testShift.requiredStation).trim().toLowerCase()];
      }

      console.log('Required stations (processed):', requiredStations);

      employees.forEach(emp => {
        if (emp.department !== testShift.department) {
          console.log(`  ${emp.name}: Wrong department (${emp.department} != ${testShift.department})`);
          return;
        }

        let employeeStations = [];
        if (Array.isArray(emp.station)) {
          employeeStations = emp.station.flat().map(s => {
            if (typeof s === 'string') {
              return s.trim().toLowerCase();
            }
            if (typeof s === 'object' && s !== null && 'name' in s) {
              return s.name.trim().toLowerCase();
            }
            return String(s).trim().toLowerCase();
          });
        } else if (typeof emp.station === 'string') {
          employeeStations = emp.station.split(',').map(s => s.trim().toLowerCase());
        } else {
          employeeStations = String(emp.station).split(',').map(s => s.trim().toLowerCase());
        }

        employeeStations = employeeStations.filter(s => s !== '');

        console.log(`  ${emp.name}: Employee stations:`, employeeStations);

        const matchingStations = requiredStations.filter(required =>
          employeeStations.includes(required)
        );

        console.log(`    Matching stations: ${matchingStations.length} (${matchingStations.join(', ')})`);

        if (matchingStations.length > 0) {
          console.log(`    *** MATCH: ${emp.name} can work this shift ***`);
        } else {
          console.log(`    No match for ${emp.name}`);
        }
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

debugEmployeeStations();
