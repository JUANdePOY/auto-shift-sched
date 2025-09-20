import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { getWeeklySchedule, saveFinalSchedule, getFinalSchedule, getFinalScheduleForWeek } from '../services/scheduleService';
import type { WeeklySchedule } from '../../shared/types';

export function useSchedule() {
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [finalSchedule, setFinalSchedule] = useState<Array<{
    shift_id: number;
    employee_id: number;
    shift_title: string;
    date: string;
    startTime: string;
    endTime: string;
    employee_name: string;
    required_stations: string[];
  }> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Flag to prevent infinite loops
  const isInitializedRef = useRef(false);
  const isManualRefreshRef = useRef(false);

  const fetchSchedule = useCallback(async (weekStart: string = '2025-01-20') => {
    try {
      setLoading(true);
      setError(null);
      console.log('📡 Fetching schedule for week:', weekStart);

      const fetchedSchedule = await getWeeklySchedule(weekStart);
      setSchedule(fetchedSchedule);

      // Also fetch final schedule for the week
      const finalScheduleData = await getFinalScheduleForWeek(weekStart);
      setFinalSchedule(finalScheduleData);

      console.log('✅ Schedule fetched successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch schedule';
      setError(errorMessage);
      toast.error('Failed to load schedule');
      console.error('Error fetching schedule:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateShiftAssignment = useCallback((shiftId: string, employeeId: string, assign: boolean) => {
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
  }, [schedule]);

  const saveFinalScheduleForDay = useCallback(async (
    date: string,
    assignments: Array<{ shiftId: string; employeeId: string }>,
    notes?: string
  ) => {
    try {
      const result = await saveFinalSchedule(date, assignments, notes);
      toast.success(result.message);

      // Set flag to prevent infinite loop
      isManualRefreshRef.current = true;
      await fetchSchedule();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save final schedule';
      toast.error(errorMessage);
      throw err;
    }
  }, [fetchSchedule]);

  const fetchFinalSchedule = useCallback(async (date: string) => {
    try {
      const finalScheduleData = await getFinalSchedule(date);
      setFinalSchedule(finalScheduleData);
      return finalScheduleData;
    } catch (err) {
      console.error('Error fetching final schedule:', err);
      setFinalSchedule(null);
      return null;
    }
  }, []);

  const fetchFinalScheduleForWeek = useCallback(async (weekStart: string) => {
    try {
      const finalScheduleData = await getFinalScheduleForWeek(weekStart);

      // Only update state if the data has actually changed
      setFinalSchedule(prevData => {
        // Use a more reliable comparison method instead of JSON.stringify
        const hasChanged = !prevData && finalScheduleData ||
                          prevData && !finalScheduleData ||
                          (prevData && finalScheduleData &&
                           (prevData.length !== finalScheduleData.length ||
                            prevData.some((item, index) => {
                              const prevItem = prevData[index];
                              const newItem = finalScheduleData[index];
                              return Object.keys(prevItem).some((key: string) =>
                                prevItem[key as keyof typeof prevItem] !== newItem[key as keyof typeof newItem]
                              );
                            })));

        if (hasChanged) {
          return finalScheduleData;
        }
        return prevData;
      });
      return finalScheduleData;
    } catch (err) {
      console.error('Error fetching final schedule for week:', err);
      setFinalSchedule(null);
      return null;
    }
  }, []);

  const getShiftById = useCallback((shiftId: string) => {
    return schedule?.shifts.find(shift => shift.id === shiftId);
  }, [schedule]);

  // Only run once on mount - prevent infinite refresh
  useEffect(() => {
    if (!isInitializedRef.current) {
      console.log('🚀 Initializing schedule hook');
      isInitializedRef.current = true;
      fetchSchedule();
    }
  }, []); // Empty dependency array - only run once on mount

  return {
    schedule,
    finalSchedule,
    loading,
    error,
    fetchSchedule,
    fetchFinalSchedule,
    fetchFinalScheduleForWeek,
    updateShiftAssignment,
    saveFinalScheduleForDay,
    getShiftById
  };
}