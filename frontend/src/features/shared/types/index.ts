export interface Department {
  id: string;
  name: 'Service' | 'Production';
  stations: Station[];
}

export interface Station {
  id: string;
  name: string;
  departmentId: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: 'Service' | 'Production';
  station: string | string[];
  availability: WeeklyAvailability;
  maxHoursPerWeek: number;
  currentWeeklyHours: number;
  skills?: string[];
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WeeklyAvailability {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
}

export interface DayAvailability {
  available: boolean;
  startTime?: string; // Format: "HH:MM"
  endTime?: string;   // Format: "HH:MM"
  preferredStart?: string; // Format: "HH:MM"
  preferredEnd?: string;   // Format: "HH:MM"
  notes?: string;
}

export interface EmployeeFormData extends Omit<Employee, 'id' | 'currentWeeklyHours' | 'createdAt' | 'updatedAt'> {
  id?: string;
  currentWeeklyHours?: number;
}

export interface EmployeeFilters {
  searchTerm?: string;
  department?: string;
  station?: string;
  minHours?: number;
  maxHours?: number;
  availableDays?: number;
  skills?: string[];
}

export type SortField = 'name' | 'department' | 'station' | 'utilization' | 'hours' | 'role';
export type SortDirection = 'asc' | 'desc';

export interface SortOptions {
  field: SortField;
  direction: SortDirection;
}

export interface Shift {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  date: string;
  requiredStation: string[];
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