const FairnessEngine = require('./fairnessEngine');
const AvailabilityMatcher = require('./availabilityMatcher');
const StationManager = require('./stationManager');

/**
 * Employee Ranker
 * Combines multiple factors to rank employees for shift assignments
 */
class EmployeeRanker {
  constructor() {
    this.weights = {
      fairness: 0.35,      // Past/current week balance
      availability: 0.30,  // Time availability match
      stationSkill: 0.25,  // Station skill match
      variety: 0.10        // Station variety bonus
    };
  }

  /**
   * Rank employees for a specific shift
   * @param {Array} employees - Array of available employees
   * @param {Object} shift - Shift object
   * @param {string} weekStart - Week start date
   * @param {Array} currentAssignments - Current assignments being made
   * @param {Array} pastAssignments - Past assignments for context
   * @returns {Array} Ranked employees with scores and reasons
   */
  async rankEmployeesForShift(employees, shift, weekStart, currentAssignments = [], pastAssignments = []) {
    const rankings = [];

    for (const employee of employees) {
      const ranking = await this.calculateEmployeeScore(
        employee,
        shift,
        weekStart,
        currentAssignments,
        pastAssignments
      );
      rankings.push(ranking);
    }

    // Sort by total score (descending)
    rankings.sort((a, b) => b.totalScore - a.totalScore);

    return rankings;
  }

  /**
   * Calculate comprehensive score for an employee
   * @param {Object} employee - Employee object
   * @param {Object} shift - Shift object
   * @param {string} weekStart - Week start date
   * @param {Array} currentAssignments - Current assignments
   * @param {Array} pastAssignments - Past assignments
   * @returns {Object} Score breakdown
   */
  async calculateEmployeeScore(employee, shift, weekStart, currentAssignments, pastAssignments) {
    // Get workload data
    const workloadData = await FairnessEngine.getEmployeeWorkloadSummary(
      employee.id,
      weekStart,
      currentAssignments
    );

    // Calculate individual scores
    const fairnessScore = this.calculateFairnessComponent(workloadData);
    const availabilityScore = AvailabilityMatcher.calculateAvailabilityScore(employee, shift);
    const stationScore = StationManager.calculateSkillMatchScore(
      employee,
      shift.requiredStation || [],
      FairnessEngine.getPastStationsForEmployee(employee.id, pastAssignments)
    );
    const varietyScore = this.calculateVarietyComponent(employee, shift, pastAssignments);

    // Calculate weighted total
    const totalScore = (
      fairnessScore * this.weights.fairness +
      availabilityScore * this.weights.availability +
      stationScore * this.weights.stationSkill +
      varietyScore * this.weights.variety
    );

    // Generate reasoning
    const reasons = this.generateRankingReasons({
      fairnessScore,
      availabilityScore,
      stationScore,
      varietyScore,
      workloadData,
      employee,
      shift
    });

    return {
      employee,
      totalScore: Math.round(totalScore * 100) / 100, // Round to 2 decimal places
      componentScores: {
        fairness: Math.round(fairnessScore),
        availability: Math.round(availabilityScore),
        stationSkill: Math.round(stationScore),
        variety: Math.round(varietyScore)
      },
      reasons,
      workloadData
    };
  }

  /**
   * Calculate fairness component score
   * @param {Object} workloadData - Workload summary
   * @returns {number} Fairness score (0-100)
   */
  calculateFairnessComponent(workloadData) {
    // Invert fairness score - lower fairness score means more fair (needs more work)
    // Convert to 0-100 where higher means more deserving of assignment
    const invertedFairness = 100 - workloadData.fairnessScore;
    return Math.max(0, Math.min(100, invertedFairness));
  }

