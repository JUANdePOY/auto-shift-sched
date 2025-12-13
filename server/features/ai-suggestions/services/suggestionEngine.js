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
   * @returns {Promise<Array>} Ranked employee suggestions
   */
  async getEmployeeSuggestions(shiftId, date, count = 5) {
    try {
      console.log(`[DEBUG] Getting suggestions for shift ${shiftId} on date ${date}`);

      // Get shift details
      const shift = await this.getShift(shiftId);
      if (!shift) {
        throw new Error('Shift not found');
      }

      console.log(`[DEBUG] Shift details:`, {
        id: shift.id,
        title: shift.title,
        requiredStation: shift.requiredStation,
        startTime: shift.startTime,
        endTime: shift.endTime
      });

      // Set the date on the shift object since shifts are templates without dates
      shift.date = date;
      const weekStart = this.getWeekStart(date);

      // Get employees with matching stations for better performance
      const employees = shift.requiredStation && shift.requiredStation.length > 0
        ? await this.getEmployeesByStation(shift.requiredStation)
        : await this.getEmployees();

      console.log(`[DEBUG] Found ${employees.length} employees to consider`);
      console.log(`[DEBUG] Employee stations:`, employees.map(e => ({ id: e.id, name: e.name, station: e.station })));

      // Get past week assignments for workload balancing
      const pastWeekAssignments = await this.getPastWeekAssignments(weekStart);
      const currentWeekAssignments = await this.getCurrentWeekAssignments(weekStart, date);

      // Filter available employees asynchronously checking availability for exact date and time
      const availableEmployees = [];
      for (const employee of employees) {
        console.log(`[DEBUG] Checking employee ${employee.id} (${employee.name})`);

        // Check availability for exact shift date and time using availabilityService
        const availabilityCheck = await availabilityService.checkEmployeeAvailability(
          employee.id,
          shift.date,
          shift.startTime,
          shift.endTime
        );

        console.log(`[DEBUG] Availability check for ${employee.name}:`, availabilityCheck);

        // Check if availability available (preferred time matching is bonus, not requirement)
        if (!availabilityCheck.available) {
          console.log(`[DEBUG] Skipping ${employee.name} - not available`);
          continue;
        }

        // Check if employee has any matching stations (more inclusive for suggestions)
        if (shift.requiredStation && shift.requiredStation.length > 0) {
          const hasAnyMatchingStation = this.hasAnyMatchingStation(employee, shift.requiredStation);
          console.log(`[DEBUG] Station match for ${employee.name}: ${hasAnyMatchingStation} (required: ${shift.requiredStation})`);
          if (!hasAnyMatchingStation) {
            console.log(`[DEBUG] Skipping ${employee.name} - no station match`);
            continue;
          }
        }

        // Check if employee already assigned to this specific shift
        if (shift.assignedEmployees && shift.assignedEmployees.includes(employee.id.toString())) {
          console.log(`[DEBUG] Skipping ${employee.name} - already assigned to this shift`);
          continue;
        }

        // Check if employee is already assigned to any shift on this date
        if (await this.isEmployeeAlreadyAssigned(employee.id, shift.date)) {
          console.log(`[DEBUG] Skipping ${employee.name} - already assigned on this date`);
          continue;
        }

        console.log(`[DEBUG] ${employee.name} passed all filters - adding to available employees`);

        // Mark availability details and workload data on the employee for scoring
        employee.availabilitySubmitted = availabilityCheck.available;
        employee.availabilityPreferred = availabilityCheck.preferred;
        employee.availability = availabilityCheck.available ? 'available' : 'not_available'; // Set availability string for rotation scoring
        employee.pastWeekHours = this.getEmployeePastWeekHours(employee.id, pastWeekAssignments);
        employee.currentWeekHours = this.getEmployeeCurrentWeekHours(employee.id, currentWeekAssignments);
        employee.pastWeekShiftTypes = this.getEmployeePastWeekShiftTypes(employee.id, pastWeekAssignments);
        availableEmployees.push(employee);
      }

      console.log(`[DEBUG] Final available employees: ${availableEmployees.length}`, availableEmployees.map(e => ({ id: e.id, name: e.name })));

      // Sort employees by workload (prioritize those with less hours last week)
      availableEmployees.sort((a, b) => {
        const aTotal = (a.pastWeekHours || 0) + (a.currentWeekHours || 0);
        const bTotal = (b.pastWeekHours || 0) + (b.currentWeekHours || 0);
        return aTotal - bTotal; // Lower hours first
      });

      // Rank employees by suitability with enhanced scoring
      const rankedSuggestions = availableEmployees
        .map(employee => ({
          employee,
          score: this.calculateEnhancedSuitabilityScore(employee, shift),
          reasons: this.getEnhancedSuggestionReasons(employee, shift)
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
   * Get all non-admin employees without availability fetched
   */
  async getEmployees() {
    const [results] = await db.query('SELECT * FROM employees WHERE role != ?', ['admin']);
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

    // Get all non-admin employees and filter in JavaScript for better station matching
    const allEmployees = await this.getEmployees();

    // Flatten and normalize required station names
    const flatStations = stations.flat().map(s => s.toLowerCase().trim());

    // Filter employees who have any of the required stations
    const matchingEmployees = allEmployees.filter(employee => {
      if (!employee.station || !Array.isArray(employee.station)) return false;

      // Check if employee has any of the required stations (case-insensitive)
      return employee.station.some(empStation => {
        const normalizedEmpStation = empStation.toLowerCase().trim();
        return flatStations.some(requiredStation =>
          normalizedEmpStation.includes(requiredStation) || requiredStation.includes(normalizedEmpStation)
        );
      });
    });

    return matchingEmployees;
  }

  /**
   * Filter employees available for the shift
   * (Not used now, availability checked asynchronously in getEmployeeSuggestions)
   */
  filterAvailableEmployees() {
    throw new Error('filterAvailableEmployees is no longer used. Availability checked per employee asynchronously.');
  }

  /**
   * Calculate enhanced suitability score with improved workload balancing
   */
  calculateEnhancedSuitabilityScore(employee, shift) {
    let score = 0;

    // Station matching (35%)
    const stationMatch = StationManager.calculateSkillMatchScore(employee, shift.requiredStation || []);
    score += (stationMatch / 100) * 0.35 * 100;

    // Availability alignment (25%)
    let availabilityScore = 0.1; // Default low score if no availability
    if (employee.availabilitySubmitted && employee.availabilityPreferred !== false) {
      availabilityScore = 1.0;
    } else if (employee.availabilitySubmitted) {
      availabilityScore = 0.6;
    }
    score += availabilityScore * 0.25 * 100;

    // Enhanced workload balance (30%) - prioritize employees with fewer hours last week
    const workloadScore = this.calculateEnhancedWorkloadScore(employee);
    score += workloadScore * 0.30 * 100;

    // Shift type rotation bonus (10%) - encourage variety in shift types
    const rotationScore = this.calculateShiftTypeRotationScore(employee, shift);
    score += rotationScore * 0.10 * 100;

    return Math.round(score);
  }

  /**
   * Calculate overall suitability score (legacy method)
   */
  calculateSuitabilityScore(employee, shift) {
    return this.calculateEnhancedSuitabilityScore(employee, shift);
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
   * Calculate enhanced workload balance score
   * Prioritizes employees with fewer hours last week, then current week
   */
  calculateEnhancedWorkloadScore(employee) {
    const pastWeekHours = employee.pastWeekHours || 0;
    const currentWeekHours = employee.currentWeekHours || 0;
    const maxHours = employee.maxHoursPerWeek || 40;
    
    // Calculate utilization for both weeks
    const pastWeekUtilization = pastWeekHours / maxHours;
    const currentWeekUtilization = currentWeekHours / maxHours;
    
    // Heavily favor employees with lower past week hours (60% weight)
    // Then consider current week hours (40% weight)
    const pastWeekScore = 1 - Math.min(pastWeekUtilization, 1.0);
    const currentWeekScore = 1 - Math.min(currentWeekUtilization, 0.8);
    
    return (pastWeekScore * 0.6) + (currentWeekScore * 0.4);
  }

  /**
   * Calculate workload balance score (legacy method)
   */
  calculateWorkloadScore(employee) {
    return this.calculateEnhancedWorkloadScore(employee);
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
   * Get enhanced detailed reasons for the suggestion
   */
  getEnhancedSuggestionReasons(employee, shift) {
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
      reasons.push('Matches day availability and preferred time');
    } else if (employee.availabilitySubmitted) {
      reasons.push('Available but not preferred time');
    } else {
      reasons.push('No availability submitted');
    }

    // Enhanced workload reasons with specific hour details
    const pastWeekHours = employee.pastWeekHours || 0;
    const currentWeekHours = employee.currentWeekHours || 0;
    const totalWeeklyHours = pastWeekHours + currentWeekHours;
    
    if (pastWeekHours < 20) {
      reasons.push(`Had ${pastWeekHours.toFixed(1)}h last week - good for balance`);
    } else if (pastWeekHours < 35) {
      reasons.push(`Worked ${pastWeekHours.toFixed(1)}h last week - moderate load`);
    } else {
      reasons.push(`Worked ${pastWeekHours.toFixed(1)}h last week - high load`);
    }
    
    if (currentWeekHours < 15) {
      reasons.push(`Currently ${currentWeekHours.toFixed(1)}h this week - low hours`);
    } else if (currentWeekHours < 30) {
      reasons.push(`Currently ${currentWeekHours.toFixed(1)}h this week - moderate hours`);
    } else {
      reasons.push(`Currently ${currentWeekHours.toFixed(1)}h this week - high hours`);
    }
    
    // Add total hours context
    if (totalWeeklyHours < 25) {
      reasons.push(`Total ${totalWeeklyHours.toFixed(1)}h - well below 40h limit`);
    } else if (totalWeeklyHours < 35) {
      reasons.push(`Total ${totalWeeklyHours.toFixed(1)}h - good workload balance`);
    } else if (totalWeeklyHours < 40) {
      reasons.push(`Total ${totalWeeklyHours.toFixed(1)}h - approaching full-time`);
    } else {
      reasons.push(`Total ${totalWeeklyHours.toFixed(1)}h - at/over 40h limit`);
    }

    // Shift type rotation reason
    const pastShiftTypes = employee.pastWeekShiftTypes || [];
    const shiftType = this.getShiftType(shift.startTime);
    if (!pastShiftTypes.includes(shiftType)) {
      reasons.push(`Good variety - hasn't worked ${shiftType} shifts recently`);
    } else if (pastShiftTypes.filter(t => t === shiftType).length >= 3) {
      reasons.push(`Worked many ${shiftType} shifts last week`);
    }

    return reasons;
  }

  /**
   * Get detailed reasons for the suggestion (legacy method)
   */
  getSuggestionReasons(employee, shift) {
    return this.getEnhancedSuggestionReasons(employee, shift);
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
   * Calculate shift type rotation score
   * Encourages variety in shift types for employees with 'anytime' availability
   */
  calculateShiftTypeRotationScore(employee, shift) {
    const pastShiftTypes = employee.pastWeekShiftTypes || [];
    const shiftType = this.getShiftType(shift.startTime);
    
    // If employee has 'anytime' availability, encourage rotation
    if (employee.availability && employee.availability.toLowerCase().includes('anytime')) {
      const typeCount = pastShiftTypes.filter(t => t === shiftType).length;
      
      // Higher score for less frequent shift types
      if (typeCount === 0) return 1.0; // Haven't worked this type recently
      if (typeCount === 1) return 0.8; // Worked once
      if (typeCount === 2) return 0.6; // Worked twice
      return 0.3; // Worked 3+ times - discourage
    }
    
    // Default score for employees without anytime availability
    return 0.7;
  }

  /**
   * Get shift type based on start time
   */
  getShiftType(startTime) {
    const hour = parseInt(startTime.split(':')[0]);
    
    if (hour >= 5 && hour < 12) return 'opener';
    if (hour >= 12 && hour < 17) return 'mid';
    if (hour >= 17 && hour < 23) return 'closer';
    return 'graveyard';
  }

  /**
   * Get past week assignments for workload analysis
   */
  async getPastWeekAssignments(currentWeekStart) {
    try {
      const pastWeekStart = new Date(currentWeekStart);
      pastWeekStart.setDate(pastWeekStart.getDate() - 7);
      const pastWeekStartStr = pastWeekStart.toISOString().split('T')[0];
      
      const pastWeekEnd = new Date(currentWeekStart);
      pastWeekEnd.setDate(pastWeekEnd.getDate() - 1);
      const pastWeekEndStr = pastWeekEnd.toISOString().split('T')[0];

      const [assignments] = await db.query(`
        SELECT sa.employee_id, s.startTime, s.endTime, s.title
        FROM schedule_assignments sa
        JOIN shifts s ON sa.shift_id = s.id
        WHERE sa.assignment_date BETWEEN ? AND ?
      `, [pastWeekStartStr, pastWeekEndStr]);

      return assignments;
    } catch (error) {
      console.error('Error fetching past week assignments:', error);
      return [];
    }
  }

  /**
   * Get current week assignments for workload analysis
   */
  async getCurrentWeekAssignments(weekStart, currentDate) {
    try {
      const [assignments] = await db.query(`
        SELECT sa.employee_id, s.startTime, s.endTime, s.title
        FROM schedule_assignments sa
        JOIN shifts s ON sa.shift_id = s.id
        WHERE sa.assignment_date BETWEEN ? AND ? AND sa.assignment_date < ?
      `, [weekStart, this.getWeekEnd(weekStart), currentDate]);

      return assignments;
    } catch (error) {
      console.error('Error fetching current week assignments:', error);
      return [];
    }
  }

  /**
   * Get employee's past week hours
   */
  getEmployeePastWeekHours(employeeId, pastWeekAssignments) {
    const employeeAssignments = pastWeekAssignments.filter(a => a.employee_id === employeeId);
    return employeeAssignments.reduce((total, assignment) => {
      const hours = this.calculateShiftHours(assignment.startTime, assignment.endTime);
      return total + hours;
    }, 0);
  }

  /**
   * Get employee's current week hours
   */
  getEmployeeCurrentWeekHours(employeeId, currentWeekAssignments) {
    const employeeAssignments = currentWeekAssignments.filter(a => a.employee_id === employeeId);
    return employeeAssignments.reduce((total, assignment) => {
      const hours = this.calculateShiftHours(assignment.startTime, assignment.endTime);
      return total + hours;
    }, 0);
  }

  /**
   * Get employee's past week shift types
   */
  getEmployeePastWeekShiftTypes(employeeId, pastWeekAssignments) {
    const employeeAssignments = pastWeekAssignments.filter(a => a.employee_id === employeeId);
    return employeeAssignments.map(assignment => this.getShiftType(assignment.startTime));
  }

  /**
   * Calculate shift hours from start and end times
   */
  calculateShiftHours(startTime, endTime) {
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    return (end - start) / (1000 * 60 * 60); // Convert ms to hours
  }

  /**
   * Get the end of the week for a given week start
   */
  getWeekEnd(weekStart) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + 6);
    return date.toISOString().split('T')[0];
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
