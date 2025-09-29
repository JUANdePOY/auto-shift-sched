const db = require('../../../shared/config/database');
const { formatEmployee, formatShift } = require('../../../shared/utils/formatUtils');

/**
 * Constraint-Based Shift Scheduler
 * Automatically assigns employees to shifts based on availability, skills, and constraints
 */
class ShiftScheduler {
  constructor() {
    this.rules = {
      maxHoursPerWeek: 48,
      minRestDays: 2,
      noDoubleShifts: true,
      skillMatching: true
    };
  }

  /**
   * Generate automated schedule for a date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Object>} Generated schedule with assignments
   */
  async generateSchedule(startDate, endDate) {
    try {
      // Fetch all employees and shift templates
      const [employees, shiftTemplates] = await Promise.all([
        this.getEmployees(startDate),
        this.getShiftTemplates()
      ]);

      // Reset employee weekly hours for fresh calculation
      employees.forEach(emp => emp.currentWeeklyHours = 0);

      // Sort shift templates by priority and time
      const sortedShifts = this.sortShifts(shiftTemplates);

      // Generate dates in range
      const dates = this.getDatesInRange(startDate, endDate);

      // Assign employees to shifts for each date
      const assignments = [];
      const conflicts = [];

      for (const date of dates) {
        for (const shift of sortedShifts) {
          // Create a shift instance for this date
          const shiftWithDate = { ...shift, date };

          const availableEmployees = this.findAvailableEmployees(employees, shiftWithDate);

          if (availableEmployees.length === 0) {
            conflicts.push({
              type: 'no_available_employees',
              shiftId: shift.id,
              date: date,
              message: `No available employees for ${shift.title} on ${date}`
            });
            continue;
          }

          // Rank employees by suitability
          const rankedEmployees = this.rankEmployees(availableEmployees, shiftWithDate);

          // Assign top-ranked employees
          const assigned = this.assignEmployeesToShift(rankedEmployees, shiftWithDate);
          assignments.push(...assigned);

          // Update employee hours
          assigned.forEach(assignment => {
            const employee = employees.find(emp => emp.id === assignment.employeeId);
            if (employee) {
              const shiftHours = this.calculateShiftHours(shift);
              employee.currentWeeklyHours += shiftHours;
            }
          });
        }
      }

      return {
        assignments,
        conflicts,
        coverageRate: this.calculateCoverageRate(sortedShifts, assignments),
        totalShifts: sortedShifts.length * dates.length,
        assignedShifts: assignments.length
      };

    } catch (error) {
      console.error('Error generating schedule:', error);
      throw error;
    }
  }

  /**
   * Get all employees from database with their submitted availability for the week
   */
  async getEmployees(startDate) {
    const [results] = await db.promise().query('SELECT * FROM employees');
    const employees = results.map(employee => formatEmployee(employee));

    // Calculate week start for availability lookup (Monday of the week containing startDate)
    const weekStartStr = this.getWeekStart(startDate);

    // Fetch submitted availability for each employee for this week
    for (const employee of employees) {
      try {
        const availabilityService = require('../../availability/services/availabilityService');
        const submittedAvailability = await availabilityService.getAvailability(employee.id, weekStartStr);

        // Override default availability with submitted availability if available
        if (submittedAvailability && submittedAvailability.availability) {
          employee.availability = submittedAvailability.availability;
        }
      } catch (error) {
        console.warn(`Could not fetch availability for employee ${employee.id}, using default:`, error.message);
        // Keep default availability from employee record
      }
    }

    return employees;
  }

  /**
   * Get week start date (Monday) for a given date
   */
  getWeekStart(dateString) {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
    const weekStart = new Date(date);
    weekStart.setDate(diff);
    return weekStart.toISOString().split('T')[0];
  }

  /**
   * Get all available shift templates (shifts without date)
   */
  async getShiftTemplates() {
    const query = 'SELECT * FROM shifts';
    const [results] = await db.promise().query(query);
    return results.map(shift => formatShift(shift));
  }

