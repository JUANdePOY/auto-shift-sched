import React, { createContext, useContext, useState, useEffect, type ReactNode, useMemo } from 'react';
import type { Employee } from '../../shared/types';
import { saveFinalSchedule } from '../services/scheduleService';

export interface TemporaryAssignment {
  shiftId: string;
  employeeId: string;
  employee?: Employee;
  shiftData?: {
    title: string;
    startTime: string;
    endTime: string;
    department: string;
    requiredStation: string[];
  };
}

interface TemporaryScheduleState {
  [date: string]: TemporaryAssignment[];
}

interface EmployeeWorkload {
  employeeId: string;
  employeeName: string;
  totalHours: number;
  totalShifts: number;
  status: 'underworked' | 'overworked' | 'balanced';
  departments: string[];
}

interface ScheduleConflict {
  date: string;
  employeeId: string;
  severity: 'warning' | 'error';
  message: string;
}

interface ScheduleSummary {
  employeeWorkloads: EmployeeWorkload[];
  conflicts: ScheduleConflict[];
  totalAssignments: number;
  totalDays: number;
  completedDays: number;
  assignments?: TemporaryScheduleState;
}

interface TemporaryScheduleContextType {
  assignments: TemporaryScheduleState;
  summary: ScheduleSummary;
  getAssignmentsForDate: (date: string) => TemporaryAssignment[];
  updateAssignment: (date: string, shiftId: string, employeeId: string | null, employee?: Employee, shiftData?: TemporaryAssignment['shiftData']) => void;
  clearAssignmentsForDate: (date: string) => void;
  clearAllAssignments: () => void;
  hasAssignmentsForDate: (date: string) => boolean;
  canSaveWeeklySchedule: () => boolean;
  saveWeeklySchedule: (weekDates: Date[]) => Promise<boolean>;
}

const TemporaryScheduleContext = createContext<TemporaryScheduleContextType | undefined>(undefined);

// localStorage key for persisting temporary assignments
const TEMPORARY_ASSIGNMENTS_KEY = 'shift-app-temporary-assignments';

