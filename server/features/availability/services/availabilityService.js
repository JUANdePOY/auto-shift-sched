/**
 * Availability Service
 * Handles business logic for availability management
 */

const db = require('../../../shared/config/database');

class AvailabilityService {
  constructor() {
    this.defaultAvailability = {
      monday: { available: false },
      tuesday: { available: false },
      wednesday: { available: false },
      thursday: { available: false },
      friday: { available: false },
      saturday: { available: false },
      sunday: { available: false }
    };
  }

  /**
   * Get availability for employee and week
   */
  async getAvailability(employeeId, weekStart) {
    try {
      const [results] = await db.promise().query(
        `SELECT * FROM availability_submissions 
         WHERE employee_id = ? AND week_start = ? 
         ORDER BY submission_date DESC LIMIT 1`,
        [employeeId, weekStart]
      );

      if (results.length === 0) {
        // Check if employee exists
        const [employeeResult] = await db.promise().query(
          'SELECT id FROM employees WHERE id = ?',
          [employeeId]
        );

        if (employeeResult.length === 0) {
          throw new Error('Employee not found');
        }

        // Return default empty availability since availability is now in submissions table
        return {
          employeeId: parseInt(employeeId),
          weekStart,
          availability: { ...this.defaultAvailability },
          isLocked: false,
          submissionDate: null,
          status: 'not_submitted'
        };
      }

      const submission = results[0];
      return {
        employeeId: submission.employee_id,
        weekStart: submission.week_start,
        availability: JSON.parse(submission.availability),
        isLocked: submission.is_locked,
        submissionDate: submission.submission_date,
        status: submission.is_locked ? 'locked' : 'submitted'
      };
    } catch (error) {
      console.error('Error getting availability:', error);
      throw error;
    }
  }

  
    // Submit availability for a week
   
  async submitAvailability(employeeId, weekStart, availability) {
    try {
      // Check if submissions are locked for this week
      const [lockCheck] = await db.promise().query(
        'SELECT is_locked FROM availability_submissions WHERE week_start = ? AND employee_id = ? ORDER BY submission_date DESC LIMIT 1',
        [weekStart, employeeId]
      );

      if (lockCheck.length > 0 && lockCheck[0].is_locked) {
        throw new Error('Availability submissions are locked for this week');
      }

      // Check submission window (future weeks only)
      const currentDate = new Date();
      const submissionWeek = new Date(weekStart);
      if (submissionWeek <= currentDate) {
        throw new Error('Cannot submit availability for past or current weeks');
      }

      const query = `
        INSERT INTO availability_submissions (employee_id, week_start, availability, submission_date)
        VALUES (?, ?, ?, NOW())
      `;

      await db.promise().query(query, [
        employeeId,
        weekStart,
        JSON.stringify(availability)
      ]);

      return {
        message: 'Availability submitted successfully',
        employeeId,
        weekStart,
        availability
      };
    } catch (error) {
      console.error('Error submitting availability:', error);
      throw error;
    }
  }

  /**
   * Lock availability submissions for a week
   */
  async lockAvailability(weekStart) {
    try {
      const [result] = await db.promise().query(
        `UPDATE availability_submissions 
         SET is_locked = TRUE 
         WHERE week_start = ? AND is_locked = FALSE`,
        [weekStart]
      );

      return {
        message: `Availability locked for week starting ${weekStart}`,
        lockedCount: result.affectedRows
      };
    } catch (error) {
      console.error('Error locking availability:', error);
      throw error;
    }
  }

  /**
   * Get availability submission status for a week
   */
  async getAvailabilityStatus(weekStart) {
    try {
      const [submissionCount] = await db.promise().query(
        `SELECT COUNT(DISTINCT employee_id) as total_submissions 
         FROM availability_submissions 
         WHERE week_start = ?`,
        [weekStart]
      );

      const [lockedCount] = await db.promise().query(
        `SELECT COUNT(*) as locked_count 
         FROM availability_submissions 
         WHERE week_start = ? AND is_locked = TRUE`,
        [weekStart]
      );

      const [employeeCount] = await db.promise().query(
        'SELECT COUNT(*) as total_employees FROM employees'
      );

      return {
        weekStart,
        totalEmployees: employeeCount[0].total_employees,
        submissions: submissionCount[0].total_submissions,
        locked: lockedCount[0].locked_count > 0,
        submissionRate: Math.round((submissionCount[0].total_submissions / employeeCount[0].total_employees) * 100)
      };
    } catch (error) {
      console.error('Error getting availability status:', error);
      throw error;
    }
  }

