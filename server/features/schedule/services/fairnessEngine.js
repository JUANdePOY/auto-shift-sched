const db = require('../../../shared/config/database');

/**
 * Fairness Engine
 * Handles tracking and calculating employee schedule fairness
 */
class FairnessEngine {
  constructor() {
    this.assignmentCache = new Map();
  }

  /**
   * Get employee's past stations from assignments
   * @param {number} employeeId - Employee ID
   * @param {Array} pastAssignments - Past assignments array
   * @returns {Array} Array of station names
   */
  getPastStationsForEmployee(employeeId, pastAssignments) {
    const employeeAssignments = pastAssignments.filter(a => a.employeeId === employeeId);
    const stations = new Set();

    employeeAssignments.forEach(assignment => {
      if (assignment.requiredStations && Array.isArray(assignment.requiredStations)) {
        assignment.requiredStations.forEach(station => stations.add(station));
      }
    });

    return Array.from(stations);
  }

  /**
   * Get employee's past week assignments
   * @param {number} employeeId - Employee ID
   * @param {string} currentWeekStart - Current week start date (YYYY-MM-DD)
   * @returns {Promise<Object>} Past week assignment data
   */
  async getPastWeekAssignments(employeeId, currentWeekStart) {
    try {
      // Calculate past week start (7 days before current week start)
      const pastWeekStart = new Date(currentWeekStart);
      pastWeekStart.setDate(pastWeekStart.getDate() - 7);
      const pastWeekStartStr = pastWeekStart.toISOString().split('T')[0];

      const pastWeekEnd = new Date(currentWeekStart);
      pastWeekEnd.setDate(pastWeekEnd.getDate() - 1);
      const pastWeekEndStr = pastWeekEnd.toISOString().split('T')[0];

      // Query past week assignments
      const [assignments] = await db.query(`
        SELECT sa.*, s.startTime, s.endTime, s.title
        FROM schedule_assignments sa
        JOIN shifts s ON sa.shift_id = s.id
        WHERE sa.employee_id = ? AND sa.assignment_date BETWEEN ? AND ?
        ORDER BY sa.assignment_date, s.startTime
      `, [employeeId, pastWeekStartStr, pastWeekEndStr]);

      // Calculate total hours and shift count
      let totalHours = 0;
      const shiftsByDay = {};
      const stationsAssigned = new Set();

      assignments.forEach(assignment => {
        const shiftHours = this.calculateShiftHours(assignment.startTime, assignment.endTime);
        totalHours += shiftHours;

        const day = assignment.assignment_date;
        if (!shiftsByDay[day]) shiftsByDay[day] = [];
        shiftsByDay[day].push(assignment);

        // Track stations (if available in shift data)
        if (assignment.requiredStation) {
          const stations = Array.isArray(assignment.requiredStation)
            ? assignment.requiredStation
            : [assignment.requiredStation];
          stations.forEach(station => stationsAssigned.add(station));
        }
      });

      return {
        totalHours,
        shiftCount: assignments.length,
        shiftsByDay,
        stationsAssigned: Array.from(stationsAssigned),
        restDays: this.calculateRestDays(assignments, pastWeekStartStr, pastWeekEndStr)
      };
    } catch (error) {
      console.error(`Error fetching past week assignments for employee ${employeeId}:`, error);
      return {
        totalHours: 0,
        shiftCount: 0,
        shiftsByDay: {},
        stationsAssigned: [],
        restDays: 7
      };
    }
  }

  /**
   * Get employee's current week assignments (during scheduling)
   * @param {number} employeeId - Employee ID
   * @param {Array} currentAssignments - Current assignments being made
   * @returns {Object} Current week assignment data
   */
  getCurrentWeekAssignments(employeeId, currentAssignments) {
    const employeeAssignments = currentAssignments.filter(a => a.employeeId === employeeId);

    let totalHours = 0;
    const shiftsByDay = {};
    const stationsAssigned = new Set();

    employeeAssignments.forEach(assignment => {
      const shiftHours = this.calculateShiftHours(assignment.startTime, assignment.endTime);
      totalHours += shiftHours;

      const day = assignment.date;
      if (!shiftsByDay[day]) shiftsByDay[day] = [];
      shiftsByDay[day].push(assignment);

      // Track stations if available
      if (assignment.requiredStations) {
        assignment.requiredStations.forEach(station => stationsAssigned.add(station));
      }
    });

    return {
      totalHours,
      shiftCount: employeeAssignments.length,
      shiftsByDay,
      stationsAssigned: Array.from(stationsAssigned)
    };
  }

