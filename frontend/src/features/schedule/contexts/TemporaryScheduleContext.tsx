import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface TemporaryAssignment {
  shiftId: string;
  employeeId: string;
  employeeName: string;
  shiftTitle: string;
  department: string;
  requiredStations: string[];
  time: string;
  startTime: string;
  endTime: string;
  date: string;
}

export interface DailySchedule {
  date: string;
  assignments: TemporaryAssignment[];
  isCompleted: boolean;
}

export interface WeeklyScheduleSummary {
  totalDays: number;
  completedDays: number;
  totalAssignments: number;
  employeeWorkloads: EmployeeWorkload[];
  conflicts: ScheduleConflict[];
}

export interface EmployeeWorkload {
  employeeId: string;
  employeeName: string;
  totalShifts: number;
  totalHours: number;
  status: 'underworked' | 'balanced' | 'overworked';
  departments: string[];
}

export interface ScheduleConflict {
  type: 'double-booking' | 'overtime' | 'station-mismatch';
  employeeId: string;
  employeeName: string;
  date?: string;
  message: string;
  severity: 'warning' | 'error';
}

interface TemporaryScheduleContextType {
  weeklySchedule: DailySchedule[];
  summary: WeeklyScheduleSummary;
  saveDailySchedule: (date: string, assignments: TemporaryAssignment[]) => void;
  getDailySchedule: (date: string) => DailySchedule | undefined;
  clearWeeklySchedule: () => void;
  canSaveWeeklySchedule: () => boolean;
  saveWeeklySchedule: () => Promise<boolean>;
}

const TemporaryScheduleContext = createContext<TemporaryScheduleContextType | undefined>(undefined);

const STORAGE_KEY = 'temporary-weekly-schedule';

