/**
 * Station Manager
 * Handles station assignments, skill matching, and variety tracking
 */
class StationManager {
  constructor() {
    this.skillWeights = {
      primary: 1.0,    // Perfect match
      secondary: 0.8,  // Good match
      trained: 0.6,    // Can work but not preferred
      crossTrain: 0.4  // Can learn quickly
    };
  }

  /**
   * Check if employee has required station skills
   * @param {Object} employee - Employee object with station skills
   * @param {Array} requiredStations - Required station names
   * @returns {boolean} Has required skills
   */
  hasRequiredSkills(employee, requiredStations) {
    if (!requiredStations || requiredStations.length === 0) return true;

    const employeeStations = Array.isArray(employee.station)
      ? employee.station
      : [employee.station].filter(Boolean);

    return requiredStations.every(requiredStation =>
      employeeStations.some(empStation =>
        this.normalizeStationName(empStation) === this.normalizeStationName(requiredStation)
      )
    );
  }

  /**
   * Calculate skill match score for employee and shift
   * @param {Object} employee - Employee object
   * @param {Array} requiredStations - Required stations for shift
   * @param {Array} pastStations - Stations employee worked recently
   * @returns {number} Skill match score (0-100)
   */
  calculateSkillMatchScore(employee, requiredStations, pastStations = []) {
    if (!requiredStations || requiredStations.length === 0) return 100;

    const employeeStations = Array.isArray(employee.station)
      ? employee.station
      : [employee.station].filter(Boolean);

    let totalScore = 0;
    let matchedStations = 0;

    requiredStations.forEach(requiredStation => {
      const normalizedRequired = this.normalizeStationName(requiredStation);
      const match = employeeStations.find(empStation =>
        this.normalizeStationName(empStation) === normalizedRequired
      );

      if (match) {
        // Base skill match score
        const skillLevel = this.getSkillLevel(employee, match);
        totalScore += this.skillWeights[skillLevel] * 100;
        matchedStations++;
      }
    });

    if (matchedStations === 0) return 0;

    const averageScore = totalScore / requiredStations.length;

    // Bonus for variety (working different stations)
    const varietyBonus = this.calculateVarietyBonus(pastStations, requiredStations);
    const finalScore = Math.min(100, averageScore + varietyBonus);

    return finalScore;
  }

  /**
   * Get skill level for employee at a station
   * @param {Object} employee - Employee object
   * @param {string} station - Station name
   * @returns {string} Skill level
   */
  getSkillLevel(employee, station) {
    // This would typically come from employee skill data
    // For now, assume primary skill if they have the station
    const employeeStations = Array.isArray(employee.station)
      ? employee.station
      : [employee.station].filter(Boolean);

    const normalizedStation = this.normalizeStationName(station);
    const hasStation = employeeStations.some(empStation =>
      this.normalizeStationName(empStation) === normalizedStation
    );

    return hasStation ? 'primary' : 'crossTrain';
  }

  /**
   * Calculate variety bonus for working different stations
   * @param {Array} pastStations - Recently worked stations
   * @param {Array} newStations - New stations for shift
   * @returns {number} Variety bonus points
   */
  calculateVarietyBonus(pastStations, newStations) {
    if (!pastStations || pastStations.length === 0) return 10; // New employee bonus

    const recentStations = pastStations.slice(-5); // Last 5 stations
    const newNormalized = newStations.map(s => this.normalizeStationName(s));
    const recentNormalized = recentStations.map(s => this.normalizeStationName(s));

    const newStationsWorked = newNormalized.filter(station =>
      recentNormalized.includes(station)
    );

    // Bonus for working new stations
    const varietyRatio = (newStations.length - newStationsWorked.length) / newStations.length;
    return varietyRatio * 15; // Max 15 points for complete variety
  }

  /**
   * Group employees by station skills
   * @param {Array} employees - Array of employees
   * @returns {Object} Employees grouped by primary station
   */
  groupEmployeesByStations(employees) {
    const groups = {};

    employees.forEach(employee => {
      const employeeStations = Array.isArray(employee.station)
        ? employee.station
        : [employee.station].filter(Boolean);

      employeeStations.forEach(station => {
        const normalizedStation = this.normalizeStationName(station);
        if (!groups[normalizedStation]) {
          groups[normalizedStation] = [];
        }
        groups[normalizedStation].push(employee);
      });
    });

    return groups;
  }

