const db = require('../../../shared/config/database');
const { formatEmployee, formatShift } = require('../../../shared/utils/formatUtils');
const StationManager = require('../../schedule/services/stationManager');
const availabilityService = require('../../availability/services/availabilityService');

/**
 * AI Suggestion Engine for Manual Scheduling
 * Provides intelligent suggestions for employee assignments
 */
class SuggestionEngine {
  constructor() {
    this.weights = {
      skillMatch: 0.4,
      availability: 0.3,
      workloadBalance: 0.2,
      experience: 0.1
    };
  }

  /**
   * Get ranked suggestions for employees to assign to a shift
   * @param {string} shiftId - The shift ID
   * @param {string} date - The date for the shift assignment (YYYY-MM-DD)
   * @param {number} count - Number of suggestions to return
   * @param {string} shiftId - The shift ID
   * @param {string} date - The date for the shift assignment (YYYY-MM-DD)
   * @param {number} count - Number of suggestions to return
   * @returns {Promise<Array>} Ranked employee suggestions
   */
  async getEmployeeSuggestions(shiftId, date, count = 5) {
    try {
      // Get shift details
      const shift = await this.getShift(shiftId);
      if (!shift) {
        throw new Error('Shift not found');
      }

      // Set the date on the shift object since shifts are templates without dates
      shift.date = date;

      // Get employees with matching stations for better performance
      const employees = shift.requiredStation && shift.requiredStation.length > 0 
        ? await this.getEmployeesByStation(shift.requiredStation)
        : await this.getEmployees();

      // Filter available employees asynchronously checking availability for exact date and time
      const availableEmployees = [];
      for (const employee of employees) {
        // Check availability for exact shift date and time using availabilityService
        const availabilityCheck = await availabilityService.checkEmployeeAvailability(
          employee.id,
          shift.date,
          shift.startTime,
          shift.endTime
        );

        // Check if availability available (preferred time matching is bonus, not requirement)
        if (!availabilityCheck.available) {
          continue;
        }
        // Check if employee has any matching stations (more inclusive for suggestions)
        if (shift.requiredStation && shift.requiredStation.length > 0) {
          const hasAnyMatchingStation = this.hasAnyMatchingStation(employee, shift.requiredStation);
          if (!hasAnyMatchingStation) continue;
        }

        // Check if employee already assigned to this specific shift
        if (shift.assignedEmployees && shift.assignedEmployees.includes(employee.id.toString())) {
          continue;
        }

        // Check if employee is already assigned to any shift on this date
        if (await this.isEmployeeAlreadyAssigned(employee.id, shift.date)) {
          continue;
        }

        // Mark availability details on the employee for scoring
        employee.availabilitySubmitted = availabilityCheck.available;
        employee.availabilityPreferred = availabilityCheck.preferred;
        availableEmployees.push(employee);
      }

      // Rank employees by suitability
      const rankedSuggestions = availableEmployees
        .map(employee => ({
          employee,
          score: this.calculateSuitabilityScore(employee, shift),
          reasons: this.getSuggestionReasons(employee, shift)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, count);

      return rankedSuggestions;

    } catch (error) {
      console.error('Error generating suggestions:', error);
      throw error;
    }
  }

  /**
   * Get shift by ID
   */
  async getShift(shiftId) {
    const [results] = await db.query('SELECT * FROM shifts WHERE id = ?', [shiftId]);
    return results.length > 0 ? formatShift(results[0]) : null;
  }

  /**
   * Get all employees without availability fetched
   */
  async getEmployees() {
    const [results] = await db.query('SELECT * FROM employees');
    const employees = results.map(employee => formatEmployee(employee));
    return employees;
  }

  /**
   * Get employees by station directly from database
   * @param {Array} stations - Array of station names to match
   * @returns {Promise<Array>} Employees with matching stations
   */
  async getEmployeesByStation(stations) {
    if (!stations || stations.length === 0) {
      return await this.getEmployees();
    }

    // Flatten and normalize station names
    const flatStations = stations.flat().map(s => s.toLowerCase().trim());
    
    // Create LIKE conditions for each station
    const likeConditions = flatStations.map(() => 'LOWER(station) LIKE ?').join(' OR ');
    const likeParams = flatStations.map(station => `%${station}%`);

    const [results] = await db.query(
      `SELECT * FROM employees WHERE ${likeConditions}`,
      likeParams
    );
    
    return results.map(employee => formatEmployee(employee));
  }

  /**
   * Filter employees available for the shift
   * (Not used now, availability checked asynchronously in getEmployeeSuggestions)
   */
  filterAvailableEmployees() {
    throw new Error('filterAvailableEmployees is no longer used. Availability checked per employee asynchronously.');
  }

  /**
   * Calculate overall suitability score
   */
  calculateSuitabilityScore(employee, shift) {
    let score = 0;

    // Station matching (40%)
    const stationMatch = StationManager.calculateSkillMatchScore(employee, shift.requiredStation || []);
    score += (stationMatch / 100) * this.weights.skillMatch * 100;

    // Availability alignment (30%)
    let availabilityScore = 0.1; // Default low score if no availability
    if (employee.availabilitySubmitted && employee.availabilityPreferred !== false) {
      availabilityScore = 1.0;
    } else if (employee.availabilitySubmitted) {
      availabilityScore = 0.6;
    }
    score += availabilityScore * this.weights.availability * 100;

    // Workload balance (20%)
    const workloadScore = this.calculateWorkloadScore(employee);
    score += workloadScore * this.weights.workloadBalance * 100;

    // Experience/performance (10%)
    const experienceScore = this.calculateExperienceScore(employee);
    score += experienceScore * this.weights.experience * 100;

    return Math.round(score);
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
   * Calculate availability alignment score
   * (Not used, handled in calculateSuitabilityScore above)
   */
  calculateAvailabilityScore() {
    throw new Error('calculateAvailabilityScore is no longer used, availability score set in calculateSuitabilityScore.');
  }

  /**
   * Calculate workload balance score
   * Prefers employees with lower current utilization
   */
  calculateWorkloadScore(employee) {
    const utilization = employee.currentWeeklyHours / employee.maxHoursPerWeek;
    
    // Inverse relationship - lower utilization gets higher score
    return 1 - Math.min(utilization, 0.8); // Cap utilization at 80% for scoring
  }

  /**
   * Calculate experience score (placeholder)
   * Could be enhanced with actual performance data
   */
  calculateExperienceScore(employee) {
    // Simple scoring based on role and tenure assumptions
    const roleScores = {
      'manager': 0.9,
      'supervisor': 0.8,
      'senior': 0.7,
      'crew': 0.6,
      'trainee': 0.5
    };

    return roleScores[employee.role && employee.role.toLowerCase()] || 0.6;
  }

  /**
   * Get detailed reasons for the suggestion
   */
  getSuggestionReasons(employee, shift) {
    const reasons = [];

    // Station match reason
    const stationMatch = StationManager.calculateSkillMatchScore(employee, shift.requiredStation || []);
    if (stationMatch >= 90) {
      reasons.push('Perfect station match');
    } else if (stationMatch >= 70) {
      reasons.push('Excellent station match');
    } else if (stationMatch >= 50) {
      reasons.push('Good station match');
    }

    // Availability reason
    if (employee.availabilitySubmitted && employee.availabilityPreferred) {
      reasons.push('Matches day availability and time in/out of shift');
    } else if (employee.availabilitySubmitted) {
      reasons.push('Submitted availability but not preferred time');
    } else {
      reasons.push('Did not submit availability');
    }

    // Workload reason
    const utilization = employee.currentWeeklyHours / employee.maxHoursPerWeek;
    if (utilization < 0.3) {
      reasons.push('Underutilized - good for balance');
    } else if (utilization < 0.6) {
      reasons.push('Good workload balance');
    }

    return reasons;
  }

  /**
   * Check if employee is already assigned on a specific date
   * @param {number} employeeId - Employee ID
   * @param {string} date - Date string (YYYY-MM-DD)
   * @returns {boolean} True if already assigned
   */
  async isEmployeeAlreadyAssigned(employeeId, date) {
    try {
      // Check both schedule_assignments and final_schedule tables
      const [scheduleAssignments] = await db.query(
        'SELECT id FROM schedule_assignments WHERE employee_id = ? AND assignment_date = ? LIMIT 1',
        [employeeId, date]
      );

      if (scheduleAssignments.length > 0) {
        return true;
      }

      const [finalSchedule] = await db.query(
        'SELECT id FROM final_schedule WHERE employee_id = ? AND date_schedule = ? LIMIT 1',
        [employeeId, date]
      );

      return finalSchedule.length > 0;
    } catch (error) {
      console.warn(`Error checking assignments for employee ${employeeId} on ${date}:`, error.message);
      return false; // Assume not assigned if there's an error
    }
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
   * Check if employee has any matching station (more inclusive than hasRequiredSkills)
   * @param {Object} employee - Employee object with station skills
   * @param {Array} requiredStations - Required station names
   * @returns {boolean} Has any matching station
   */
  hasAnyMatchingStation(employee, requiredStations) {
    if (!requiredStations || requiredStations.length === 0) return true;

    // Get employee stations as array of strings
    let employeeStations = [];
    if (Array.isArray(employee.station)) {
      employeeStations = employee.station.flat().map(station => {
        if (typeof station === 'string') {
          return station.trim().toLowerCase();
        }
        if (typeof station === 'object' && station !== null && 'name' in station) {
          return typeof station.name === 'string' ? station.name.trim().toLowerCase() : '';
        }
        return String(station).trim().toLowerCase();
      });
    } else if (typeof employee.station === 'string') {
      employeeStations = employee.station.split(',').map(s => s.trim().toLowerCase());
    } else {
      employeeStations = String(employee.station || '').split(',').map(s => s.trim().toLowerCase());
    }

    // Remove empty strings
    employeeStations = employeeStations.filter(s => s !== '');

    // Flatten and clean up required stations
    const trimmedRequiredStations = requiredStations
      .flat()
      .filter(s => s != null && s !== '')
      .map(s => s.trim().toLowerCase());

    // Check for ANY matches (not all required)
    return trimmedRequiredStations.some(required =>
      employeeStations.some(empStation =>
        StationManager.normalizeStationName(empStation) === StationManager.normalizeStationName(required)
      )
    );
  }

  /**
   * Get the start of the week (Monday) for a given date
   * @param {string} dateString - Date string (YYYY-MM-DD)
   * @returns {string} Week start date string (YYYY-MM-DD)
   */
  getWeekStart(dateString) {
    const date = new Date(dateString);
    const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const weekStart = new Date(date.setDate(diff));
    return weekStart.toISOString().split('T')[0];
  }

  /**
   * Get replacement suggestions for absent employees
   */
  async getReplacementSuggestions(shiftId, absentEmployeeId, date) {
    const suggestions = await this.getEmployeeSuggestions(shiftId, date, 3);

    return suggestions.map(suggestion => ({
      ...suggestion,
      replacementFor: absentEmployeeId,
      confidence: Math.min(95, suggestion.score) // Cap confidence at 95%
    }));
  }

  /**
   * Get top 3 suggestions for employees not already assigned to any shift on the given date
   * @param {string} shiftId - The shift ID
   * @param {string} date - The date for the shift assignment (YYYY-MM-DD)
   * @returns {Promise<Array>} Top 3 unassigned employee suggestions
   */
  async getTopUnassignedSuggestions(shiftId, date) {
    try {
      // Get all suggestions (more than 3 to account for filtering)
      const allSuggestions = await this.getEmployeeSuggestions(shiftId, date, 10);

      // Filter out employees already assigned to any shift on this date
      const unassignedSuggestions = [];
      for (const suggestion of allSuggestions) {
        const isAssigned = await this.isEmployeeAlreadyAssigned(suggestion.employee.id, date);
        if (!isAssigned) {
          unassignedSuggestions.push(suggestion);
          if (unassignedSuggestions.length >= 3) break; // Stop once we have 3
        }
      }

      return unassignedSuggestions;
    } catch (error) {
      console.error('Error generating unassigned suggestions:', error);
      throw error;
    }
  }
}

module.exports = new SuggestionEngine();
module.exports = new SuggestionEngine();
