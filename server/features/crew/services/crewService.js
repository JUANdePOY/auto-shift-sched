const db = require('../../../shared/config/database');

class CrewService {
  async getProfile(employeeId) {
    try {
      const query = `
        SELECT
          id,
          name,
          email,
          department,
          station,
          maxHoursPerWeek,
          currentWeeklyHours,
          role
        FROM employees
        WHERE id = ?
      `;

      const [rows] = await db.execute(query, [employeeId]);

      if (rows.length === 0) {
        throw new Error('Employee not found');
      }

      return rows[0];
    } catch (error) {
      console.error('Error in getProfile:', error);
      throw error;
    }
  }

  async getUpcomingShifts(employeeId) {
    try {
      const query = `
        SELECT
          fs.shift_id as id,
          fs.date_schedule as date,
          s.startTime,
          s.endTime,
          fs.required_stations as station,
          'scheduled' as status
        FROM final_schedule fs
        JOIN shifts s ON fs.shift_id = s.id
        WHERE fs.employee_id = ?
          AND fs.date_schedule >= CURDATE()
        ORDER BY fs.date_schedule ASC, s.startTime ASC
        LIMIT 10
      `;

      const [rows] = await db.execute(query, [employeeId]);
      return rows;
    } catch (error) {
      console.error('Error in getUpcomingShifts:', error);
      throw error;
    }
  }

  async getStats(employeeId) {
    try {
      // Get current week stats from final_schedule table
      const currentWeekQuery = `
        SELECT
          COUNT(*) as totalShifts,
          SUM(TIMESTAMPDIFF(HOUR, startTime, endTime)) as totalHours,
          SUM(CASE WHEN time_out IS NOT NULL THEN 1 ELSE 0 END) as completedShifts
        FROM final_schedule fs
        JOIN shifts s ON fs.shift_id = s.id
        WHERE fs.employee_id = ?
          AND YEARWEEK(fs.date_schedule, 1) = YEARWEEK(CURDATE(), 1)
      `;

      const [currentWeekRows] = await db.execute(currentWeekQuery, [employeeId]);
      const currentWeek = currentWeekRows[0];

      // Get next week stats from final_schedule table
      const nextWeekQuery = `
        SELECT
          COUNT(*) as totalShifts,
          SUM(TIMESTAMPDIFF(HOUR, startTime, endTime)) as totalHours
        FROM final_schedule fs
        JOIN shifts s ON fs.shift_id = s.id
        WHERE fs.employee_id = ?
          AND YEARWEEK(fs.date_schedule, 1) = YEARWEEK(DATE_ADD(CURDATE(), INTERVAL 1 WEEK), 1)
      `;

      const [nextWeekRows] = await db.execute(nextWeekQuery, [employeeId]);
      const nextWeek = nextWeekRows[0];

      return {
        currentWeek: {
          shifts: currentWeek.totalShifts || 0,
          hours: currentWeek.totalHours || 0,
          completedShifts: currentWeek.completedShifts || 0
        },
        nextWeek: {
          shifts: nextWeek.totalShifts || 0,
          hours: nextWeek.totalHours || 0
        }
      };
    } catch (error) {
      console.error('Error in getStats:', error);
      throw error;
    }
  }

  async updateAvailability(employeeId, availability) {
    try {
      // First, delete existing availability for this employee
      await db.execute('DELETE FROM availability WHERE employee_id = ?', [employeeId]);

      // Insert new availability
      const insertQuery = `
        INSERT INTO availability (employee_id, day_of_week, available, start_time, end_time)
        VALUES (?, ?, ?, ?, ?)
      `;

      for (const day of availability) {
        await db.execute(insertQuery, [
          employeeId,
          day.dayOfWeek,
          day.available,
          day.startTime || null,
          day.endTime || null
        ]);
      }

      return { success: true, message: 'Availability updated successfully' };
    } catch (error) {
      console.error('Error in updateAvailability:', error);
      throw error;
    }
  }
}

module.exports = new CrewService();