  /**
   * Find best station matches for a shift
   * @param {Array} employees - Array of employees
   * @param {Array} requiredStations - Required stations
   * @param {Array} pastAssignments - Past assignments for variety tracking
   * @returns {Array} Employees sorted by station match score
   */
  findBestStationMatches(employees, requiredStations, pastAssignments = []) {
    return employees
      .filter(employee => this.hasRequiredSkills(employee, requiredStations))
      .map(employee => {
        // Get past stations for this employee
        const pastStations = this.getPastStationsForEmployee(employee.id, pastAssignments);

        return {
          employee,
          score: this.calculateSkillMatchScore(employee, requiredStations, pastStations)
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Get past stations worked by an employee
   * @param {number} employeeId - Employee ID
   * @param {Array} pastAssignments - Past assignments
   * @returns {Array} Past station names
   */
  getPastStationsForEmployee(employeeId, pastAssignments) {
    return pastAssignments
      .filter(assignment => assignment.employeeId === employeeId)
      .map(assignment => assignment.requiredStations || [])
      .flat()
      .filter(Boolean);
  }

  /**
   * Calculate station workload balance
   * @param {Array} assignments - Current assignments
   * @returns {Object} Station workload data
   */
  calculateStationWorkload(assignments) {
    const stationWorkload = {};

    assignments.forEach(assignment => {
      const stations = assignment.requiredStations || [];
      stations.forEach(station => {
        const normalizedStation = this.normalizeStationName(station);
        if (!stationWorkload[normalizedStation]) {
          stationWorkload[normalizedStation] = {
            totalAssignments: 0,
            uniqueEmployees: new Set()
          };
        }
        stationWorkload[normalizedStation].totalAssignments++;
        stationWorkload[normalizedStation].uniqueEmployees.add(assignment.employeeId);
      });
    });

    // Convert Sets to counts
    Object.keys(stationWorkload).forEach(station => {
      stationWorkload[station].uniqueEmployees = stationWorkload[station].uniqueEmployees.size;
    });

    return stationWorkload;
  }

  /**
   * Get station rotation recommendations
   * @param {Object} employee - Employee object
   * @param {Array} pastStations - Recently worked stations
   * @param {Array} availableStations - All available stations
   * @returns {Array} Recommended stations for variety
   */
  getStationRotationRecommendations(employee, pastStations, availableStations) {
    const employeeStations = Array.isArray(employee.station)
      ? employee.station
      : [employee.station].filter(Boolean);

    const recentStations = pastStations.slice(-3); // Last 3 stations
    const normalizedRecent = recentStations.map(s => this.normalizeStationName(s));

    // Recommend stations the employee can work but hasn't worked recently
    return availableStations.filter(station => {
      const normalizedStation = this.normalizeStationName(station);
      const canWorkStation = employeeStations.some(empStation =>
        this.normalizeStationName(empStation) === normalizedStation
      );
      const workedRecently = normalizedRecent.includes(normalizedStation);

      return canWorkStation && !workedRecently;
    });
  }

  /**
   * Normalize station name for consistent matching
   * @param {string} stationName - Station name
   * @returns {string} Normalized station name
   */
  normalizeStationName(stationName) {
    if (!stationName) return '';
    return stationName.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  }

  /**
   * Calculate cross-training opportunities
   * @param {Array} employees - All employees
   * @param {Array} assignments - Current assignments
   * @returns {Array} Cross-training recommendations
   */
  calculateCrossTrainingOpportunities(employees, assignments) {
    const stationWorkload = this.calculateStationWorkload(assignments);
    const recommendations = [];

    // Find stations with high workload and few employees
    Object.entries(stationWorkload).forEach(([station, data]) => {
      if (data.totalAssignments > 5 && data.uniqueEmployees < 3) {
        // Find employees who could be trained for this station
        const potentialTrainees = employees.filter(employee => {
          const employeeStations = Array.isArray(employee.station)
            ? employee.station
            : [employee.station].filter(Boolean);

          return !employeeStations.some(empStation =>
            this.normalizeStationName(empStation) === station
          );
        });

        if (potentialTrainees.length > 0) {
          recommendations.push({
            station,
            workload: data.totalAssignments,
            uniqueEmployees: data.uniqueEmployees,
            potentialTrainees: potentialTrainees.slice(0, 3) // Top 3 candidates
          });
        }
      }
    });

    return recommendations;
  }

  /**
   * Validate station assignment constraints
   * @param {Object} employee - Employee object
   * @param {Array} requiredStations - Required stations
   * @param {Object} constraints - Additional constraints
   * @returns {Object} Validation result
   */
  validateStationAssignment(employee, requiredStations, constraints = {}) {
    const result = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Check required skills
    if (!this.hasRequiredSkills(employee, requiredStations)) {
      result.valid = false;
      result.errors.push('Employee lacks required station skills');
    }

    // Check station workload limits
    if (constraints.maxAssignmentsPerStation) {
      // This would require current assignment data
      // Implementation depends on how assignments are tracked
    }

    // Check for station variety (avoid same station repeatedly)
    if (constraints.enforceVariety && constraints.pastStations) {
      const recentStations = constraints.pastStations.slice(-2);
      const repeatedStations = requiredStations.filter(station =>
        recentStations.includes(this.normalizeStationName(station))
      );

      if (repeatedStations.length > 0) {
        result.warnings.push(`Employee worked ${repeatedStations.join(', ')} recently`);
      }
    }

    return result;
  }
}

module.exports = new StationManager();
