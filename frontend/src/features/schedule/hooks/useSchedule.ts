import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getWeeklySchedule } from '../services/scheduleService';
import type { WeeklySchedule } from '../../shared/types';

export function useSchedule() {
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = async (weekStart: string = '2025-01-20') => {
    try {
      setLoading(true);
      setError(null);
      const fetchedSchedule = await getWeeklySchedule(weekStart);
      setSchedule(fetchedSchedule);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch schedule';
      setError(errorMessage);
      toast.error('Failed to load schedule');
      console.error('Error fetching schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateShiftAssignment = (shiftId: string, employeeId: string, assign: boolean) => {
    if (!schedule) return;

    const updatedShifts = schedule.shifts.map(shift => {
      if (shift.id === shiftId) {
        if (assign && !shift.assignedEmployees.includes(employeeId)) {
          return {
            ...shift,
            assignedEmployees: [...shift.assignedEmployees, employeeId]
          };
        } else if (!assign) {
          return {
            ...shift,
            assignedEmployees: shift.assignedEmployees.filter(id => id !== employeeId)
          };
        }
      }
      return shift;
    });

    const coverageRate = Math.round((updatedShifts.filter(s => 
      s.assignedEmployees.length >= s.requiredEmployees
    ).length / updatedShifts.length) * 100);

    setSchedule({
      ...schedule,
      shifts: updatedShifts,
      coverageRate,
      scheduleEfficiency: 75 // Placeholder for now
    });
  };

  const getShiftById = (shiftId: string) => {
    return schedule?.shifts.find(shift => shift.id === shiftId);
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  return {
    schedule,
    loading,
    error,
    fetchSchedule,
    updateShiftAssignment,
    getShiftById
  };
}
