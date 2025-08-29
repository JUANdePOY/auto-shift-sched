const db = require('../config/database');
const { formatEmployee, formatShift } = require('./formatUtils');

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
   * @param {number} count - Number of suggestions to return
   * @returns {Promise<Array>} Ranked employee suggestions
   */
  async getEmployeeSuggestions(shiftId, count = 5) {
    try {
      // Get shift details
      const shift = await this.getShift(shiftId);
      if (!shift) {
        throw new Error('Shift not found');
      }

      // Get all employees
      const employees = await this.getEmployees();

      // Filter available employees
      const availableEmployees = this.filterAvailableEmployees(employees, shift);

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
    const [results] = await db.promise().query('SELECT * FROM shifts WHERE id = ?', [shiftId]);
    return results.length > 0 ? formatShift(results[0]) : null;
  }

  /**
   * Get all employees
   */
  async getEmployees() {
    const [results] = await db.promise().query('SELECT * FROM employees');
    return results.map(employee => formatEmployee(employee));
  }

  /**
   * Filter employees available for the shift
   */
  filterAvailableEmployees(employees, shift) {
    return employees.filter(employee => {
      // Check availability for the shift day
      const dayOfWeek = this.getDayOfWeek(shift.date);
      const availability = employee.availability[dayOfWeek];
      
      if (!availability || !availability.available) {
        return false;
      }

      // Check if employee has required skills
      if (shift.requiredSkills.length > 0) {
        const hasRequiredSkills = shift.requiredSkills.every(skill => 
          employee.skills.includes(skill)
        );
        if (!hasRequiredSkills) return false;
      }

      // Check if shift time falls within availability
      if (availability.preferredStart && availability.preferredEnd) {
        const shiftStart = new Date(`1970-01-01T${shift.startTime}`);
        const shiftEnd = new Date(`1970-01-01T${shift.endTime}`);
        const preferredStart = new Date(`1970-01-01T${availability.preferredStart}`);
        const preferredEnd = new Date(`1970-01-01T${availability.preferredEnd}`);

        if (shiftStart < preferredStart || shiftEnd > preferredEnd) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Calculate overall suitability score
   */
  calculateSuitabilityScore(employee, shift) {
    let score = 0;

    // Skill matching (40%)
    const skillMatch = this.calculateSkillMatch(employee.skills, shift.requiredSkills);
    score += skillMatch * this.weights.skillMatch * 100;

    // Availability alignment (30%)
    const availabilityScore = this.calculateAvailabilityScore(employee, shift);
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
   */
  calculateAvailabilityScore(employee, shift) {
    const dayOfWeek = this.getDayOfWeek(shift.date);
    const availability = employee.availability[dayOfWeek];
    
    if (!availability.preferredStart || !availability.preferredEnd) {
      return 0.7; // Good score if available but no preferences
    }

    const shiftStart = new Date(`1970-01-01T${shift.startTime}`);
    const shiftEnd = new Date(`1970-01-01T${shift.endTime}`);
    const preferredStart = new Date(`1970-01-01T${availability.preferredStart}`);
    const preferredEnd = new Date(`1970-01-01T${availability.preferredEnd}`);

    // Perfect match if shift falls exactly within preferred range
    if (shiftStart >= preferredStart && shiftEnd <= preferredEnd) {
      return 1.0;
    }

    // Calculate overlap percentage
    const overlap = Math.max(0, Math.min(shiftEnd, preferredEnd) - Math.max(shiftStart, preferredStart));
    const totalDuration = shiftEnd - shiftStart;
    
    return Math.min(overlap / totalDuration, 0.9); // Cap at 0.9 for partial matches
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
    
    return roleScores[employee.role.toLowerCase()] || 0.6;
  }

  /**
   * Get detailed reasons for the suggestion
   */
  getSuggestionReasons(employee, shift) {
    const reasons = [];

    // Skill match reason
    const skillMatch = this.calculateSkillMatch(employee.skills, shift.requiredSkills);
    if (skillMatch === 1) {
      reasons.push('Perfect skill match');
    } else if (skillMatch >= 0.8) {
      reasons.push('Excellent skill match');
    } else if (skillMatch >= 0.6) {
      reasons.push('Good skill match');
    }

    // Availability reason
    const availabilityScore = this.calculateAvailabilityScore(employee, shift);
    if (availabilityScore === 1) {
      reasons.push('Perfect availability match');
    } else if (availabilityScore >= 0.9) {
      reasons.push('Excellent availability');
    }

    // Workload reason
    const utilization = employee.currentWeeklyHours / employee.maxHoursPerWeek;
    if (utilization < 0.3) {
      reasons.push('Underutilized - good for balance');
    } else if (utilization < 0.6) {
      reasons.push('Good workload balance');
    }

    // Experience reason
    if (employee.role.toLowerCase() === 'manager' || employee.role.toLowerCase() === 'supervisor') {
      reasons.push('Leadership role');
    }

    return reasons;
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
   * Get replacement suggestions for absent employees
   */
  async getReplacementSuggestions(shiftId, absentEmployeeId) {
    const suggestions = await this.getEmployeeSuggestions(shiftId, 3);
    
    return suggestions.map(suggestion => ({
      ...suggestion,
      replacementFor: absentEmployeeId,
      confidence: Math.min(95, suggestion.score) // Cap confidence at 95%
    }));
  }
}

module.exports = new SuggestionEngine();
