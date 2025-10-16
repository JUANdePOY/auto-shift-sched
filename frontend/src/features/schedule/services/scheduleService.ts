import type { Shift, WeeklySchedule, ScheduleConflict, Employee } from '../../shared/types';

const API_URL = '/api';

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

/**
 * Fetches the weekly schedule from the API.
 * @param weekStart The start date of the week in YYYY-MM-DD format
 * @returns A promise that resolves to the weekly schedule object.
 */
export async function getWeeklySchedule(weekStart: string): Promise<WeeklySchedule> {
  const response = await fetch(`${API_URL}/schedule/week?startDate=${weekStart}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch weekly schedule');
  }
  return response.json();
}

/**
 * Fetches all shifts from the API.
 * @returns A promise that resolves to an array of shifts.
 */
export async function getAllShifts(): Promise<Shift[]> {
  const response = await fetch(`${API_URL}/shifts`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch shifts');
  }
  return response.json();
}

/**
 * Fetches shifts within a date range from the API.
 * @param startDate The start date in YYYY-MM-DD format
 * @param endDate The end date in YYYY-MM-DD format
 * @returns A promise that resolves to an array of shifts.
 */
export async function getShiftsByDateRange(startDate: string, endDate: string): Promise<Shift[]> {
  const response = await fetch(`${API_URL}/shifts/range?startDate=${startDate}&endDate=${endDate}`);
  if (!response.ok) {
    throw new Error('Failed to fetch shifts by date range');
  }
  return response.json();
}

/**
 * Creates a new shift.
 * @param shiftData The data for the new shift.
 * @returns A promise that resolves to the newly created shift object.
 */
export async function createShift(shiftData: Omit<Shift, 'id'>): Promise<Shift> {
  const response = await fetch(`${API_URL}/shifts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(shiftData),
  });
  if (!response.ok) {
    throw new Error('Failed to create shift');
  }
  return response.json();
}

/**
 * Updates an existing shift.
 * @param id The ID of the shift to update.
 * @param shiftData The new data for the shift.
 * @returns A promise that resolves to the updated shift object.
 */
export async function updateShift(id: string, shiftData: Partial<Omit<Shift, 'id'>>): Promise<Shift> {
  const response = await fetch(`${API_URL}/shifts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(shiftData),
  });
  if (!response.ok) {
    throw new Error(`Failed to update shift with id ${id}`);
  }
  return response.json();
}

/**
 * Deletes a shift by its ID.
 * @param id The ID of the shift to delete.
 * @returns A promise that resolves when the shift is deleted.
 */
export async function deleteShift(id: string): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/shifts/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to delete shift with id ${id}`);
  }
  return response.json();
}

/**
 * Assigns an employee to a shift.
 * @param shiftId The ID of the shift.
 * @param employeeId The ID of the employee to assign.
 * @returns A promise that resolves to the updated shift object.
 */
export async function assignEmployeeToShift(shiftId: string, employeeId: string): Promise<Shift> {
  const response = await fetch(`${API_URL}/shifts/${shiftId}/assign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ employeeId }),
  });
  if (!response.ok) {
    throw new Error('Failed to assign employee to shift');
  }
  return response.json();
}

/**
 * Unassigns an employee from a shift.
 * @param shiftId The ID of the shift.
 * @param employeeId The ID of the employee to unassign.
 * @returns A promise that resolves to the updated shift object.
 */
export async function unassignEmployeeFromShift(shiftId: string, employeeId: string): Promise<Shift> {
  const response = await fetch(`${API_URL}/shifts/${shiftId}/unassign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ employeeId }),
  });
  if (!response.ok) {
    throw new Error('Failed to unassign employee from shift');
  }
  return response.json();
}

/**
 * Detects conflicts in the schedule.
 * @param startDate Optional start date for conflict detection range
 * @param endDate Optional end date for conflict detection range
 * @returns A promise that resolves to an array of schedule conflicts.
 */
export async function detectConflicts(startDate?: string, endDate?: string): Promise<ScheduleConflict[]> {
  let url = `${API_URL}/schedule/conflicts`;
  if (startDate && endDate) {
    url += `?startDate=${startDate}&endDate=${endDate}`;
  }
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to detect conflicts');
  }
  return response.json();
}

/**
 * Generate automated schedule for a date range
 * @param startDate Start date in YYYY-MM-DD format
 * @param endDate End date in YYYY-MM-DD format
 * @returns A promise that resolves to the generated schedule
 */
export async function generateAutomatedSchedule(startDate: string, endDate: string): Promise<{
  assignments: Array<{
    shiftId: string;
    employeeId: string;
    employeeName: string;
    shiftTitle: string;
    date: string;
    startTime: string;
    endTime: string;
  }>;
  conflicts: ScheduleConflict[];
  coverageRate: number;
  totalShifts: number;
  assignedShifts: number;
}> {
  const response = await fetch(`${API_URL}/schedule/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ startDate, endDate }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate automated schedule');
  }
  return response.json();
}

/**
 * Get AI suggestions for employees to assign to a shift
 * @param shiftId The ID of the shift
 * @returns A promise that resolves to an array of employee suggestions
 */
export async function getEmployeeSuggestions(shiftId: string): Promise<Array<{
  employee: Employee;
  score: number;
  reasons: string[];
}>> {
  const response = await fetch(`${API_URL}/schedule/suggest-employee`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ shiftId }),
  });

  if (!response.ok) {
    throw new Error('Failed to get employee suggestions');
  }
  return response.json();
}

/**
 * Save final schedule for a day with all assignments
 * @param date The date for the schedule in YYYY-MM-DD format
 * @param assignments Array of assignments with shiftId and employeeId
 * @param notes Optional notes for the schedule
 * @returns A promise that resolves to the save result
 */
export async function saveFinalSchedule(
  date: string,
  assignments: Array<{ shiftId: string; employeeId: string }>,
  notes?: string
): Promise<{
  success: boolean;
  scheduleGenerationId: number;
  message: string;
  totalAssignments: number;
}> {
  // Save to final_schedule table via backend API
  const response = await fetch(`${API_URL}/schedule/save-final`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ date, assignments, notes }),
  });

  if (!response.ok) {
    throw new Error('Failed to save final schedule');
  }
  return response.json();
}

/**
 * Fetch final schedule for a specific date
 * @param date The date in YYYY-MM-DD format
 * @returns A promise that resolves to an array of final schedule assignments
 */
export async function getFinalSchedule(date: string): Promise<Array<{
  shift_id: number;
  employee_id: number;
  shift_title: string;
  date: string;
  startTime: string;
  endTime: string;
  employee_name: string;
  required_stations: string[];
}>> {
  const response = await fetch(`${API_URL}/schedule/final/${date}`);
  if (!response.ok) {
    throw new Error('Failed to fetch final schedule');
  }
  return response.json();
}

/**
 * Fetch final schedule for a week
 * @param startDate The start date of the week in YYYY-MM-DD format
 * @returns A promise that resolves to an array of final schedule assignments for the week
 */
export async function getFinalScheduleForWeek(startDate: string): Promise<Array<{
  shift_id: number;
  employee_id: number;
  shift_title: string;
  date: string;
  startTime: string;
  endTime: string;
  employee_name: string;
  required_stations: string[];
}>> {
  const response = await fetch(`${API_URL}/schedule/final/week/${startDate}`);
  if (!response.ok) {
    throw new Error('Failed to fetch final schedule for week');
  }
  return response.json();
}
