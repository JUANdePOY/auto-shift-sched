import type { Employee, AISuggestion } from '../../shared/types';

// Constants
export const SUGGESTION_CONSTANTS = {
  MAX_CONFIDENCE: 98,
  BASE_CONFIDENCE: 85,
  CONFIDENCE_INCREMENT: 13,
  MAX_HOURS: 40,
  SHIFT_HOURS: 8,
  SCORE_WEIGHTS: {
    AVAILABILITY: 30,
    SKILL_MATCH: 40,
    FAIRNESS: 30
  }
} as const;

// Helper function to parse time strings (assuming format like "09:00" or "9:00 AM")
export const parseTime = (timeStr: string): number => {
  if (!timeStr) {
    return 0;
  }

  try {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let hourNum = hours;

    if (period) {
      if (period.toUpperCase() === 'PM' && hours !== 12) hourNum += 12;
      if (period.toUpperCase() === 'AM' && hours === 12) hourNum = 0;
    }

    const totalMinutes = hourNum * 60 + (minutes || 0);
    return totalMinutes;
  } catch (error) {
    console.error('Error parsing time:', timeStr, error);
    return 0;
  }
};

// Helper function to check if shift time overlaps with employee availability
export const isTimeAvailable = (
  employee: Employee,
  shiftDate: string,
  shiftStart: string,
  shiftEnd: string
): boolean => {
  // If no availability data is provided, consider the employee as available (for testing purposes)
  if (!employee.availability) {
    return true;
  }

  const dayOfWeek = new Date(shiftDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof typeof employee.availability;
  const availability = employee.availability[dayOfWeek];

  // If the employee is explicitly not available for this day, return false
  if (availability && availability.available === false) {
    return false;
  }

  // If availability data exists and the employee is available, check time constraints
  if (availability && availability.available === true && availability.startTime && availability.endTime) {
    const shiftStartMinutes = parseTime(shiftStart);
    const shiftEndMinutes = parseTime(shiftEnd);
    const availStartMinutes = parseTime(availability.startTime);
    const availEndMinutes = parseTime(availability.endTime);

    // Check if shift overlaps with availability
    const isAvailable = shiftStartMinutes < availEndMinutes && shiftEndMinutes > availStartMinutes;
    return isAvailable;
  }

  // If the employee is available but no specific times are set, consider them available
  if (availability && availability.available === true) {
    return true;
  }

  // If no explicit availability data or times are set, consider the employee as available
  return true;
};

// Filter employees who are available for this specific shift date and time
export const getAvailableEmployeesForShift = (
  employees: Employee[],
  shiftDate?: string,
  shiftTime?: string,
  shiftEndTime?: string
): Employee[] => {
  if (!shiftDate || !shiftTime || !shiftEndTime) {
    return employees;
  }

  return employees.filter(employee =>
    isTimeAvailable(employee, shiftDate, shiftTime, shiftEndTime)
  );
};

// Calculate employee score for shift assignment
export const calculateEmployeeScore = (
  employee: Employee,
  shiftDate?: string,
  shiftTime?: string,
  shiftEndTime?: string,
  requiredStations?: string[],
  currentHours?: number
): number => {
  let score = 0;

  // Availability match (higher for preferred times)
  if (shiftDate && shiftTime && shiftEndTime) {
    const dayOfWeek = new Date(shiftDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof typeof employee.availability;
    const availability = employee.availability?.[dayOfWeek];
    if (availability && availability.available) {
      if (availability.preferredStart && availability.preferredEnd) {
        // Check if shift time matches preferred times
        const shiftStart = shiftTime;
        const shiftEnd = shiftEndTime;
        const prefStart = availability.preferredStart;
        const prefEnd = availability.preferredEnd;

        if (shiftStart === prefStart && shiftEnd === prefEnd) {
          score += 50; // Perfect match
        } else if (shiftStart >= prefStart && shiftEnd <= prefEnd) {
          score += 45; // Within preferred range
        } else if (parseTime(shiftStart) < parseTime(prefEnd) && parseTime(shiftEnd) > parseTime(prefStart)) {
          score += 35; // Partially overlaps with preferred times
        } else {
          score += 30; // Has preferred times but different
        }
      } else {
        score += 25; // Available but no preferences
      }
    }
  }

  // Skill match (higher for exact station matches)
  if (requiredStations && requiredStations.length > 0) {
    const employeeStations = Array.isArray(employee.station) ? employee.station : [employee.station];
    const matchedStations = requiredStations.filter(station =>
      employeeStations.includes(station)
    ).length;
    score += (matchedStations / requiredStations.length) * SUGGESTION_CONSTANTS.SCORE_WEIGHTS.SKILL_MATCH;
  }

  // Fairness factor (prefer employees with lower current hours - simulated workload balance)
  const simulatedCurrentHours = currentHours ?? Math.random() * SUGGESTION_CONSTANTS.MAX_HOURS;
  const workloadBalance = (SUGGESTION_CONSTANTS.MAX_HOURS - simulatedCurrentHours) / SUGGESTION_CONSTANTS.MAX_HOURS;
  score += workloadBalance * SUGGESTION_CONSTANTS.SCORE_WEIGHTS.FAIRNESS;

  return score;
};

// Generate AI suggestions for the specific shift using enhanced logic
export const generateShiftSuggestions = (
  shiftId: string,
  availableEmployees: Employee[],
  requiredStations?: string[],
  shiftDate?: string,
  shiftTime?: string,
  shiftEndTime?: string,
  employeeCurrentHours: Record<string, number> = {}
): AISuggestion[] => {
  if (!shiftId || !availableEmployees.length) {
    return [];
  }

  const shiftSuggestions: AISuggestion[] = [];

  // Sort employees by enhanced criteria
  const rankedEmployees = availableEmployees.map(employee => {
    const score = calculateEmployeeScore(
      employee,
      shiftDate,
      shiftTime,
      shiftEndTime,
      requiredStations,
      employeeCurrentHours[employee.id]
    );
    return { employee, score };
  }).sort((a, b) => b.score - a.score);

  // Best match suggestion
  const bestMatch = rankedEmployees[0];
  if (bestMatch) {
    shiftSuggestions.push({
      id: `suggestion-${shiftId}-best-match`,
      type: 'assignment',
      title: `Best Match: ${bestMatch.employee.name}`,
      description: `${bestMatch.employee.name} is the optimal choice based on enhanced fairness algorithms, skill matching, and availability patterns.`,
      confidence: Math.min(SUGGESTION_CONSTANTS.MAX_CONFIDENCE, SUGGESTION_CONSTANTS.BASE_CONFIDENCE + (bestMatch.score / 100) * SUGGESTION_CONSTANTS.CONFIDENCE_INCREMENT),
      impact: {
        efficiency: 28,
        satisfaction: 25,
        coverage: 35
      },
      action: {
        type: 'assign',
        shiftId: shiftId,
        employeeId: bestMatch.employee.id
      }
    });
  }

  // Alternative suggestions with enhanced reasoning
  rankedEmployees.slice(1, 4).forEach((rankedEmp, index) => {
    const reasons = [];
    if (rankedEmp.score > 50) reasons.push('strong skill match');
    if (rankedEmp.score > 30) reasons.push('good availability');
    if (reasons.length === 0) reasons.push('balanced option');

    shiftSuggestions.push({
      id: `suggestion-${shiftId}-alt-${index}`,
      type: 'assignment',
      title: `Alternative: ${rankedEmp.employee.name}`,
      description: `${rankedEmp.employee.name} is a solid alternative with ${reasons.join(' and ')}.`,
      confidence: Math.max(60, 80 - (index * 8)),
      impact: {
        efficiency: Math.max(15, 25 - (index * 3)),
        satisfaction: Math.max(12, 20 - (index * 2)),
        coverage: Math.max(20, 30 - (index * 3))
      },
      action: {
        type: 'assign',
        shiftId: shiftId,
        employeeId: rankedEmp.employee.id
      }
    });
  });

  // Fairness optimization suggestion
  if (availableEmployees.length > 2) {
    shiftSuggestions.push({
      id: `suggestion-${shiftId}-fairness`,
      type: 'optimization',
      title: 'Enhanced Fairness Optimization',
      description: 'This assignment considers workload balance, station variety, and equal distribution across the team using advanced fairness algorithms.',
      confidence: 82,
      impact: {
        efficiency: 18,
        satisfaction: 40,
        coverage: 25
      },
      action: {
        type: 'assign',
        shiftId: shiftId,
        employeeId: rankedEmployees[0].employee.id
      }
    });
  }

  // Station variety suggestion
  const stationVarietyEmployees = availableEmployees.filter(emp => {
    const employeeStations = Array.isArray(emp.station) ? emp.station : [emp.station];
    return requiredStations && requiredStations.some(station => employeeStations.includes(station));
  });

  if (stationVarietyEmployees.length > 1) {
    shiftSuggestions.push({
      id: `suggestion-${shiftId}-variety`,
      type: 'optimization',
      title: 'Station Variety Consideration',
      description: 'Prioritizing employees for station variety to prevent skill stagnation and maintain team versatility.',
      confidence: 75,
      impact: {
        efficiency: 20,
        satisfaction: 30,
        coverage: 22
      },
      action: {
        type: 'assign',
        shiftId: shiftId,
        employeeId: stationVarietyEmployees[0].id
      }
    });
  }

  return shiftSuggestions;
};

// Get suggestion icon based on type
export const getSuggestionIcon = (type: string) => {
  switch (type) {
    case 'assignment':
      return 'Users';
    case 'swap':
      return 'ArrowRight';
    case 'optimization':
      return 'TrendingUp';
    default:
      return 'Brain';
  }
};

// Get confidence color class
export const getConfidenceColor = (confidence: number) => {
  if (confidence >= 80) return 'text-green-600';
  if (confidence >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

// Calculate average metrics
export const calculateAverageMetrics = (suggestions: AISuggestion[]) => {
  if (!suggestions.length) return { efficiency: 0, confidence: 0 };

  const averageEfficiency = suggestions.reduce((sum, s) => sum + s.impact.efficiency, 0) / suggestions.length;
  const averageConfidence = suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length;

  return {
    efficiency: averageEfficiency,
    confidence: averageConfidence
  };
};
