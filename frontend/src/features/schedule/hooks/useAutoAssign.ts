import { useState } from 'react';
import { toast } from 'sonner';
import type { Employee } from '../../shared/types';
import { getEmployeeSuggestions } from '../services/scheduleService';
import { getWeekDates, calculateShiftHours } from '../utils/employeeHoursUtils';
import { useTemporarySchedule } from '../contexts/TemporaryScheduleContext';

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

interface UseAutoAssignProps {
  assignments: ShiftAssignment[];
  date: string;
  employees: Employee[];
  onAssignmentsUpdate: (assignments: ShiftAssignment[]) => void;
}

export function useAutoAssign({
  assignments,
  date,
  employees,
  onAssignmentsUpdate
}: UseAutoAssignProps) {
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const { assignments: tempAssignments, updateAssignment } = useTemporarySchedule();

  // Calculate current weekly hours for each employee
  const calculateCurrentWeeklyHours = () => {
    const weekDates = getWeekDates(date);
    const hoursMap: Record<string, number> = {};

    // Initialize all employees with 0 hours
    employees.forEach(employee => {
      hoursMap[employee.id] = 0;
    });

    // Add hours from current assignments in this session
    assignments.forEach(assignment => {
      if (assignment.assignedEmployee && weekDates.includes(date)) {
        const hours = calculateShiftHours(assignment.time, assignment.endTime);
        hoursMap[assignment.assignedEmployee.id] = (hoursMap[assignment.assignedEmployee.id] || 0) + hours;
      }
    });

    // Add hours from temporary assignments
    Object.entries(tempAssignments).forEach(([assignmentDate, dateAssignments]) => {
      if (weekDates.includes(assignmentDate)) {
        dateAssignments.forEach(tempAssignment => {
          // Find the shift to get hours
          const shift = assignments.find(a => a.id === tempAssignment.shiftId);
          if (shift) {
            const hours = calculateShiftHours(shift.time, shift.endTime);
            hoursMap[tempAssignment.employeeId] = (hoursMap[tempAssignment.employeeId] || 0) + hours;
          }
        });
      }
    });

    return hoursMap;
  };

  // Fair distribution fallback when no AI suggestions are available
  const assignFairly = (unassignedShifts: ShiftAssignment[], updatedAssignments: ShiftAssignment[]) => {
    const weeklyHours = calculateCurrentWeeklyHours();
    let assignedCount = 0;

    // Sort employees by current weekly hours (ascending - least hours first)
    const sortedEmployees = [...employees].sort((a, b) => {
      return (weeklyHours[a.id] || 0) - (weeklyHours[b.id] || 0);
    });

    // Assign shifts to employees with least hours first
    for (const shift of unassignedShifts) {
      // Find the employee with the least hours who isn't already assigned on this date
      const availableEmployee = sortedEmployees.find(employee => {
        // Check if employee is already assigned on this date
        const isAlreadyAssigned = updatedAssignments.some(assignment =>
          assignment.assignedEmployee?.id === employee.id &&
          assignment.status === 'assigned'
        );
        return !isAlreadyAssigned;
      });

      if (availableEmployee) {
        // Update the assignment
        const assignmentIndex = updatedAssignments.findIndex(a => a.id === shift.id);
        if (assignmentIndex !== -1) {
          updatedAssignments[assignmentIndex] = {
            ...updatedAssignments[assignmentIndex],
            assignedEmployee: availableEmployee,
            status: 'assigned' as const
          };
          assignedCount++;

          // Update weekly hours for this employee
          const hours = calculateShiftHours(shift.time, shift.endTime);
          weeklyHours[availableEmployee.id] = (weeklyHours[availableEmployee.id] || 0) + hours;

          // Re-sort employees after assignment
          sortedEmployees.sort((a, b) => {
            return (weeklyHours[a.id] || 0) - (weeklyHours[b.id] || 0);
          });
        }
      }
    }

    return assignedCount;
  };

  const handleAutoAssign = async () => {
    const unassignedShifts = assignments.filter(a => a.status === 'unassigned');

    if (unassignedShifts.length === 0) {
      toast.error('No unassigned shifts to auto-assign.');
      return;
    }

    setIsAutoAssigning(true);

    try {
      const updatedAssignments = [...assignments];
      let assignedCount = 0;

      // First, try to assign using AI suggestions
      const shiftsWithoutAISuggestions: ShiftAssignment[] = [];

      for (const shift of unassignedShifts) {
        try {
          // Get AI suggestions for this shift
          const suggestions = await getEmployeeSuggestions(shift.id, date);

          if (suggestions.length === 0) {
            shiftsWithoutAISuggestions.push(shift);
            continue;
          }

          // Find the best available employee (not already assigned on this date)
          const availableEmployee = suggestions.find(suggestion => {
            const employee = employees.find(emp => emp.id === suggestion.employee.id);
            if (!employee) return false;
            
            // Check if employee is already assigned on this date
            const isAlreadyAssigned = updatedAssignments.some(assignment =>
              assignment.assignedEmployee?.id === employee.id &&
              assignment.status === 'assigned'
            );
            return !isAlreadyAssigned;
          });

          if (!availableEmployee) {
            shiftsWithoutAISuggestions.push(shift);
            continue;
          }

          // Find the employee in our employees list
          const employee = employees.find(emp => emp.id === availableEmployee.employee.id);
          if (!employee) {
            console.warn(`Employee ${availableEmployee.employee.id} not found in employees list`);
            shiftsWithoutAISuggestions.push(shift);
            continue;
          }

          // Update the assignment
          const assignmentIndex = updatedAssignments.findIndex(a => a.id === shift.id);
          if (assignmentIndex !== -1) {
            updatedAssignments[assignmentIndex] = {
              ...updatedAssignments[assignmentIndex],
              assignedEmployee: employee,
              status: 'assigned' as const
            };
            assignedCount++;
          }

        } catch (error) {
          console.error(`Failed to get suggestions for shift ${shift.id}:`, error);
          shiftsWithoutAISuggestions.push(shift);
        }
      }

      // If there are shifts without AI suggestions, assign them fairly
      if (shiftsWithoutAISuggestions.length > 0) {
        const fairAssignedCount = assignFairly(shiftsWithoutAISuggestions, updatedAssignments);
        assignedCount += fairAssignedCount;
      }

      // Update the assignments in local state
      onAssignmentsUpdate(updatedAssignments);

      // Also update the TemporaryScheduleContext to persist assignments
      updatedAssignments.forEach(assignment => {
        if (assignment.assignedEmployee && assignment.status === 'assigned') {
          const shiftData = {
            title: assignment.title,
            startTime: assignment.time,
            endTime: assignment.endTime,
            department: assignment.department,
            requiredStation: assignment.requiredStation
          };
          updateAssignment(date, assignment.id, assignment.assignedEmployee.id, assignment.assignedEmployee, shiftData);
        }
      });

      const coverageRate = Math.round((assignedCount / unassignedShifts.length) * 100);
      toast.success(`Auto-assignment completed! ${assignedCount}/${unassignedShifts.length} shifts assigned (${coverageRate}% coverage)`);

    } catch (error) {
      console.error('Auto-assignment failed:', error);
      toast.error('Auto-assignment failed. Please try again.');
    } finally {
      setIsAutoAssigning(false);
    }
  };

  return {
    isAutoAssigning,
    handleAutoAssign
  };
}