// Helper functions for localStorage operations
const loadAssignmentsFromStorage = (): TemporaryScheduleState => {
  try {
    const stored = localStorage.getItem(TEMPORARY_ASSIGNMENTS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('Failed to load assignments from localStorage:', error);
    return {};
  }
};

const saveAssignmentsToStorage = (assignments: TemporaryScheduleState): void => {
  try {
    localStorage.setItem(TEMPORARY_ASSIGNMENTS_KEY, JSON.stringify(assignments));
  } catch (error) {
    console.warn('Failed to save assignments to localStorage:', error);
  }
};

interface TemporaryScheduleProviderProps {
  children: ReactNode;
}

export function TemporaryScheduleProvider({ children }: TemporaryScheduleProviderProps) {
  const [assignments, setAssignments] = useState<TemporaryScheduleState>(loadAssignmentsFromStorage);

  const getAssignmentsForDate = (date: string): TemporaryAssignment[] => {
    return assignments[date] || [];
  };

  const updateAssignment = (date: string, shiftId: string, employeeId: string | null, employee?: Employee, shiftData?: TemporaryAssignment['shiftData']) => {
    setAssignments(prev => {
      const dateAssignments = prev[date] || [];
      let updatedAssignments;

      if (employeeId === null) {
        // Remove assignment
        updatedAssignments = dateAssignments.filter(assignment => assignment.shiftId !== shiftId);
      } else {
        // Add or update assignment
        const existingIndex = dateAssignments.findIndex(assignment => assignment.shiftId === shiftId);
        const existingAssignment = dateAssignments[existingIndex];
        const newAssignment: TemporaryAssignment = {
          shiftId,
          employeeId,
          employee,
          shiftData: shiftData || existingAssignment?.shiftData
        };

        if (existingIndex >= 0) {
          updatedAssignments = [...dateAssignments];
          updatedAssignments[existingIndex] = newAssignment;
        } else {
          updatedAssignments = [...dateAssignments, newAssignment];
        }
      }

      return {
        ...prev,
        [date]: updatedAssignments
      };
    });
  };

  const clearAssignmentsForDate = (date: string) => {
    setAssignments(prev => {
      const newAssignments = { ...prev };
      delete newAssignments[date];
      return newAssignments;
    });
  };

  const clearAllAssignments = () => {
    setAssignments({});
  };

  const hasAssignmentsForDate = (date: string): boolean => {
    return (assignments[date]?.length || 0) > 0;
  };

  // Calculate summary from assignments
  const summary = useMemo((): ScheduleSummary => {
    const employeeWorkloads: EmployeeWorkload[] = [];
    const conflicts: ScheduleConflict[] = [];
    let totalAssignments = 0;

    // Calculate total days and completed days
    const totalDays = 7; // Standard work week
    const completedDays = Object.keys(assignments).filter(date => assignments[date].length > 0).length;

    // Group assignments by employee
    const employeeMap = new Map<string, { name: string; assignments: TemporaryAssignment[] }>();

    Object.values(assignments).forEach(dateAssignments => {
      dateAssignments.forEach(assignment => {
        totalAssignments++;
        const employeeId = assignment.employeeId;
        const employeeName = assignment.employee?.name || `Employee ${employeeId}`;

        if (!employeeMap.has(employeeId)) {
          employeeMap.set(employeeId, { name: employeeName, assignments: [] });
        }
        employeeMap.get(employeeId)!.assignments.push(assignment);
      });
    });

    // Calculate workloads
    employeeMap.forEach((data, employeeId) => {
      const totalShifts = data.assignments.length;
      // Assume 6 hours per shift for simplicity
      const totalHours = totalShifts * 6;

      // Determine status based on hours
      let status: 'underworked' | 'overworked' | 'balanced' = 'balanced';
      if (totalHours < 20) {
        status = 'underworked';
      } else if (totalHours > 40) {
        status = 'overworked';
      }

      // Get departments from employee data (simplified for now)
      const departments = data.assignments[0]?.employee?.department ? [data.assignments[0].employee.department] : [];

      employeeWorkloads.push({
        employeeId,
        employeeName: data.name,
        totalHours,
        totalShifts,
        status,
        departments
      });

      // Check for conflicts (e.g., too many hours)
      if (totalHours > 40) {
        conflicts.push({
          date: '', // Weekly conflict
          employeeId,
          severity: 'warning',
          message: `Employee ${data.name} is scheduled for ${totalHours} hours this week`
        });
      }
    });

    return {
      employeeWorkloads,
      conflicts,
      totalAssignments,
      totalDays,
      completedDays
    };
  }, [assignments]);

  const canSaveWeeklySchedule = (): boolean => {
    return summary.totalAssignments > 0 && summary.conflicts.filter((c: ScheduleConflict) => c.severity === 'error').length === 0;
  };

  const saveWeeklySchedule = async (weekDates: Date[]): Promise<boolean> => {
    try {
      console.log('Saving weekly schedule:', assignments);

      // Loop through each date in the week
      for (const date of weekDates) {
        const dateString = date.getFullYear() + '-' +
          String(date.getMonth() + 1).padStart(2, '0') + '-' +
          String(date.getDate()).padStart(2, '0');

        const dateAssignments = assignments[dateString] || [];

        if (dateAssignments.length > 0) {
          // Format assignments for the API
          const formattedAssignments = dateAssignments.map(assignment => ({
            shiftId: assignment.shiftId,
            employeeId: assignment.employeeId,
            employeeName: assignment.employee?.name || '',
            shiftTitle: assignment.shiftData?.title || '', // Use stored shift data
            timeIn: assignment.shiftData?.startTime || null,
            timeOut: assignment.shiftData?.endTime || null,
            department: assignment.shiftData?.department || assignment.employee?.department || '',
            requiredStations: assignment.shiftData?.requiredStation || []
          }));

          // Save to final_schedule table via API
          await saveFinalSchedule(dateString, formattedAssignments, 'Weekly schedule save');
        }
      }

      // Clear all temporary assignments after successful save
      clearAllAssignments();
      
      // Clear localStorage as well
      localStorage.removeItem(TEMPORARY_ASSIGNMENTS_KEY);

      console.log('Weekly schedule saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving weekly schedule:', error);
      return false;
    }
  };

  // Persist assignments to localStorage whenever they change
  useEffect(() => {
    saveAssignmentsToStorage(assignments);
  }, [assignments]);

  const value: TemporaryScheduleContextType = {
    assignments,
    summary,
    getAssignmentsForDate,
    updateAssignment,
    clearAssignmentsForDate,
    clearAllAssignments,
    hasAssignmentsForDate,
    canSaveWeeklySchedule,
    saveWeeklySchedule
  };

  return (
    <TemporaryScheduleContext.Provider value={value}>
      {children}
    </TemporaryScheduleContext.Provider>
  );
}

export function useTemporarySchedule() {
  const context = useContext(TemporaryScheduleContext);
  if (context === undefined) {
    throw new Error('useTemporarySchedule must be used within a TemporaryScheduleProvider');
  }
  return context;
}
