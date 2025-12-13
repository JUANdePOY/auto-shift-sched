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

// Check if employee has matching station
export const hasMatchingStation = (employee: Employee, requiredStations: string[]): boolean => {
  if (!requiredStations || requiredStations.length === 0) return true;
  
  const employeeStations = Array.isArray(employee.station) 
    ? employee.station.flat().map(s => String(s).toLowerCase().trim())
    : String(employee.station).split(',').map(s => s.toLowerCase().trim());
  
  const shiftStations = requiredStations.map(s => s.toLowerCase().trim());
  
  return shiftStations.some(shiftStation =>
    employeeStations.some(empStation =>
      empStation === shiftStation || 
      empStation.includes(shiftStation) || 
      shiftStation.includes(empStation)
    )
  );
};

// Check if employee is available for shift with flexible time matching
export const isAvailableForShift = (
  employee: Employee,
  shiftDate: string,
  shiftStart: string,
  shiftEnd: string
): { available: boolean; timeMatch: 'perfect' | 'good' | 'partial' | 'none' } => {
  if (!employee.availability) {
    return { available: true, timeMatch: 'none' };
  }

  const dayOfWeek = new Date(shiftDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof typeof employee.availability;
  const availability = employee.availability[dayOfWeek];

  if (!availability || availability.available === false) {
    return { available: false, timeMatch: 'none' };
  }

  const shiftStartMinutes = parseTime(shiftStart);
  const shiftEndMinutes = parseTime(shiftEnd);

  // Check timeBlocks first (more specific availability periods)
  if (availability.timeBlocks && Array.isArray(availability.timeBlocks) && availability.timeBlocks.length > 0) {
    // Check if shift overlaps with any time block
    const overlappingBlocks = availability.timeBlocks.filter(block => {
      if (!block.startTime || !block.endTime) return false;

      const blockStartMinutes = parseTime(block.startTime);
      const blockEndMinutes = parseTime(block.endTime);

      // Check for overlap: shift starts before block ends AND shift ends after block starts
      return shiftStartMinutes < blockEndMinutes && shiftEndMinutes > blockStartMinutes;
    });

    if (overlappingBlocks.length === 0) {
      return { available: false, timeMatch: 'none' };
    }

    // Check if shift is completely within any preferred time block
    const preferredBlocks = overlappingBlocks.filter(block => block.preferred);
    if (preferredBlocks.length > 0) {
      const perfectPreferredBlock = preferredBlocks.find(block => {
        const blockStartMinutes = parseTime(block.startTime);
        const blockEndMinutes = parseTime(block.endTime);
        return shiftStartMinutes >= blockStartMinutes && shiftEndMinutes <= blockEndMinutes;
      });

      if (perfectPreferredBlock) {
        return { available: true, timeMatch: 'perfect' };
      } else {
        return { available: true, timeMatch: 'good' };
      }
    }

    // Check if shift is completely within any available time block
    const completeBlocks = overlappingBlocks.filter(block => {
      const blockStartMinutes = parseTime(block.startTime);
      const blockEndMinutes = parseTime(block.endTime);
      return shiftStartMinutes >= blockStartMinutes && shiftEndMinutes <= blockEndMinutes;
    });

    if (completeBlocks.length > 0) {
      return { available: true, timeMatch: 'good' };
    } else {
      return { available: true, timeMatch: 'partial' };
    }
  }

  // Fallback to legacy startTime/endTime or preferredStart/preferredEnd
  if (availability.startTime && availability.endTime) {
    const availStartMinutes = parseTime(availability.startTime);
    const availEndMinutes = parseTime(availability.endTime);

    // Check if shift overlaps with availability window (with 1-hour flexibility)
    const flexibilityMinutes = 60; // 1 hour flexibility
    const canStart = shiftStartMinutes >= (availStartMinutes - flexibilityMinutes);
    const canEnd = shiftEndMinutes <= (availEndMinutes + flexibilityMinutes);

    if (!canStart || !canEnd) {
      return { available: false, timeMatch: 'none' };
    }

    // Determine time match quality
    if (shiftStartMinutes >= availStartMinutes && shiftEndMinutes <= availEndMinutes) {
      return { available: true, timeMatch: 'perfect' };
    } else if (shiftStartMinutes >= (availStartMinutes - 30) && shiftEndMinutes <= (availEndMinutes + 30)) {
      return { available: true, timeMatch: 'good' };
    } else {
      return { available: true, timeMatch: 'partial' };
    }
  }

  // Check preferredStart/preferredEnd if available
  if (availability.preferredStart && availability.preferredEnd) {
    const preferredStartMinutes = parseTime(availability.preferredStart);
    const preferredEndMinutes = parseTime(availability.preferredEnd);

    // Check if shift overlaps with preferred times
    const overlapsPreferred = shiftStartMinutes < preferredEndMinutes && shiftEndMinutes > preferredStartMinutes;

    if (!overlapsPreferred) {
      return { available: true, timeMatch: 'partial' }; // Available but not preferred
    }

    // Check if shift is completely within preferred times
    const withinPreferred = shiftStartMinutes >= preferredStartMinutes && shiftEndMinutes <= preferredEndMinutes;

    if (withinPreferred) {
      return { available: true, timeMatch: 'perfect' };
    } else {
      return { available: true, timeMatch: 'good' };
    }
  }

  // If no specific times set, consider available
  return { available: true, timeMatch: 'none' };
};

// Calculate last week hours for an employee
export const calculateLastWeekHours = (employeeId: string, finalSchedule: any[], currentDate: string): number => {
  const lastWeekStart = new Date(currentDate);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(currentDate);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

  const lastWeekStartStr = lastWeekStart.toISOString().split('T')[0];
  const lastWeekEndStr = lastWeekEnd.toISOString().split('T')[0];

  return finalSchedule
    .filter(assignment => 
      assignment.employee_id.toString() === employeeId &&
      assignment.date >= lastWeekStartStr &&
      assignment.date <= lastWeekEndStr
    )
    .reduce((total, assignment) => {
      const start = parseTime(assignment.startTime);
      const end = parseTime(assignment.endTime);
      return total + ((end - start) / 60); // Convert minutes to hours
    }, 0);
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
  // Return all employees without filtering for QuickAssign to work
  return employees;
};

// Calculate employee score for shift assignment (enhanced version)
export const calculateEmployeeScore = (
  employee: Employee,
  shiftDate?: string,
  shiftTime?: string,
  shiftEndTime?: string,
  requiredStations?: string[],
  currentHours?: number,
  lastWeekHours?: number
): number => {
  let score = 0;

  // Station match (40 points max)
  if (hasMatchingStation(employee, requiredStations || [])) {
    score += 40;
  }

  // Time availability (30 points max)
  if (shiftDate && shiftTime && shiftEndTime) {
    const availability = isAvailableForShift(employee, shiftDate, shiftTime, shiftEndTime);
    if (availability.available) {
      switch (availability.timeMatch) {
        case 'perfect': score += 30; break;
        case 'good': score += 25; break;
        case 'partial': score += 20; break;
        default: score += 10;
      }
    }
  }

  // Current week workload balance (15 points max)
  if (currentHours !== undefined) {
    const currentWeekScore = Math.max(0, 15 - (currentHours / 40) * 15);
    score += currentWeekScore;
  }

  // Last week workload balance (15 points max)
  if (lastWeekHours !== undefined) {
    const lastWeekScore = Math.max(0, 15 - (lastWeekHours / 40) * 15);
    score += lastWeekScore;
  }

  return score;
};

// Check if employee is already assigned on the same date
export const isEmployeeAssignedOnDate = (
  employeeId: string,
  date: string,
  finalSchedule: any[],
  temporaryAssignments: any[]
): boolean => {
  // Check final schedule
  const finalAssignment = finalSchedule.some(assignment => 
    assignment.employee_id.toString() === employeeId && assignment.date === date
  );
  
  // Check temporary assignments
  const tempAssignment = temporaryAssignments.some(assignment => 
    assignment.employeeId === employeeId && assignment.date === date
  );
  
  return finalAssignment || tempAssignment;
};

// Generate AI suggestions for the specific shift using enhanced logic
export const generateShiftSuggestions = (
  shiftId: string,
  availableEmployees: Employee[],
  requiredStations?: string[],
  shiftDate?: string,
  shiftTime?: string,
  shiftEndTime?: string,
  employeeCurrentHours: Record<string, number> = {},
  finalSchedule: any[] = [],
  assignedEmployeeIds: string[] = []
): AISuggestion[] => {
  if (!shiftId || !availableEmployees.length || !shiftDate || !shiftTime || !shiftEndTime) {
    return [];
  }

  // Filter employees based on strict criteria
  const eligibleEmployees = availableEmployees.filter(employee => {
    // Must not be already assigned on this date
    if (assignedEmployeeIds.includes(employee.id)) {
      return false;
    }

    // Must have matching station
    if (!hasMatchingStation(employee, requiredStations || [])) {
      return false;
    }

    // Must be available for the shift time (with flexibility)
    const availability = isAvailableForShift(employee, shiftDate, shiftTime, shiftEndTime);
    return availability.available;
  });

  if (eligibleEmployees.length === 0) {
    return [];
  }

  // Calculate enhanced scores for eligible employees
  const rankedEmployees = eligibleEmployees.map(employee => {
    const availability = isAvailableForShift(employee, shiftDate, shiftTime, shiftEndTime);
    const currentWeekHours = employeeCurrentHours[employee.id] || 0;
    const lastWeekHours = calculateLastWeekHours(employee.id, finalSchedule, shiftDate);
    
    let score = 0;
    const reasons = [];

    // Station match score (30%)
    const stationScore = hasMatchingStation(employee, requiredStations || []) ? 30 : 0;
    score += stationScore;
    if (stationScore > 0) reasons.push('matches required station');

    // Time availability score (25%)
    let timeScore = 0;
    switch (availability.timeMatch) {
      case 'perfect': timeScore = 25; reasons.push('perfect time match'); break;
      case 'good': timeScore = 20; reasons.push('good time availability'); break;
      case 'partial': timeScore = 15; reasons.push('available with flexibility'); break;
      default: timeScore = 5;
    }
    score += timeScore;

    // Current week workload balance (25%)
    const currentWeekScore = Math.max(0, 25 - (currentWeekHours / 40) * 25);
    score += currentWeekScore;
    if (currentWeekHours < 20) reasons.push('low hours this week');
    else if (currentWeekHours < 35) reasons.push('moderate hours this week');

    // Last week workload balance (20%) - prioritize those with fewer hours last week
    const lastWeekScore = Math.max(0, 20 - (lastWeekHours / 40) * 20);
    score += lastWeekScore;
    if (lastWeekHours < 20) reasons.push('had light schedule last week');
    else if (lastWeekHours < 35) reasons.push('moderate schedule last week');
    else reasons.push('heavy schedule last week');

    return {
      employee,
      score,
      reasons,
      currentWeekHours,
      lastWeekHours,
      timeMatch: availability.timeMatch
    };
  });

  // Sort by score (highest first), then by last week hours (lowest first), then current week hours (lowest first)
  rankedEmployees.sort((a, b) => {
    if (Math.abs(a.score - b.score) < 5) { // If scores are close (within 5 points)
      if (Math.abs(a.lastWeekHours - b.lastWeekHours) < 2) { // If last week hours are close
        return a.currentWeekHours - b.currentWeekHours; // Prefer lower current week hours
      }
      return a.lastWeekHours - b.lastWeekHours; // Prefer lower last week hours
    }
    return b.score - a.score; // Higher score first
  });

  const suggestions: AISuggestion[] = [];

  // Generate suggestions for top candidates
  rankedEmployees.slice(0, 3).forEach((candidate, index) => {
    const confidence = Math.max(60, Math.min(95, candidate.score + 20));
    
    let title = '';
    if (index === 0) {
      title = `Best Match: ${candidate.employee.name}`;
    } else {
      title = `Alternative: ${candidate.employee.name}`;
    }

    const description = `${candidate.employee.name} - ${candidate.reasons.join(', ')}`;

    suggestions.push({
      id: `suggestion-${shiftId}-${index}`,
      type: 'assignment',
      title,
      description,
      confidence,
      reasons: candidate.reasons,
      action: {
        type: 'assign',
        shiftId: shiftId,
        employeeId: candidate.employee.id
      }
    });
  });

  return suggestions;
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




