import { useState, useEffect } from 'react';
import { getAllDepartments } from '../../employees/services/departmentService';
import { getAllShifts } from '../services/scheduleService';
import { getShiftType } from '../utils/shiftAssignmentUtils';
import type { Department, ShiftAssignment } from '../types/shiftAssignmentTypes';
import type { TemporaryAssignment } from '../contexts/TemporaryScheduleContext';

export const useShiftData = (isOpen: boolean, date: string, departments: Department[], employees: any[], getAssignmentsForDate: any) => {
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [departmentsData, setDepartments] = useState<Department[]>([]);
  const [stations, setStations] = useState<{ id: string; name: string }[]>([]);

  // Fetch departments and stations on component mount
  useEffect(() => {
    const fetchDepartmentsAndStations = async () => {
      try {
        const depts = await getAllDepartments();
        setDepartments(depts);
        // Flatten stations from all departments
        const allStations = depts.flatMap(dept => dept.stations);
        setStations(allStations);
      } catch (err) {
        console.error('Failed to fetch departments:', err);
        // toast.error('Failed to load departments and stations');
      }
    };

    if (isOpen) {
      fetchDepartmentsAndStations();
    }
  }, [isOpen]);

  // Reset assignments when date changes
  useEffect(() => {
    setAssignments([]);
  }, [date]);

  // Initialize shift assignments when departments are loaded or date changes
  useEffect(() => {
    const loadShifts = async () => {
      if (isOpen && assignments.length === 0 && departmentsData.length > 0 && stations.length > 0) {
        try {
          const fetchedShifts = await getAllShifts();
          const initialAssignments: ShiftAssignment[] = fetchedShifts.map((shift, index) => {
            let requiredStation: string[] = [];
            if (Array.isArray(shift.requiredStation)) {
              requiredStation = shift.requiredStation.map(s => String(s).trim().toLowerCase());
            } else if (shift.requiredStation) {
              requiredStation = [String(shift.requiredStation).trim().toLowerCase()];
            }
            return {
              id: `${shift.id}-${index}`,
              time: shift.startTime.slice(0, 5), // Ensure HH:MM format for frontend
              endTime: shift.endTime.slice(0, 5), // Ensure HH:MM format for frontend
              title: shift.title,
              department: shift.department || departmentsData[0]?.name || 'General',
              requiredStation,
              status: 'unassigned',
              type: getShiftType(shift.startTime.slice(0, 5))
            };
          });

          // Apply temporary assignments from context
          const tempAssignments = getAssignmentsForDate(date);
          const assignmentsWithTemp = initialAssignments.map(assignment => {
            const temp = tempAssignments.find((t: TemporaryAssignment) => t.shiftId === assignment.id);
            if (temp) {
              const employee = employees.find(e => e.id === temp.employeeId);
              return { ...assignment, assignedEmployee: employee, status: 'assigned' as const };
            }
            return assignment;
          });

          setAssignments(assignmentsWithTemp);
        } catch (error) {
          console.error('Failed to fetch shifts:', error);
          // toast.error('Failed to load shifts from database');
        }
      }
    };

    loadShifts();
  }, [isOpen, assignments.length, departmentsData, stations, date, getAssignmentsForDate, employees]);

  return {
    assignments,
    setAssignments,
    departments: departmentsData,
    stations
  };
};