  /**
   * Get all availability submissions for a specific week
   */
  async getWeeklySubmissions(weekStart) {
    try {
      const [results] = await db.promise().query(
        `SELECT 
          asub.id,
          asub.employee_id as employeeId,
          e.name as employeeName,
          e.department,
          e.station,
          asub.week_start as weekStart,
          asub.availability,
          asub.submission_date as submissionDate,
          asub.is_locked as isLocked
         FROM availability_submissions asub
         JOIN employees e ON asub.employee_id = e.id
         WHERE asub.week_start = ?
         ORDER BY e.name, asub.submission_date DESC`,
        [weekStart]
      );

      return results.map(submission => ({
        id: submission.id,
        employeeId: submission.employeeId,
        employeeName: submission.employeeName,
        department: submission.department,
        station: submission.station,
        weekStart: submission.weekStart,
        availability: JSON.parse(submission.availability),
        submissionDate: submission.submissionDate,
        isLocked: submission.isLocked,
        status: submission.isLocked ? 'locked' : 'submitted'
      }));
    } catch (error) {
      console.error('Error getting weekly submissions:', error);
      throw error;
    }
  }

  /**
   * Get availability history for an employee
   */
  async getAvailabilityHistory(employeeId) {
    try {
      const [results] = await db.promise().query(
        `SELECT week_start, availability, submission_date, is_locked 
         FROM availability_submissions 
         WHERE employee_id = ? 
         ORDER BY week_start DESC, submission_date DESC`,
        [employeeId]
      );

      const history = results.map(submission => ({
        weekStart: submission.week_start,
        availability: JSON.parse(submission.availability),
        submissionDate: submission.submission_date,
        isLocked: submission.is_locked,
        status: submission.is_locked ? 'locked' : 'submitted'
      }));

      return {
        employeeId: parseInt(employeeId),
        history,
        totalSubmissions: results.length
      };
    } catch (error) {
      console.error('Error getting availability history:', error);
      throw error;
    }
  }

  /**
   * Check if employee is available for a specific date and time
   */
  async checkEmployeeAvailability(employeeId, date, startTime, endTime) {
    try {
      // Use the provided date directly to find the week containing that date
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();

      // Calculate the Monday of the week containing the target date
      const weekStart = new Date(targetDate);
      weekStart.setDate(targetDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
      const weekStartStr = weekStart.toISOString().split('T')[0];

      // Get availability for the week
      const availability = await this.getAvailability(employeeId, weekStartStr);

      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = days[dayOfWeek];
      const dayAvailability = availability.availability[dayName];

      if (!dayAvailability || !dayAvailability.available) {
        return {
          available: false,
          reason: 'Not available on this day'
        };
      }

      // Check if shift falls within preferred times if specified
      if (dayAvailability.preferredStart && dayAvailability.preferredEnd) {
        const shiftStart = new Date(`1970-01-01T${startTime}`);
        const shiftEnd = new Date(`1970-01-01T${endTime}`);
        const preferredStart = new Date(`1970-01-01T${dayAvailability.preferredStart}`);
        const preferredEnd = new Date(`1970-01-01T${dayAvailability.preferredEnd}`);

        if (shiftStart < preferredStart || shiftEnd > preferredEnd) {
          return {
            available: true,
            preferred: false,
            reason: 'Outside preferred hours'
          };
        }
      }

      return {
        available: true,
        preferred: true
      };
    } catch (error) {
      console.error('Error checking employee availability:', error);
      throw error;
    }
  }
}

module.exports = new AvailabilityService();
