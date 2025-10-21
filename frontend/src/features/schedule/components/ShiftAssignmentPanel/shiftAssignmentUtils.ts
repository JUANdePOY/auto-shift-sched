import type { Employee } from '../../../shared/types';
import type { ShiftAssignment } from './ShiftAssignmentTypes';

// Helper function to determine shift type based on start time
export const getShiftType = (time: string): 'opener' | 'mid' | 'closer' | 'graveyard' => {
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
export const getAvailableEmployees = (shift: ShiftAssignment, employees: Employee[]): Employee[] => {
  return employees.filter(employee => {
    if (!employee.station) return false;

    // Convert employee stations to array and clean up
    let employeeStations: string[] = [];

    if (Array.isArray(employee.station)) {
      // Handle nested array structure
      employeeStations = employee.station.flat().map(s => {
        if (typeof s === 'string') {
          return s.trim().toLowerCase();
        }
        if (typeof s === 'object' && s !== null && 'name' in s) {
          const name = (s as { name: unknown }).name;
          return typeof name === 'string' ? name.trim().toLowerCase() : '';
        }
        return String(s).trim().toLowerCase();
      });
    } else if (typeof employee.station === 'string') {
      // Handle single string with possible commas
      employeeStations = employee.station.split(',').map(s => s.trim().toLowerCase());
    } else {
      // Handle any other case by converting to string
      employeeStations = String(employee.station).split(',').map(s => s.trim().toLowerCase());
    }

    // Remove any empty strings from the array
    employeeStations = employeeStations.filter(s => s !== '');

    // Clean up required stations
    const trimmedRequiredStations = shift.requiredStation
      .filter(s => s != null && s !== '')
      .map(s => s.trim().toLowerCase());

    // Check for matches and store matching stations
    const matchingStations = trimmedRequiredStations.filter(required =>
      employeeStations.includes(required)
    );

    return matchingStations.length > 0 && employee.department === shift.department;
  });
};
