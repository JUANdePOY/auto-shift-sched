import type { Employee, Department } from '../../../shared/types';
import type { TemporaryAssignment } from '../../contexts/TemporaryScheduleContext';

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

export interface ShiftAssignmentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  employees: Employee[];
  onSaveFinalSchedule?: (date: string, assignments: Array<{ shiftId: string; employeeId: string }>, notes?: string) => Promise<void>;
  isWeeklyMode?: boolean;
  onSaveToTemporary?: (date: string, assignments: TemporaryAssignment[]) => void;
}

export interface NewShiftForm {
  time: string;
  title: string;
  department: string;
  requiredStation: string[];
}

export interface AssignmentProgressProps {
  assignedCount: number;
  totalCount: number;
}

export interface ShiftAssignmentsTableProps {
  assignments: ShiftAssignment[];
  typeFilter: string;
  onAssignEmployee: (shiftId: string, employeeId: string) => void;
  onUnassignEmployee: (shiftId: string) => void;
  onOpenAISuggestionPanel: (shiftId: string) => void;
  onEditShift: (shift: ShiftAssignment) => void;
  onDeleteShift: (shiftId: string) => void;
  employees: Employee[];
  getAvailableEmployees: (shift: ShiftAssignment) => Employee[];
}

export interface AddShiftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  onAddShift: (shift: Omit<ShiftAssignment, 'id' | 'status' | 'type'>) => void;
}

export interface EditShiftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shift: ShiftAssignment | null;
  departments: Department[];
  onSaveEdit: (shiftId: string, editForm: {
    department: string;
    requiredStation: string[];
    startTime: string;
    endTime: string;
  }) => Promise<void>;
}

export interface UseShiftAssignmentsReturn {
  assignments: ShiftAssignment[];
  departments: Department[];
  stations: { id: string; name: string }[];
  typeFilter: string;
  setTypeFilter: (filter: string) => void;
  isAutoAssigning: boolean;
  handleAssignEmployee: (shiftId: string, employeeId: string) => void;
  handleUnassignEmployee: (shiftId: string) => void;
  handleAutoAssign: () => Promise<void>;
  handleSaveSchedule: () => Promise<void>;
  handleAddShift: (shift: Omit<ShiftAssignment, 'id' | 'status' | 'type'>) => void;
  handleDeleteShift: (shiftId: string) => void;
  handleEditShift: (shift: ShiftAssignment) => void;
  handleSaveEdit: (shiftId: string, editForm: {
    department: string;
    requiredStation: string[];
    startTime: string;
    endTime: string;
  }) => Promise<void>;
  getAvailableEmployees: (shift: ShiftAssignment) => Employee[];
}
