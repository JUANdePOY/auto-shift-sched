import type { ScheduleConflict, Employee } from '../../shared/types';

export const getStartOfWeek = (date: Date) => {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day; // adjust when day is Sunday
  const result = new Date(date);
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0); // Reset time to start of day
  return result;
};

export const getWeekDates = (startDate: Date) => {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate.getTime());
    date.setDate(startDate.getDate() + i);
    dates.push(date);
  }
  return dates;
};

export const getRelativeDateLabel = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
};

export const isToday = (date: Date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
};

export const getEmployeeName = (employeeId: string, employees: Employee[]) => {
  const employee = employees.find(emp => emp.id === employeeId);
  return employee ? employee.name : 'Unknown';
};

export const getShiftConflicts = (shiftId: string, conflicts: ScheduleConflict[]) => {
  return conflicts.filter(conflict => conflict.shiftId === shiftId);
};

/**
 * Formats a Date object to a string in YYYY-MM-DD format
 * @param date The date to format
 * @returns A string representation of the date in YYYY-MM-DD format
 */
export const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
