const db = require('../config/database');
const { formatEmployee, formatShift } = require('./formatUtils');

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
      // Fetch all employees and shifts for the date range
      const [employees, shifts] = await Promise.all([
        this.getEmployees(),
        this.getShiftsInRange(startDate, endDate)
      ]);

      // Reset employee weekly hours for fresh calculation
      employees.forEach(emp => emp.currentWeeklyHours = 0);

      // Sort shifts by priority (high first) and time
      const sortedShifts = this.sortShifts(shifts);

      // Assign employees to shifts
      const assignments = [];
      const conflicts = [];

      for (const shift of sortedShifts) {
        const availableEmployees = this.findAvailableEmployees(employees, shift);
        
        if (availableEmployees.length === 0) {
          conflicts.push({
            type: 'no_available_employees',
            shiftId: shift.id,
            message: `No available employees for ${shift.title} on ${shift.date}`
          });
          continue;
        }

        // Rank employees by suitability
        const rankedEmployees = this.rankEmployees(availableEmployees, shift);
        
        // Assign top-ranked employees
        const assigned = this.assignEmployeesToShift(rankedEmployees, shift);
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

      return {
        assignments,
        conflicts,
        coverageRate: this.calculateCoverageRate(shifts, assignments),
        totalShifts: shifts.length,
        assignedShifts: assignments.length
      };

    } catch (error) {
      console.error('Error generating schedule:', error);
      throw error;
    }
  }

  /**
   * Get all employees from database
   */
  async getEmployees() {
    const [results] = await db.promise().query('SELECT * FROM employees');
    const formattedEmployees = results.map(employee => formatEmployee(employee));
    
    return formattedEmployees;
  }

  /**
   * Get shifts within date range
   */
  async getShiftsInRange(startDate, endDate) {
    const query = 'SELECT * FROM shifts WHERE date BETWEEN ? AND ?';
    const [results] = await db.promise().query(query, [startDate, endDate]);
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
      
      // Then by date and start time
      const dateCompare = new Date(a.date) - new Date(b.date);
      if (dateCompare !== 0) return dateCompare;
      
      return new Date(`1970-01-01T${a.startTime}`) - new Date(`1970-01-01T${b.startTime}`);
    });
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
      if (this.rules.skillMatching && shift.requiredSkills.length > 0) {
        const hasRequiredSkills = shift.requiredSkills.every(skill => 
          employee.skills.includes(skill)
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
      const skillMatch = this.calculateSkillMatch(employee.skills, shift.requiredSkills);
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
  calculateSkillMatch(employeeSkills, requiredSkills) {
    if (requiredSkills.length === 0) return 1;
    
    const matchedSkills = requiredSkills.filter(skill => 
      employeeSkills.includes(skill)
    ).length;
    
    return matchedSkills / requiredSkills.length;
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
