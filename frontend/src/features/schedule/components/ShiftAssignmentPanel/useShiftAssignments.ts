import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { Employee, Department } from '../../../shared/types';
import { getAllDepartments } from '../../../employees/services/departmentService';
import { createShift, getAllShifts, updateShift } from '../../services/scheduleService';
import type {
  ShiftAssignment,
  ShiftAssignmentPanelProps,
  UseShiftAssignmentsReturn
} from './ShiftAssignmentTypes';
import { getShiftType, getAvailableEmployees } from './shiftAssignmentUtils';

export const useShiftAssignments = (
  isOpen: boolean,
  date: string,
  employees: Employee[],
  onSaveFinalSchedule?: ShiftAssignmentPanelProps['onSaveFinalSchedule']
): UseShiftAssignmentsReturn => {
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stations, setStations] = useState<{ id: string; name: string }[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);

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
        toast.error('Failed to load departments and stations');
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
      if (isOpen && assignments.length === 0 && departments.length > 0 && stations.length > 0) {
        try {
          const fetchedShifts = await getAllShifts();
          const initialAssignments: ShiftAssignment[] = fetchedShifts.map(shift => ({
            id: shift.id,
            time: shift.startTime.slice(0, 5), // Ensure HH:MM format for frontend
            endTime: shift.endTime.slice(0, 5), // Ensure HH:MM format for frontend
            title: shift.title,
            department: shift.department || departments[0]?.name || 'General',
            requiredStation: Array.isArray(shift.requiredStation) ? shift.requiredStation.map(s => String(s).trim().toLowerCase()) : [],
            status: 'unassigned',
            type: getShiftType(shift.startTime.slice(0, 5))
          }));
          setAssignments(initialAssignments);
        } catch (error) {
          console.error('Failed to fetch shifts:', error);
          toast.error('Failed to load shifts from database');
        }
      }
    };

    loadShifts();
  }, [isOpen, assignments.length, departments, stations, date]);

  const handleAssignEmployee = (shiftId: string, employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    setAssignments(prev => prev.map(assignment =>
      assignment.id === shiftId
        ? { ...assignment, assignedEmployee: employee, status: 'assigned' }
        : assignment
    ));
  };

  const handleUnassignEmployee = (shiftId: string) => {
    setAssignments(prev => prev.map(assignment =>
      assignment.id === shiftId
        ? { ...assignment, assignedEmployee: undefined, status: 'unassigned' }
        : assignment
    ));
  };

  const handleAutoAssign = async () => {
    setIsAutoAssigning(true);

    try {
      // First, save all current shifts to database to get proper IDs
      const savedShifts: Array<{ id: string; time: string; title: string; department: string; dbId: string }> = [];
      for (const assignment of assignments) {
        try {
          const shiftData = {
            title: assignment.title,
            startTime: assignment.time,
            endTime: assignment.endTime,
            date: date,
            requiredStation: assignment.requiredStation,
            requiredEmployees: 1,
            assignedEmployees: [],
            isCompleted: false,
            priority: 'medium' as const,
            department: assignment.department
          };

          const savedShift = await createShift(shiftData);
          savedShifts.push({ ...assignment, dbId: savedShift.id });
        } catch (error) {
          console.error('Failed to save shift:', assignment, error);
        }
      }

      if (savedShifts.length === 0) {
        toast.error('No shifts to assign. Please add shifts first.');
        setIsAutoAssigning(false);
        return;
      }

      // Calculate week start and end dates
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const startDateStr = weekStart.toISOString().split('T')[0];
      const endDateStr = weekEnd.toISOString().split('T')[0];

      // Import the schedule service
      const { generateAutomatedSchedule } = await import('../../services/scheduleService');

      // Generate automated schedule using crew availability
      const result = await generateAutomatedSchedule(startDateStr, endDateStr);

      // Update assignments with the generated assignments
      const updatedAssignments = assignments.map(assignment => {
        // Find saved shift that matches this assignment
        const savedShift = savedShifts.find(s =>
          s.time === assignment.time &&
          s.title === assignment.title &&
          s.department === assignment.department
        );

        if (savedShift) {
          // Find assignment for this saved shift
          const matchingAssignment = result.assignments.find(a => a.shiftId === savedShift.dbId);

          if (matchingAssignment) {
            const employee = employees.find(emp => emp.id === matchingAssignment.employeeId);
            return {
              ...assignment,
              assignedEmployee: employee,
              status: 'assigned' as const
            };
          }
        }

        return assignment;
      });

      setAssignments(updatedAssignments);
      toast.success(`Auto-assignment completed! Coverage: ${result.coverageRate}%`);
    } catch (error) {
      console.error('Auto-assignment failed:', error);
      toast.error('Auto-assignment failed. Please check crew availability.');
    } finally {
      setIsAutoAssigning(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!onSaveFinalSchedule) {
      toast.error('Save function not available');
      return;
    }

    try {
      const formattedAssignments = assignments
        .filter(assignment => assignment.assignedEmployee)
        .map(assignment => ({
          shiftId: assignment.id,
          employeeId: assignment.assignedEmployee!.id
        }));

      await onSaveFinalSchedule(date, formattedAssignments);
      toast.success('Final schedule saved successfully!');
    } catch (error) {
      console.error('Failed to save final schedule:', error);
      toast.error('Failed to save final schedule');
    }
  };

  const handleAddShift = (shift: Omit<ShiftAssignment, 'id' | 'status' | 'type'>) => {
    const newAssignment: ShiftAssignment = {
      ...shift,
      id: `shift-${Date.now()}`,
      status: 'unassigned',
      type: getShiftType(shift.time)
    };

    setAssignments(prev => [...prev, newAssignment]);
    toast.success('Shift added successfully!');
  };

  const handleDeleteShift = (shiftId: string) => {
    setAssignments(prev => prev.filter(assignment => assignment.id !== shiftId));
    toast.success('Shift deleted successfully!');
  };

  const handleEditShift = () => {
    // This will be handled by the parent component
  };

  const handleSaveEdit = async (shiftId: string, editForm: {
    department: string;
    requiredStation: string[];
    startTime: string;
    endTime: string;
  }) => {
    try {
      // Ensure time format is HH:MM:SS for database consistency
      const formatTime = (time: string) => time.length === 5 ? `${time}:00` : time;

      // Update the shift in the database
      await updateShift(shiftId, {
        startTime: formatTime(editForm.startTime),
        endTime: formatTime(editForm.endTime),
        department: editForm.department,
        requiredStation: editForm.requiredStation
      });

      // Update local state
      setAssignments(prev => prev.map(assignment =>
        assignment.id === shiftId
          ? {
              ...assignment,
              time: editForm.startTime,
              endTime: editForm.endTime,
              department: editForm.department,
              requiredStation: editForm.requiredStation.map(s => s.trim().toLowerCase()),
              type: getShiftType(editForm.startTime),
              // If the assigned employee no longer matches the new department/stations, unassign them
              assignedEmployee: assignment.assignedEmployee &&
                getAvailableEmployees({
                  ...assignment,
                  department: editForm.department,
                  requiredStation: editForm.requiredStation.map(s => s.trim().toLowerCase())
                }, employees).some(emp => emp.id === assignment.assignedEmployee?.id)
                ? assignment.assignedEmployee
                : undefined,
              status: assignment.assignedEmployee &&
                getAvailableEmployees({
                  ...assignment,
                  department: editForm.department,
                  requiredStation: editForm.requiredStation.map(s => s.trim().toLowerCase())
                }, employees).some(emp => emp.id === assignment.assignedEmployee?.id)
                ? 'assigned'
                : 'unassigned'
            }
          : assignment
      ));

      toast.success('Shift updated successfully!');
    } catch (error) {
      console.error('Failed to update shift:', error);
      toast.error('Failed to update shift in database');
    }
  };

  return {
    assignments,
    departments,
    stations,
    typeFilter,
    setTypeFilter,
    isAutoAssigning,
    handleAssignEmployee,
    handleUnassignEmployee,
    handleAutoAssign,
    handleSaveSchedule,
    handleAddShift,
    handleDeleteShift,
    handleEditShift,
    handleSaveEdit,
    getAvailableEmployees: (shift: ShiftAssignment) => getAvailableEmployees(shift, employees)
  };
};
