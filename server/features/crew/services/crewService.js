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

      const profile = rows[0];

      // Parse station data - handle JSON arrays, comma-separated strings, and already parsed arrays
      if (profile.station) {
        if (Array.isArray(profile.station)) {
          // Already parsed by MySQL driver
          profile.stations = profile.station;
          delete profile.station;
        } else if (typeof profile.station === 'string') {
          try {
            // First try to parse as JSON
            const parsedStation = JSON.parse(profile.station);
            if (Array.isArray(parsedStation)) {
              profile.stations = parsedStation;
              delete profile.station; // Remove the old station field
            } else {
              profile.stations = [parsedStation]; // Convert single station to array
              delete profile.station;
            }
          } catch (e) {
            // If JSON parsing fails, treat as comma-separated string
            if (profile.station.includes(',')) {
              // Split by comma and trim whitespace
              profile.stations = profile.station.split(',').map(s => s.trim()).filter(s => s.length > 0);
            } else {
              // Single station string
              profile.stations = [profile.station];
            }
            delete profile.station;
          }
        } else {
          // Fallback for other types
          profile.stations = [String(profile.station)];
          delete profile.station;
        }
      } else {
        profile.stations = [];
      }

      return profile;
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
      // Use availability_submissions table with ON DUPLICATE KEY UPDATE (admin-style)
      // This allows proper updates instead of replacing all data
      const query = `
        INSERT INTO availability_submissions (employee_id, week_start, availability, submission_date, is_locked)
        VALUES (?, ?, ?, NOW(), FALSE)
        ON DUPLICATE KEY UPDATE
        availability = VALUES(availability),
        submission_date = NOW(),
        is_locked = FALSE
      `;

      // Extract week_start from availability data (assuming it's passed in the format)
      // If not provided, we'll need to get it from existing data or use current week
      let weekStart = availability.weekStart;
      if (!weekStart) {
        // Get the most recent submission for this employee to determine week_start
        const [existing] = await db.execute(
          'SELECT week_start FROM availability_submissions WHERE employee_id = ? ORDER BY submission_date DESC LIMIT 1',
          [employeeId]
        );
        weekStart = existing.length > 0 ? existing[0].week_start : this.getCurrentWeekStart();
      }

      await db.execute(query, [
        employeeId,
        weekStart,
        JSON.stringify(availability.preferences || availability)
      ]);

      return { success: true, message: 'Availability updated successfully' };
    } catch (error) {
      console.error('Error in updateAvailability:', error);
      throw error;
    }
  }

  // Helper method to get current week start (Monday)
  getCurrentWeekStart() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split('T')[0];
  }
}

module.exports = new CrewService();
