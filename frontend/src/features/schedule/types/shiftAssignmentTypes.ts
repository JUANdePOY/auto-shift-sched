import type { Employee, Department, AISuggestion } from '../../../features/shared/types';
import type { TemporaryAssignment } from '../contexts/TemporaryScheduleContext';

export interface ShiftAssignment {
  id: string;
  time: string;
  endTime: string;
  title: string;
  department: string;
  requiredStation: string[];
  assignedEmployee?: Employee;
  status: 'unassigned' | 'assigned' | 'conflict';
  type: 'opener' | 'mid' | 'closer' | 'graveyard';
}

export interface NewShiftForm {
  time: string;
  title: string;
  department: string;
  requiredStation: string[];
}

export interface EditShiftForm {
  department: string;
  requiredStation: string[];
  startTime: string;
  endTime: string;
}

export interface ShiftAssignmentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  employees: Employee[];
  onSaveFinalSchedule?: (date: string, assignments: Array<{ shiftId: string; employeeId: string }>, notes?: string) => Promise<void>;
  isWeeklyMode?: boolean;
  onSaveToTemporary?: (date: string, assignments: TemporaryAssignment[]) => void;
  viewMode?: boolean;
  finalSchedule?: Array<{
    shift_id: number;
    employee_id: number;
    shift_title: string;
    date: string;
    startTime: string;
    endTime: string;
    employee_name: string;
    department?: string;
    required_stations: string[];
  }> | null;
}

export type ShiftType = 'opener' | 'mid' | 'closer' | 'graveyard';

export type AssignmentStatus = 'unassigned' | 'assigned' | 'conflict';

export interface Station {
  id: string;
  name: string;
}

// Re-export types that are used from other modules
export type { Employee, Department, AISuggestion, TemporaryAssignment };