  /**
   * Calculate variety component score
   * @param {Object} employee - Employee object
   * @param {Object} shift - Shift object
   * @param {Array} pastAssignments - Past assignments
   * @returns {number} Variety score (0-100)
   */
  calculateVarietyComponent(employee, shift, pastAssignments) {
    const pastStations = FairnessEngine.getPastStationsForEmployee(employee.id, pastAssignments);
    const varietyBonus = StationManager.calculateVarietyBonus(pastStations, shift.requiredStation || []);

    // Base variety score
    let score = 50;

    // Add variety bonus
    score += varietyBonus;

    // Bonus for employees who haven't worked recently
    const recentAssignments = pastAssignments.filter(a =>
      a.employeeId === employee.id &&
      this.isRecentAssignment(a, shift.date)
    );

    if (recentAssignments.length === 0) {
      score += 20; // Bonus for employees who haven't worked this week
    } else if (recentAssignments.length <= 2) {
      score += 10; // Smaller bonus for light recent workload
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Check if assignment is recent (within last 3 days)
   * @param {Object} assignment - Assignment object
   * @param {string} currentDate - Current date
   * @returns {boolean} Is recent
   */
  isRecentAssignment(assignment, currentDate) {
    const assignmentDate = new Date(assignment.date);
    const current = new Date(currentDate);
    const diffTime = current - assignmentDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= 3;
  }

  /**
   * Generate human-readable reasons for ranking
   * @param {Object} scores - Component scores
   * @param {Object} workloadData - Workload data
   * @param {Object} employee - Employee object
   * @param {Object} shift - Shift object
   * @returns {Array} Reasons array
   */
  generateRankingReasons({ fairnessScore, availabilityScore, stationScore, varietyScore, workloadData, employee, shift }) {
    const reasons = [];

    // Fairness reasons
    if (fairnessScore >= 80) {
      reasons.push('High priority - low recent workload');
    } else if (fairnessScore >= 60) {
      reasons.push('Good candidate - balanced workload');
    } else if (fairnessScore <= 30) {
      reasons.push('Lower priority - high recent workload');
    }

    // Availability reasons
    if (availabilityScore >= 80) {
      reasons.push('Excellent time availability match');
    } else if (availabilityScore >= 60) {
      reasons.push('Good time availability');
    } else if (availabilityScore <= 40) {
      reasons.push('Limited time availability');
    }

    // Station skill reasons
    if (stationScore >= 80) {
      reasons.push('Perfect station skill match');
    } else if (stationScore >= 60) {
      reasons.push('Good station skills');
    } else if (stationScore <= 40) {
      reasons.push('Limited station experience');
    }

    // Variety reasons
    if (varietyScore >= 70) {
      reasons.push('Good for station variety');
    } else if (varietyScore <= 40) {
      reasons.push('May reduce station variety');
    }

    // Specific workload reasons
    const totalHours = workloadData.totalHours;
    if (totalHours < 10) {
      reasons.push('Very light recent schedule');
    } else if (totalHours > 35) {
      reasons.push('Heavy recent workload');
    }

    // Rest days
    if (workloadData.pastWeek.restDays >= 3) {
      reasons.push('Good rest in past week');
    } else if (workloadData.pastWeek.restDays <= 1) {
      reasons.push('Limited rest recently');
    }

    return reasons;
  }

  /**
   * Group employees by ranking tiers
   * @param {Array} rankings - Ranked employees
   * @returns {Object} Employees grouped by tiers
   */
  groupByRankingTiers(rankings) {
    const tiers = {
      excellent: [], // 90-100
      good: [],      // 70-89
      fair: [],      // 50-69
      poor: []       // 0-49
    };

    rankings.forEach(ranking => {
      const score = ranking.totalScore;
      if (score >= 90) {
        tiers.excellent.push(ranking);
      } else if (score >= 70) {
        tiers.good.push(ranking);
      } else if (score >= 50) {
        tiers.fair.push(ranking);
      } else {
        tiers.poor.push(ranking);
      }
    });

    return tiers;
  }

  /**
   * Select optimal employees for shift assignment
   * @param {Array} rankings - Ranked employees
   * @param {number} requiredEmployees - Number of employees needed
   * @param {Object} constraints - Assignment constraints
   * @returns {Array} Selected employees
   */
  selectOptimalEmployees(rankings, requiredEmployees, constraints = {}) {
    const selected = [];
    const tiers = this.groupByRankingTiers(rankings);

    // First, try to fill from excellent tier
    selected.push(...tiers.excellent.slice(0, requiredEmployees));

    // If still need more, add from good tier
    if (selected.length < requiredEmployees) {
      const remaining = requiredEmployees - selected.length;
      selected.push(...tiers.good.slice(0, remaining));
    }

    // If still need more, add from fair tier
    if (selected.length < requiredEmployees) {
      const remaining = requiredEmployees - selected.length;
      selected.push(...tiers.fair.slice(0, remaining));
    }

    // Apply fairness distribution if enabled
    if (constraints.enforceEqualDistribution) {
      return this.applyEqualDistribution(selected, rankings, requiredEmployees);
    }

    return selected.slice(0, requiredEmployees);
  }

  /**
   * Apply equal distribution logic
   * @param {Array} selected - Initially selected employees
   * @param {Array} allRankings - All rankings
   * @param {number} requiredEmployees - Number needed
   * @returns {Array} Redistributed employees
   */
  applyEqualDistribution(selected, allRankings, requiredEmployees) {
    // Group by workload level
    const lowWorkload = allRankings.filter(r => r.workloadData.fairnessScore <= 30);
    const mediumWorkload = allRankings.filter(r =>
      r.workloadData.fairnessScore > 30 && r.workloadData.fairnessScore <= 70
    );
    const highWorkload = allRankings.filter(r => r.workloadData.fairnessScore > 70);

    // Prioritize low workload employees
    const redistributed = [];

    // Take up to half from low workload
    const lowCount = Math.min(Math.ceil(requiredEmployees / 2), lowWorkload.length);
    redistributed.push(...lowWorkload.slice(0, lowCount));

    // Fill remaining from medium workload
    const remaining = requiredEmployees - redistributed.length;
    if (remaining > 0) {
      redistributed.push(...mediumWorkload.slice(0, remaining));
    }

    // If still need more, add from high workload (but mark as less ideal)
    const stillRemaining = requiredEmployees - redistributed.length;
    if (stillRemaining > 0) {
      redistributed.push(...highWorkload.slice(0, stillRemaining));
    }

    return redistributed;
  }

  /**
   * Update ranking weights based on business priorities
   * @param {Object} newWeights - New weight configuration
   */
  updateWeights(newWeights) {
    // Validate weights sum to 1.0
    const total = Object.values(newWeights).reduce((sum, weight) => sum + weight, 0);
    if (Math.abs(total - 1.0) > 0.01) {
      throw new Error('Weights must sum to 1.0');
    }

    this.weights = { ...newWeights };
  }

  /**
   * Get current weight configuration
   * @returns {Object} Current weights
   */
  getWeights() {
    return { ...this.weights };
  }

  /**
   * Analyze ranking effectiveness
   * @param {Array} rankings - Employee rankings
   * @param {Array} actualAssignments - Actual assignments made
   * @returns {Object} Analysis results
   */
  analyzeRankingEffectiveness(rankings, actualAssignments) {
    const analysis = {
      topRankedUtilization: 0,
      fairnessDistribution: 0,
      skillMatchRate: 0,
      totalRankings: rankings.length,
      assignmentsMade: actualAssignments.length
    };

    // Calculate what percentage of assignments went to top-ranked employees
    const topQuartile = rankings.slice(0, Math.ceil(rankings.length / 4));
    const topQuartileIds = topQuartile.map(r => r.employee.id);

    const topRankedAssignments = actualAssignments.filter(a =>
      topQuartileIds.includes(a.employeeId)
    );

    analysis.topRankedUtilization = actualAssignments.length > 0
      ? (topRankedAssignments.length / actualAssignments.length) * 100
      : 0;

    // Calculate fairness distribution (how evenly workload is distributed)
    const employeeHours = {};
    actualAssignments.forEach(assignment => {
      if (!employeeHours[assignment.employeeId]) {
        employeeHours[assignment.employeeId] = 0;
      }
      // Assume 8 hours per assignment for simplicity
      employeeHours[assignment.employeeId] += 8;
    });

    const hours = Object.values(employeeHours);
    if (hours.length > 1) {
      const mean = hours.reduce((sum, h) => sum + h, 0) / hours.length;
      const variance = hours.reduce((sum, h) => sum + Math.pow(h - mean, 2), 0) / hours.length;
      const stdDev = Math.sqrt(variance);
      analysis.fairnessDistribution = Math.max(0, 100 - (stdDev / mean) * 100); // Lower variance = higher fairness
    }

    return analysis;
  }
}

module.exports = new EmployeeRanker();
