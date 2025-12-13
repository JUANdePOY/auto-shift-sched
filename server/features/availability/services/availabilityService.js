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
      const [results] = await db.query(
        `SELECT * FROM availability_submissions 
         WHERE employee_id = ? AND week_start = ? 
         ORDER BY submission_date DESC LIMIT 1`,
        [employeeId, weekStart]
      );

      if (results.length === 0) {
        // Check if employee exists
        const [employeeResult] = await db.query(
          'SELECT id FROM employees WHERE id = ?',
          [employeeId]
        );

        if (employeeResult.length === 0) {
          throw new Error('Employee not found');
        }

        // Return default available availability for backward compatibility
        const availableAvailability = {
          monday: { available: false },
          tuesday: { available: false },
          wednesday: { available: false },
          thursday: { available: false },
          friday: { available: false },
          saturday: { available: false },
          sunday: { available: false }
        };

        return {
          employeeId: parseInt(employeeId),
          weekStart,
          availability: availableAvailability,
          isLocked: false,
          submissionDate: null,
          status: 'not_submitted'
        };
      }

      const submission = results[0];
      let availability;
      let parseSuccess = false;
      let isValidData = false;

      try {
        // MySQL JSON column returns parsed objects, not strings
        if (submission.availability === null || submission.availability === undefined) {
          console.warn(`Null or undefined availability for employee ${submission.employee_id}, week ${submission.week_start}`);
          parseSuccess = false;
        } else if (typeof submission.availability === 'object') {
          // Already parsed by MySQL JSON column
          availability = submission.availability;
          parseSuccess = true;
          isValidData = true;
        } else if (typeof submission.availability === 'string') {
          // Handle legacy string data or corrupted data
          if (submission.availability === '[object Object]' ||
              submission.availability === 'undefined' ||
              submission.availability === 'null' ||
              submission.availability.trim() === '') {
            console.warn(`Invalid or corrupted string data in availability for employee ${submission.employee_id}, week ${submission.week_start}: ${submission.availability}`);
            parseSuccess = false;
          } else {
            availability = JSON.parse(submission.availability);
            parseSuccess = true;
            isValidData = typeof availability === 'object' && availability !== null && !Array.isArray(availability);
          }
        } else {
          console.warn(`Unexpected availability type for employee ${submission.employee_id}, week ${submission.week_start}: ${typeof submission.availability}`);
          parseSuccess = false;
        }
      } catch (parseError) {
        console.warn(`Invalid JSON in availability for employee ${submission.employee_id}, week ${submission.week_start}: ${submission.availability}`);
        parseSuccess = false;
      }

      // If parsing failed or data is invalid, treat as not submitted
      if (!parseSuccess || !isValidData) {
        return {
          employeeId: parseInt(employeeId),
          weekStart,
          availability: { ...this.defaultAvailability },
          isLocked: false,
          submissionDate: null,
          status: 'not_submitted'
        };
      }

      return {
        employeeId: submission.employee_id,
        weekStart: submission.week_start,
        availability,
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
      const [lockCheck] = await db.query(
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

      await db.query(query, [
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
      const [result] = await db.query(
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
      const [submissionCount] = await db.query(
        `SELECT COUNT(DISTINCT employee_id) as total_submissions 
         FROM availability_submissions 
         WHERE week_start = ?`,
        [weekStart]
      );

      const [lockedCount] = await db.query(
        `SELECT COUNT(*) as locked_count 
         FROM availability_submissions 
         WHERE week_start = ? AND is_locked = TRUE`,
        [weekStart]
      );

      const [employeeCount] = await db.query(
        'SELECT COUNT(*) as total_employees FROM employees WHERE role != ?',
        ['admin']
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
      const [results] = await db.query(
        `SELECT
          e.id as employeeId,
          e.name as employeeName,
          e.department,
          e.station,
          a.id,
          a.week_start as weekStart,
          a.availability,
          a.submission_date as submissionDate,
          a.is_locked as isLocked
        FROM employees e
        LEFT JOIN (
          SELECT employee_id, week_start, id, availability, submission_date, is_locked
          FROM availability_submissions a1
          WHERE week_start = ? AND id = (
            SELECT id FROM availability_submissions a2 
            WHERE a2.employee_id = a1.employee_id AND a2.week_start = a1.week_start 
            ORDER BY submission_date DESC LIMIT 1
          )
        ) a ON e.id = a.employee_id
        WHERE e.role != ?
        ORDER BY e.name`,
        [weekStart, 'admin']
      );

      return results.map(submission => {
        const hasSubmission = submission.id !== null;
        let availability;
        
        if (hasSubmission) {
          try {
            // MySQL JSON column returns parsed objects, not strings
            if (submission.availability === null || submission.availability === undefined) {
              console.warn(`Null or undefined availability for employee ${submission.employeeId}, week ${submission.weekStart}`);
              availability = { ...this.defaultAvailability };
            } else if (typeof submission.availability === 'object') {
              // Already parsed by MySQL JSON column
              availability = submission.availability;
            } else if (typeof submission.availability === 'string') {
              // Handle legacy string data or corrupted data
              if (submission.availability === '[object Object]' ||
                  submission.availability === 'undefined' ||
                  submission.availability === 'null' ||
                  submission.availability.trim() === '') {
                console.warn(`Invalid or corrupted string data in availability for employee ${submission.employeeId}, week ${submission.weekStart}: ${submission.availability}`);
                availability = { ...this.defaultAvailability };
              } else {
                availability = JSON.parse(submission.availability);
              }
            } else {
              console.warn(`Unexpected availability type for employee ${submission.employeeId}, week ${submission.weekStart}: ${typeof submission.availability}`);
              availability = { ...this.defaultAvailability };
            }
          } catch (parseError) {
            console.warn(`Invalid JSON in availability for employee ${submission.employeeId}, week ${submission.weekStart}: ${submission.availability}`);
            availability = { ...this.defaultAvailability };
          }
        } else {
          // No submission, use default availability
          availability = { ...this.defaultAvailability };
        }
        
        return {
          id: submission.id,
          employeeId: submission.employeeId,
          employeeName: submission.employeeName,
          department: submission.department,
          station: submission.station,
          weekStart: submission.weekStart || weekStart,
          availability,
          submissionDate: submission.submissionDate,
          isLocked: submission.isLocked || false,
          status: hasSubmission ? (submission.isLocked ? 'locked' : 'submitted') : 'not_submitted'
        };
      });
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
      const [results] = await db.query(
        `SELECT week_start, availability, submission_date, is_locked 
         FROM availability_submissions 
         WHERE employee_id = ? 
         ORDER BY week_start DESC, submission_date DESC`,
        [employeeId]
      );

      const history = results.map(submission => {
        let availability;
        try {
          // Handle cases where availability might be stored as "[object Object]"
          if (submission.availability === '[object Object]' || !submission.availability || submission.availability.trim() === '') {
            console.warn(`Invalid or empty JSON in availability history for employee ${employeeId}, week ${submission.week_start}: ${submission.availability}`);
            availability = { ...this.defaultAvailability };
          } else {
            availability = JSON.parse(submission.availability);
          }
        } catch (parseError) {
          console.warn(`Invalid JSON in availability history for employee ${employeeId}, week ${submission.week_start}: ${submission.availability}`);
          availability = { ...this.defaultAvailability };
        }
        return {
          weekStart: submission.week_start,
          availability,
          submissionDate: submission.submission_date,
          isLocked: submission.is_locked,
          status: submission.is_locked ? 'locked' : 'submitted'
        };
      });

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
   * Admin submit/update availability for a week (bypasses locks and date checks)
   */
  async adminSubmitAvailability(employeeId, weekStart, availability) {
    try {
      const query = `
        INSERT INTO availability_submissions (employee_id, week_start, availability, submission_date, is_locked)
        VALUES (?, ?, ?, NOW(), FALSE)
        ON DUPLICATE KEY UPDATE
        availability = VALUES(availability),
        submission_date = NOW(),
        is_locked = FALSE
      `;

      await db.query(query, [
        employeeId,
        weekStart,
        JSON.stringify(availability)
      ]);

      return {
        message: 'Availability updated successfully by admin',
        employeeId,
        weekStart,
        availability
      };
    } catch (error) {
      console.error('Error submitting admin availability:', error);
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

      // If no availability submitted, consider not available
      if (availability.status === 'not_submitted') {
        return {
          available: false,
          reason: 'No availability submitted'
        };
      }

      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = days[dayOfWeek];
      const dayAvailability = availability.availability[dayName];

      if (!dayAvailability || !dayAvailability.available) {
        return {
          available: false,
          reason: 'Not available on this day'
        };
      }

      // Convert shift times to minutes since midnight for easier comparison
      const shiftStartMinutes = this.timeToMinutes(startTime);
      const shiftEndMinutes = this.timeToMinutes(endTime);

      // Check timeBlocks first (more specific availability periods)
      if (dayAvailability.timeBlocks && Array.isArray(dayAvailability.timeBlocks) && dayAvailability.timeBlocks.length > 0) {
        // Check if shift overlaps with any time block
        const hasOverlappingBlock = dayAvailability.timeBlocks.some(block => {
          if (!block.startTime || !block.endTime) return false;

          const blockStartMinutes = this.timeToMinutes(block.startTime);
          const blockEndMinutes = this.timeToMinutes(block.endTime);

          // Check for overlap: shift starts before block ends AND shift ends after block starts
          return shiftStartMinutes < blockEndMinutes && shiftEndMinutes > blockStartMinutes;
        });

        if (!hasOverlappingBlock) {
          return {
            available: false,
            reason: 'Shift does not overlap with any available time blocks'
          };
        }

        // Check if shift is completely within any preferred time block
        const hasPreferredBlock = dayAvailability.timeBlocks.some(block => {
          if (!block.startTime || !block.endTime || !block.preferred) return false;

          const blockStartMinutes = this.timeToMinutes(block.startTime);
          const blockEndMinutes = this.timeToMinutes(block.endTime);

          // Check if shift is completely within this preferred block
          return shiftStartMinutes >= blockStartMinutes && shiftEndMinutes <= blockEndMinutes;
        });

        return {
          available: true,
          preferred: hasPreferredBlock,
          reason: hasPreferredBlock ? 'Within preferred time block' : 'Within available time block but not preferred'
        };
      }

      // Fallback to preferredStart/preferredEnd if no timeBlocks
      if (dayAvailability.preferredStart && dayAvailability.preferredEnd) {
        const preferredStartMinutes = this.timeToMinutes(dayAvailability.preferredStart);
        const preferredEndMinutes = this.timeToMinutes(dayAvailability.preferredEnd);

        // Check if shift overlaps with preferred times
        const overlapsPreferred = shiftStartMinutes < preferredEndMinutes && shiftEndMinutes > preferredStartMinutes;

        if (!overlapsPreferred) {
          return {
            available: true,
            preferred: false,
            reason: 'Outside preferred hours'
          };
        }

        // Check if shift is completely within preferred times
        const withinPreferred = shiftStartMinutes >= preferredStartMinutes && shiftEndMinutes <= preferredEndMinutes;

        return {
          available: true,
          preferred: withinPreferred,
          reason: withinPreferred ? 'Within preferred hours' : 'Overlaps with preferred hours'
        };
      }

      // Fallback to legacy startTime/endTime if no preferred times
      if (dayAvailability.startTime && dayAvailability.endTime) {
        const availStartMinutes = this.timeToMinutes(dayAvailability.startTime);
        const availEndMinutes = this.timeToMinutes(dayAvailability.endTime);

        // Check if shift overlaps with available times (with 1-hour flexibility)
        const flexibilityMinutes = 60; // 1 hour flexibility
        const canStart = shiftStartMinutes >= (availStartMinutes - flexibilityMinutes);
        const canEnd = shiftEndMinutes <= (availEndMinutes + flexibilityMinutes);

        if (!canStart || !canEnd) {
          return {
            available: false,
            reason: 'Outside available hours'
          };
        }

        // Determine if shift is within available times
        const withinAvailable = shiftStartMinutes >= availStartMinutes && shiftEndMinutes <= availEndMinutes;

        return {
          available: true,
          preferred: withinAvailable,
          reason: withinAvailable ? 'Within available hours' : 'Within flexible available hours'
        };
      }

      // If no specific times set, consider available but not preferred
      return {
        available: true,
        preferred: false,
        reason: 'No specific times set'
      };
    } catch (error) {
      console.error('Error checking employee availability:', error);
      throw error;
    }
  }

  /**
   * Convert time string to minutes since midnight
   * @param {string} time - Time string (HH:MM)
   * @returns {number} Minutes since midnight
   */
  timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

module.exports = new AvailabilityService();
