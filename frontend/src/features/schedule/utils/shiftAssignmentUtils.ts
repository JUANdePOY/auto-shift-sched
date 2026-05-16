// ==================== SHIFT UTILITY FUNCTIONS ====================

import type { ShiftType, ShiftAssignment, Employee, Station } from '../types/shiftAssignmentTypes';

// Helper function to determine shift type based on start time
export const getShiftType = (time: string): ShiftType => {
  const hour = parseInt(time.split(':')[0], 10);
  if (hour >= 6 && hour < 12) return 'opener';
  if (hour >= 12 && hour < 18) return 'mid';
  if (hour >= 18 && hour < 24) return 'closer';
  return 'graveyard'; // 00:00 to 05:59
};

// Helper function to calculate end time (start + 6 hours)
export const calculateEndTime = (startTime: string): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);
  startDate.setHours(startDate.getHours() + 6);
  return startDate.toTimeString().slice(0, 5); // HH:MM format
};

// Helper function to get available employees for a shift
export const getAvailableEmployees = (
  shift: ShiftAssignment,
  employees: Employee[],
  getAssignmentsForDate: (date: string) => any[],
  date: string,
  finalSchedule?: any[] | null
): Employee[] => {
  if (!shift || !shift.department) return [];

  // Get employees in the same department
  let availableEmployees = employees.filter(employee =>
    employee &&
    employee.department &&
    employee.department === shift.department
  );

  // Filter out employees already assigned on the same day
  const tempAssignments = getAssignmentsForDate(date);
  const assignedEmployeeIds = new Set(tempAssignments.map(ta => ta.employeeId));

  // Also filter out employees assigned in final schedule for the same day
  if (finalSchedule) {
    finalSchedule.forEach(assignment => {
      if (assignment.date === date) {
        assignedEmployeeIds.add(assignment.employee_id.toString());
      }
    });
  }

  availableEmployees = availableEmployees.filter(employee =>
    !assignedEmployeeIds.has(employee.id)
  );

  return availableEmployees;
};

// Helper function to format time for database (ensure HH:MM:SS format)
export const formatTimeForDatabase = (time: string): string => {
  return time.length === 5 ? `${time}:00` : time;
};

// Helper function to format time for frontend (ensure HH:MM format)
export const formatTimeForFrontend = (time: string): string => {
  return time.slice(0, 5);
};

// Helper function to create initial assignments from fetched shifts
export const createInitialAssignments = (
  fetchedShifts: any[],
  departments: any[],
  employees: Employee[],
  getAssignmentsForDate: (date: string) => any[],
  date: string
): ShiftAssignment[] => {
  const initialAssignments: ShiftAssignment[] = fetchedShifts.map((shift, index) => {
    let requiredStation: string[] = [];
    if (Array.isArray(shift.requiredStation)) {
      requiredStation = shift.requiredStation.map((s: string) => String(s).trim().toLowerCase());
    } else if (shift.requiredStation) {
      requiredStation = [String(shift.requiredStation).trim().toLowerCase()];
    }
    return {
      id: `${shift.id}-${index}`,
      time: formatTimeForFrontend(shift.startTime),
      endTime: formatTimeForFrontend(shift.endTime),
      title: shift.title,
      department: shift.department || departments[0]?.name || 'General',
      requiredStation,
      status: 'unassigned' as const,
      type: getShiftType(formatTimeForFrontend(shift.startTime))
    };
  });

  // Apply temporary assignments from context
  const tempAssignments = getAssignmentsForDate(date);
  const assignmentsWithTemp = initialAssignments.map(assignment => {
    const temp = tempAssignments.find(t => t.shiftId === assignment.id);
    if (temp) {
      const employee = employees.find(e => e.id === temp.employeeId);
      return { ...assignment, assignedEmployee: employee, status: 'assigned' as const };
    }
    return assignment;
  });

  return assignmentsWithTemp;
};

// Helper function to create new shift assignment
export const createNewShiftAssignment = (
  newShiftForm: any,
  getShiftType: (time: string) => ShiftType,
  calculateEndTime: (time: string) => string
): ShiftAssignment => {
  return {
    id: `shift-${Date.now()}`,
    time: newShiftForm.time,
    endTime: calculateEndTime(newShiftForm.time),
    title: newShiftForm.title,
    department: newShiftForm.department,
    requiredStation: newShiftForm.requiredStation.map((s: string) => s.trim().toLowerCase()),
    status: 'unassigned' as const,
    type: getShiftType(newShiftForm.time)
  };
};