  /**
   * Calculate fairness score for an employee
   * Lower score = more fair (less scheduled, needs more assignments)
   * @param {Object} pastWeekData - Past week assignment data
   * @param {Object} currentWeekData - Current week assignment data
   * @param {number} maxHoursPerWeek - Maximum hours allowed per week
   * @returns {number} Fairness score (0-100, lower is better)
   */
  calculateFairnessScore(pastWeekData, currentWeekData, maxHoursPerWeek = 48) {
    const totalHours = pastWeekData.totalHours + currentWeekData.totalHours;
    const utilizationRate = totalHours / maxHoursPerWeek;

    // Base score from utilization (lower utilization = lower score = more fair)
    let score = utilizationRate * 100;

    // Bonus for rest days (more rest days = lower score)
    const restDayBonus = pastWeekData.restDays * 5; // 5 points per rest day
    score -= restDayBonus;

    // Penalty for consecutive days worked
    const consecutivePenalty = this.calculateConsecutiveDaysPenalty(pastWeekData.shiftsByDay);
    score += consecutivePenalty;

    // Ensure score is between 0-100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate shift hours from start and end times
   * @param {string} startTime - Start time (HH:MM:SS or HH:MM)
   * @param {string} endTime - End time (HH:MM:SS or HH:MM)
   * @returns {number} Hours worked
   */
  calculateShiftHours(startTime, endTime) {
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    return (end - start) / (1000 * 60 * 60); // Convert ms to hours
  }

  /**
   * Calculate rest days in a period
   * @param {Array} assignments - Assignment records
   * @param {string} startDate - Period start date
   * @param {string} endDate - Period end date
   * @returns {number} Number of rest days
   */
  calculateRestDays(assignments, startDate, endDate) {
    const workedDays = new Set(assignments.map(a => a.assignment_date));
    const totalDays = this.getDaysBetween(startDate, endDate) + 1;
    return totalDays - workedDays.size;
  }

  /**
   * Calculate penalty for consecutive days worked
   * @param {Object} shiftsByDay - Shifts grouped by day
   * @returns {number} Penalty points
   */
  calculateConsecutiveDaysPenalty(shiftsByDay) {
    const days = Object.keys(shiftsByDay).sort();
    let maxConsecutive = 0;
    let currentConsecutive = 0;

    for (let i = 0; i < days.length; i++) {
      const currentDay = new Date(days[i]);
      const nextDay = i < days.length - 1 ? new Date(days[i + 1]) : null;

      if (shiftsByDay[days[i]].length > 0) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }

      // Break consecutive count if there's a gap
      if (nextDay) {
        const dayDiff = (nextDay - currentDay) / (1000 * 60 * 60 * 24);
        if (dayDiff > 1) {
          currentConsecutive = 0;
        }
      }
    }

    // Penalty increases with consecutive days (max 20 points for 7+ consecutive days)
    return Math.min(20, maxConsecutive * 3);
  }

  /**
   * Get number of days between two dates
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {number} Number of days
   */
  getDaysBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.floor((end - start) / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if employee can work additional hours
   * @param {Object} pastWeekData - Past week data
   * @param {Object} currentWeekData - Current week data
   * @param {number} shiftHours - Hours for new shift
   * @param {number} maxHoursPerWeek - Max hours per week
   * @returns {boolean} Can work additional hours
   */
  canWorkAdditionalHours(pastWeekData, currentWeekData, shiftHours, maxHoursPerWeek = 48) {
    const totalHours = pastWeekData.totalHours + currentWeekData.totalHours + shiftHours;
    return totalHours <= maxHoursPerWeek;
  }

  /**
   * Get employee workload summary
   * @param {number} employeeId - Employee ID
   * @param {string} currentWeekStart - Current week start
   * @param {Array} currentAssignments - Current assignments
   * @returns {Promise<Object>} Workload summary
   */
  async getEmployeeWorkloadSummary(employeeId, currentWeekStart, currentAssignments) {
    const pastWeekData = await this.getPastWeekAssignments(employeeId, currentWeekStart);
    const currentWeekData = this.getCurrentWeekAssignments(employeeId, currentAssignments);

    return {
      pastWeek: pastWeekData,
      currentWeek: currentWeekData,
      totalHours: pastWeekData.totalHours + currentWeekData.totalHours,
      fairnessScore: this.calculateFairnessScore(pastWeekData, currentWeekData)
    };
  }
}

module.exports = new FairnessEngine();