export function TemporaryScheduleProvider({ children }: { children: ReactNode }) {
  const [weeklySchedule, setWeeklySchedule] = useState<DailySchedule[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setWeeklySchedule(parsed);
      } catch (error) {
        console.error('Failed to load temporary schedule from localStorage:', error);
      }
    }
  }, []);

  // Save to localStorage whenever weeklySchedule changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(weeklySchedule));
  }, [weeklySchedule]);

  const saveDailySchedule = (date: string, assignments: TemporaryAssignment[]) => {
    setWeeklySchedule(prev => {
      const existingIndex = prev.findIndex(day => day.date === date);
      const isCompleted = assignments.length > 0;

      if (existingIndex >= 0) {
        // Update existing day
        const updated = [...prev];
        updated[existingIndex] = { date, assignments, isCompleted };
        return updated;
      } else {
        // Add new day
        return [...prev, { date, assignments, isCompleted }];
      }
    });
  };

  const getDailySchedule = (date: string): DailySchedule | undefined => {
    return weeklySchedule.find(day => day.date === date);
  };

  const clearWeeklySchedule = () => {
    setWeeklySchedule([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const calculateEmployeeWorkloads = (): EmployeeWorkload[] => {
    const employeeMap = new Map<string, EmployeeWorkload>();

    weeklySchedule.forEach(day => {
      day.assignments.forEach(assignment => {
        const { employeeId, employeeName, startTime, endTime, department } = assignment;

        if (!employeeMap.has(employeeId)) {
          employeeMap.set(employeeId, {
            employeeId,
            employeeName,
            totalShifts: 0,
            totalHours: 0,
            status: 'underworked',
            departments: []
          });
        }

        const workload = employeeMap.get(employeeId)!;
        workload.totalShifts += 1;

        // Calculate hours from shift duration
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        workload.totalHours += hours;

        // Track departments
        if (!workload.departments.includes(department)) {
          workload.departments.push(department);
        }
      });
    });

    // Determine status based on total hours
    return Array.from(employeeMap.values()).map(workload => ({
      ...workload,
      status: workload.totalHours < 20 ? 'underworked' :
              workload.totalHours > 40 ? 'overworked' : 'balanced'
    }));
  };

  const detectConflicts = (): ScheduleConflict[] => {
    const conflicts: ScheduleConflict[] = [];

    // Check for double-bookings
    weeklySchedule.forEach(day => {
      const employeeAssignments = new Map<string, TemporaryAssignment[]>();

      day.assignments.forEach(assignment => {
        if (!employeeAssignments.has(assignment.employeeId)) {
          employeeAssignments.set(assignment.employeeId, []);
        }
        employeeAssignments.get(assignment.employeeId)!.push(assignment);
      });

      employeeAssignments.forEach((assignments, employeeId) => {
        if (assignments.length > 1) {
          // Check for overlapping times
          const sortedAssignments = assignments.sort((a, b) =>
            new Date(`2000-01-01T${a.startTime}`).getTime() -
            new Date(`2000-01-01T${b.startTime}`).getTime()
          );

          for (let i = 0; i < sortedAssignments.length - 1; i++) {
            const current = sortedAssignments[i];
            const next = sortedAssignments[i + 1];

            const currentEnd = new Date(`2000-01-01T${current.endTime}`);
            const nextStart = new Date(`2000-01-01T${next.startTime}`);

            if (currentEnd > nextStart) {
              conflicts.push({
                type: 'double-booking',
                employeeId,
                employeeName: current.employeeName,
                date: day.date,
                message: `Overlapping shifts on ${day.date}: ${current.shiftTitle} and ${next.shiftTitle}`,
                severity: 'error'
              });
            }
          }
        }
      });
    });

    // Check for overtime (>40 hours/week)
    const workloads = calculateEmployeeWorkloads();
    workloads.forEach(workload => {
      if (workload.totalHours > 40) {
        conflicts.push({
          type: 'overtime',
          employeeId: workload.employeeId,
          employeeName: workload.employeeName,
          message: `${workload.employeeName} is scheduled for ${workload.totalHours.toFixed(1)} hours (over 40-hour limit)`,
          severity: 'warning'
        });
      }
    });

    return conflicts;
  };

  const summary: WeeklyScheduleSummary = {
    totalDays: 7,
    completedDays: weeklySchedule.filter(day => day.isCompleted).length,
    totalAssignments: weeklySchedule.reduce((sum, day) => sum + day.assignments.length, 0),
    employeeWorkloads: calculateEmployeeWorkloads(),
    conflicts: detectConflicts()
  };

  const canSaveWeeklySchedule = (): boolean => {
    return summary.completedDays === 7 && summary.conflicts.filter(c => c.severity === 'error').length === 0;
  };

  const saveWeeklySchedule = async (): Promise<boolean> => {
    if (!canSaveWeeklySchedule()) {
      return false;
    }

    try {
      // Flatten all assignments for the week
      const allAssignments = weeklySchedule.flatMap(day =>
        day.assignments.map(assignment => ({
          ...assignment,
          date: day.date
        }))
      );

      // Group by date for API call
      const assignmentsByDate = allAssignments.reduce((acc, assignment) => {
        if (!acc[assignment.date]) {
          acc[assignment.date] = [];
        }
        acc[assignment.date].push(assignment);
        return acc;
      }, {} as Record<string, TemporaryAssignment[]>);

      // Save each day's schedule
      for (const [date, assignments] of Object.entries(assignmentsByDate)) {
        await fetch(`/api/schedule/save-final`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date,
            assignments: assignments.map(a => ({
              shiftId: a.shiftId,
              employeeId: a.employeeId,
              employeeName: a.employeeName,
              shiftTitle: a.shiftTitle,
              department: a.department,
              requiredStations: a.requiredStations,
              time: a.time,
              startTime: a.startTime,
              endTime: a.endTime
            }))
          })
        });
      }

      // Clear temporary schedule after successful save
      clearWeeklySchedule();
      return true;
    } catch (error) {
      console.error('Failed to save weekly schedule:', error);
      return false;
    }
  };

  return (
    <TemporaryScheduleContext.Provider value={{
      weeklySchedule,
      summary,
      saveDailySchedule,
      getDailySchedule,
      clearWeeklySchedule,
      canSaveWeeklySchedule,
      saveWeeklySchedule
    }}>
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