  /**
   * Sort shifts by priority and time
   */
  sortShifts(shifts) {
    return shifts.sort((a, b) => {
      // First by priority (high first)
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }

      // Then by start time
      return new Date(`1970-01-01T${a.startTime}`) - new Date(`1970-01-01T${b.startTime}`);
    });
  }

  /**
   * Get all dates in a date range
   */
  getDatesInRange(startDate, endDate) {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
  }

  /**
   * Find employees available for a shift
   */
  findAvailableEmployees(employees, shift) {
    return employees.filter(employee => {
      // Check availability for the shift day
      const dayOfWeek = this.getDayOfWeek(shift.date);
      const availability = employee.availability[dayOfWeek];

      if (!availability || !availability.available) {
        return false;
      }

      // Check if employee has required skills
      if (this.rules.skillMatching && shift.requiredStation.length > 0) {
        const hasRequiredSkills = shift.requiredStation.every(station => 
          employee.station.includes(station)
        );
        if (!hasRequiredSkills) {
          return false;
        }
      }

      // Check max hours constraint
      const shiftHours = this.calculateShiftHours(shift);
      if (employee.currentWeeklyHours + shiftHours > employee.maxHoursPerWeek) {
        return false;
      }

      // Check no double shifts (if enabled)
      if (this.rules.noDoubleShifts) {
        // This would need to check existing assignments for the same day
        // For simplicity, we assume no existing assignments in this iteration
      }

      return true;
    });
  }

  /**
   * Rank employees by suitability for a shift
   */
  rankEmployees(employees, shift) {
    return employees.map(employee => {
      let score = 0;

      // Skill match bonus
      const skillMatch = this.calculateSkillMatch(employee.station, shift.requiredStation);
      score += skillMatch * 40;

      // Availability preference bonus
      const availabilityScore = this.calculateAvailabilityScore(employee, shift);
      score += availabilityScore * 30;

      // Fairness - prefer underutilized employees
      const utilization = employee.currentWeeklyHours / employee.maxHoursPerWeek;
      score += (1 - utilization) * 20;

      // Seniority/experience bonus (placeholder)
      score += 10;

      return { employee, score };
    })
    .sort((a, b) => b.score - a.score);
  }

  /**
   * Assign employees to shift based on ranking
   */
  assignEmployeesToShift(rankedEmployees, shift) {
    const assignments = [];
    const employeesNeeded = shift.requiredEmployees - shift.assignedEmployees.length;
    
    for (let i = 0; i < Math.min(employeesNeeded, rankedEmployees.length); i++) {
      const { employee } = rankedEmployees[i];
      assignments.push({
        shiftId: shift.id,
        employeeId: employee.id,
        employeeName: employee.name,
        shiftTitle: shift.title,
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime
      });
    }

    return assignments;
  }

  /**
   * Calculate skill match percentage
   */
  calculateSkillMatch(employeeStation, requiredStation) {
    if (requiredStation.length === 0) return 1;

    const matchedStations = requiredStation.filter(station =>
      employeeStation.includes(station)
    ).length;

    return matchedStations / requiredStation.length;
  }

  /**
   * Calculate availability score based on preferred times
   */
  calculateAvailabilityScore(employee, shift) {
    const dayOfWeek = this.getDayOfWeek(shift.date);
    const availability = employee.availability[dayOfWeek];
    
    if (!availability.preferredStart || !availability.preferredEnd) {
      return 0.5; // Neutral score if no preferences
    }

    const shiftStart = new Date(`1970-01-01T${shift.startTime}`);
    const shiftEnd = new Date(`1970-01-01T${shift.endTime}`);
    const preferredStart = new Date(`1970-01-01T${availability.preferredStart}`);
    const preferredEnd = new Date(`1970-01-01T${availability.preferredEnd}`);

    // Check if shift falls within preferred range
    if (shiftStart >= preferredStart && shiftEnd <= preferredEnd) {
      return 1.0; // Perfect match
    }

    // Partial match calculation
    const overlap = Math.max(0, Math.min(shiftEnd, preferredEnd) - Math.max(shiftStart, preferredStart));
    const totalDuration = shiftEnd - shiftStart;
    
    return overlap / totalDuration;
  }

  /**
   * Calculate shift duration in hours
   */
  calculateShiftHours(shift) {
    const start = new Date(`1970-01-01T${shift.startTime}`);
    const end = new Date(`1970-01-01T${shift.endTime}`);
    return (end - start) / (1000 * 60 * 60); // Convert ms to hours
  }

  /**
   * Get day of week from date string
   */
  getDayOfWeek(dateString) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const date = new Date(dateString);
    return days[date.getDay()];
  }

  /**
   * Calculate coverage rate percentage
   */
  calculateCoverageRate(shifts, assignments) {
    const totalRequired = shifts.reduce((sum, shift) => sum + shift.requiredEmployees, 0);
    const totalAssigned = assignments.length;
    return Math.round((totalAssigned / totalRequired) * 100);
  }
}

module.exports = new ShiftScheduler();
