import type { Employee } from '../../shared/types';
import { parseTime } from '../../ai-suggestions/utils/suggestionUtils';

interface Assignment {
  employee_id: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface TemporaryAssignment {
  shiftId: string;
  employeeId: string;
  employee?: Employee;
}

/**
 * Calculate the duration in hours between start and end times
 */
export function calculateShiftHours(startTime: string, endTime: string): number {
  const startMinutes = parseTime(startTime);
  const endMinutes = parseTime(endTime);
  return (endMinutes - startMinutes) / 60;
}

/**
 * Get all dates in the current week for a given date
 */
export function getWeekDates(date: string): string[] {
  const currentDate = new Date(date);
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay()); // Start of week (Sunday)

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const weekDate = new Date(weekStart);
    weekDate.setDate(weekStart.getDate() + i);
    dates.push(weekDate.toISOString().split('T')[0]);
  }
  return dates;
}

/**
 * Calculate weekly hours for each employee from final schedule assignments
 */
export function calculateWeeklyHoursFromFinalSchedule(
  finalSchedule: Assignment[],
  weekDates: string[]
): Record<string, number> {
  const hoursMap: Record<string, number> = {};

  finalSchedule.forEach(assignment => {
    if (weekDates.includes(assignment.date)) {
      const hours = calculateShiftHours(assignment.startTime, assignment.endTime);
      hoursMap[assignment.employee_id] = (hoursMap[assignment.employee_id] || 0) + hours;
    }
  });

  return hoursMap;
}

/**
 * Calculate weekly hours for each employee from temporary assignments
 */
export function calculateWeeklyHoursFromTemporaryAssignments(
  temporaryAssignments: Record<string, TemporaryAssignment[]>,
  weekDates: string[],
  shiftIdToTimeMap: Record<string, { startTime: string; endTime: string }>
): Record<string, number> {
  const hoursMap: Record<string, number> = {};

  Object.entries(temporaryAssignments).forEach(([date, assignments]) => {
    if (weekDates.includes(date)) {
      assignments.forEach(assignment => {
        const shiftTimes = shiftIdToTimeMap[assignment.shiftId];
        if (shiftTimes) {
          const hours = calculateShiftHours(shiftTimes.startTime, shiftTimes.endTime);
          hoursMap[assignment.employeeId] = (hoursMap[assignment.employeeId] || 0) + hours;
        }
      });
    }
  });

  return hoursMap;
}

/**
 * Combine hours from final schedule and temporary assignments
 */
export function combineEmployeeHours(
  finalHours: Record<string, number>,
  tempHours: Record<string, number>
): Record<string, number> {
  const combined: Record<string, number> = { ...finalHours };

  Object.entries(tempHours).forEach(([employeeId, hours]) => {
    combined[employeeId] = (combined[employeeId] || 0) + hours;
  });

  return combined;
}

/**
 * Check if an employee is already assigned on a specific date
 */
export function isEmployeeAssignedOnDate(
  employeeId: string,
  date: string,
  finalSchedule: Assignment[],
  temporaryAssignments: Record<string, TemporaryAssignment[]>
): boolean {
  // Check final schedule
  const finalAssignment = finalSchedule.some(assignment =>
    assignment.employee_id === employeeId && assignment.date === date
  );

  if (finalAssignment) return true;

  // Check temporary assignments
  const tempAssignments = temporaryAssignments[date] || [];
  const tempAssignment = tempAssignments.some(assignment =>
    assignment.employeeId === employeeId
  );

  return tempAssignment;
}

/**
 * Filter employees who are available for assignment (not already assigned on the same day)
 */
export function filterAvailableEmployeesForShift(
  employees: Employee[],
  shiftDate: string,
  finalSchedule: Assignment[],
  temporaryAssignments: Record<string, TemporaryAssignment[]>
): Employee[] {
  return employees.filter(employee =>
    !isEmployeeAssignedOnDate(employee.id, shiftDate, finalSchedule, temporaryAssignments)
  );
}
