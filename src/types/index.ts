export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  skills: string[];
  availability: {
    [key: string]: { // day of week (monday, tuesday, etc.)
      available: boolean;
      preferredStart?: string;
      preferredEnd?: string;
    };
  };
  maxHoursPerWeek: number;
  currentWeeklyHours: number;
}

export interface Shift {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  date: string;
  requiredSkills: string[];
  requiredEmployees: number;
  assignedEmployees: string[];
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
  department: string;
}

export interface ScheduleConflict {
  type: 'overlap' | 'unavailable' | 'overtime' | 'skill_mismatch';
  severity: 'warning' | 'error';
  employeeId: string;
  shiftId: string;
  message: string;
}

export interface AISuggestion {
  id: string;
  type: 'assignment' | 'swap' | 'optimization';
  title: string;
  description: string;
  confidence: number;
  impact: {
    efficiency: number;
    satisfaction: number;
    coverage: number;
  };
  action: {
    type: 'assign' | 'unassign' | 'swap';
    shiftId: string;
    employeeId: string;
    targetEmployeeId?: string;
  };
}

export interface WeeklySchedule {
  weekStart: string;
  shifts: Shift[];
  conflicts: ScheduleConflict[];
  suggestions: AISuggestion[];
  coverageRate: number;
  scheduleEfficiency: number;
}