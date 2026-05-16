import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getAllShifts } from '../services/scheduleService';
import { getShiftType, formatTimeForDisplay } from '../utils/shiftUtils';
import type { Employee, Department } from '../../../features/shared/types';

interface ShiftAssignment {
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

export const useShifts = (
  isOpen: boolean,
  date: string,
  departments: Department[],
  stations: { id: string; name: string }[]
) => {
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAssignments([]);
  }, [date]);

  useEffect(() => {
    const loadShifts = async () => {
      if (!isOpen || assignments.length > 0 || departments.length === 0 || stations.length === 0) {
        return;
      }

      setLoading(true);
      try {
        const fetchedShifts = await getAllShifts();
        const initialAssignments: ShiftAssignment[] = fetchedShifts.map(shift => {
          let requiredStation: string[] = [];
          if (Array.isArray(shift.requiredStation)) {
            requiredStation = shift.requiredStation.map(s => String(s).trim().toLowerCase());
          } else if (shift.requiredStation) {
            requiredStation = [String(shift.requiredStation).trim().toLowerCase()];
          }
          return {
            id: shift.id,
            time: formatTimeForDisplay(shift.startTime),
            endTime: formatTimeForDisplay(shift.endTime),
            title: shift.title,
            department: shift.department || departments[0]?.name || 'General',
            requiredStation,
            status: 'unassigned',
            type: getShiftType(formatTimeForDisplay(shift.startTime))
          };
        });
        setAssignments(initialAssignments);
      } catch (error) {
        console.error('Failed to fetch shifts:', error);
        toast.error('Failed to load shifts from database');
      } finally {
        setLoading(false);
      }
    };

    loadShifts();
  }, [isOpen, assignments.length, departments, stations, date]);

  return { assignments, setAssignments, loading };
};
