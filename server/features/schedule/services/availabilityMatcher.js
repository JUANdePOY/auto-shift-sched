/**
 * Availability Matcher
 * Handles time availability and preference matching for shifts
 */
class AvailabilityMatcher {
  constructor() {
    this.timeSlots = {
      early: { start: '06:00', end: '12:00' },
      mid: { start: '12:00', end: '18:00' },
      late: { start: '18:00', end: '24:00' },
      graveyard: { start: '00:00', end: '06:00' }
    };
  }

  /**
   * Check if employee is available for a shift
   * @param {Object} employee - Employee object with availability
   * @param {Object} shift - Shift object with date, startTime, endTime
   * @returns {boolean} Is available
   */
  isEmployeeAvailable(employee, shift) {
    const dayOfWeek = this.getDayOfWeek(shift.date);
    const availability = employee.availability[dayOfWeek];

    if (!availability || !availability.available) {
      return false;
    }

    // Check if shift times overlap with available times
    return this.timesOverlap(
      shift.startTime,
      shift.endTime,
      availability.startTime || '00:00',
      availability.endTime || '23:59'
    );
  }

  /**
   * Calculate availability match score
   * @param {Object} employee - Employee object
   * @param {Object} shift - Shift object
   * @returns {number} Score 0-100 (higher is better match)
   */
  calculateAvailabilityScore(employee, shift) {
    const dayOfWeek = this.getDayOfWeek(shift.date);
    const availability = employee.availability[dayOfWeek];

    if (!availability || !availability.available) {
      return 0;
    }

    let score = 50; // Base score for being available

    // Check preferred time match
    if (availability.preferredStart && availability.preferredEnd) {
      const preferredOverlap = this.calculateTimeOverlap(
        shift.startTime,
        shift.endTime,
        availability.preferredStart,
        availability.preferredEnd
      );

      if (preferredOverlap === 1.0) {
        score += 40; // Perfect preferred time match
      } else if (preferredOverlap > 0.8) {
        score += 30; // Good preferred time match
      } else if (preferredOverlap > 0.5) {
        score += 20; // Moderate preferred time match
      } else if (preferredOverlap > 0) {
        score += 10; // Some preferred time match
      }
    }

    // Check shift type preference
    const shiftType = this.getShiftType(shift.startTime);
    if (availability.preferredShiftTypes && availability.preferredShiftTypes.includes(shiftType)) {
      score += 10;
    }

    // Penalty for working outside preferred times
    const availableOverlap = this.calculateTimeOverlap(
      shift.startTime,
      shift.endTime,
      availability.startTime || '00:00',
      availability.endTime || '23:59'
    );

    if (availableOverlap < 1.0) {
      score -= (1.0 - availableOverlap) * 20; // Penalty for partial availability
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Group employees by availability patterns
   * @param {Array} employees - Array of employee objects
   * @returns {Object} Employees grouped by availability pattern
   */
  groupEmployeesByAvailability(employees) {
    const groups = {};

    employees.forEach(employee => {
      const pattern = this.getAvailabilityPattern(employee.availability);
      if (!groups[pattern]) {
        groups[pattern] = [];
      }
      groups[pattern].push(employee);
    });

    return groups;
  }

  /**
   * Get availability pattern string for an employee
   * @param {Object} availability - Employee availability object
   * @returns {string} Pattern string
   */
  getAvailabilityPattern(availability) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const pattern = days.map(day => {
      const dayAvailability = availability[day];
      if (!dayAvailability || !dayAvailability.available) return '0';

      const startHour = dayAvailability.startTime ? parseInt(dayAvailability.startTime.split(':')[0]) : 0;
      const endHour = dayAvailability.endTime ? parseInt(dayAvailability.endTime.split(':')[0]) : 24;

      if (startHour >= 6 && endHour <= 18) return 'D'; // Day shift
      if (startHour >= 18 || endHour <= 6) return 'N'; // Night shift
      return 'F'; // Full day
    }).join('');

    return pattern;
  }

  /**
   * Find best time matches for a shift
   * @param {Array} employees - Array of employees
   * @param {Object} shift - Shift object
   * @returns {Array} Employees sorted by time match score
   */
  findBestTimeMatches(employees, shift) {
    return employees
      .filter(employee => this.isEmployeeAvailable(employee, shift))
      .map(employee => ({
        employee,
        score: this.calculateAvailabilityScore(employee, shift)
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Check if two time ranges overlap
   * @param {string} start1 - Start time 1
   * @param {string} end1 - End time 1
   * @param {string} start2 - Start time 2
   * @param {string} end2 - End time 2
   * @returns {boolean} Do times overlap
   */
  timesOverlap(start1, end1, start2, end2) {
    const s1 = this.timeToMinutes(start1);
    const e1 = this.timeToMinutes(end1);
    const s2 = this.timeToMinutes(start2);
    const e2 = this.timeToMinutes(end2);

    return s1 < e2 && e1 > s2;
  }

  /**
   * Calculate overlap ratio between two time ranges
   * @param {string} start1 - Start time 1
   * @param {string} end1 - End time 1
   * @param {string} start2 - Start time 2
   * @param {string} end2 - End time 2
   * @returns {number} Overlap ratio (0-1)
   */
  calculateTimeOverlap(start1, end1, start2, end2) {
    const s1 = this.timeToMinutes(start1);
    const e1 = this.timeToMinutes(end1);
    const s2 = this.timeToMinutes(start2);
    const e2 = this.timeToMinutes(end2);

    const overlapStart = Math.max(s1, s2);
    const overlapEnd = Math.min(e1, e2);

    if (overlapStart >= overlapEnd) return 0;

    const overlapDuration = overlapEnd - overlapStart;
    const shiftDuration = e1 - s1;

    return overlapDuration / shiftDuration;
  }

  /**
   * Convert time string to minutes since midnight
   * @param {string} time - Time string (HH:MM or HH:MM:SS)
   * @returns {number} Minutes since midnight
   */
  timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get day of week from date string
   * @param {string} dateString - Date string (YYYY-MM-DD)
   * @returns {string} Day of week
   */
  getDayOfWeek(dateString) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const date = new Date(dateString);
    return days[date.getDay()];
  }

  /**
   * Get shift type based on start time
   * @param {string} startTime - Start time
   * @returns {string} Shift type
   */
  getShiftType(startTime) {
    const hour = parseInt(startTime.split(':')[0], 10);
    if (hour >= 6 && hour < 12) return 'opener';
    if (hour >= 12 && hour < 18) return 'mid';
    if (hour >= 18 && hour < 24) return 'closer';
    return 'graveyard';
  }

  /**
   * Get employees available for specific time slots
   * @param {Array} employees - Array of employees
   * @param {string} date - Date string
   * @param {string} timeSlot - Time slot ('early', 'mid', 'late', 'graveyard')
   * @returns {Array} Available employees
   */
  getEmployeesForTimeSlot(employees, date, timeSlot) {
    const slot = this.timeSlots[timeSlot];
    if (!slot) return [];

    return employees.filter(employee => {
      const dayOfWeek = this.getDayOfWeek(date);
      const availability = employee.availability[dayOfWeek];

      if (!availability || !availability.available) return false;

      const empStart = availability.startTime || '00:00';
      const empEnd = availability.endTime || '23:59';

      return this.timesOverlap(slot.start, slot.end, empStart, empEnd);
    });
  }

  /**
   * Calculate employee availability consistency
   * @param {Object} employee - Employee object
   * @returns {number} Consistency score (0-100, higher is more consistent)
   */
  calculateAvailabilityConsistency(employee) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    let totalScore = 0;
    let availableDays = 0;

    days.forEach(day => {
      const availability = employee.availability[day];
      if (availability && availability.available) {
        availableDays++;
        // Score based on how specific the availability is
        const hasStartTime = availability.startTime ? 1 : 0;
        const hasEndTime = availability.endTime ? 1 : 0;
        const hasPreferredTimes = (availability.preferredStart && availability.preferredEnd) ? 1 : 0;
        totalScore += (hasStartTime + hasEndTime + hasPreferredTimes) / 3;
      }
    });

    if (availableDays === 0) return 0;

    return (totalScore / availableDays) * 100;
  }
}

module.exports = new AvailabilityMatcher();
