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
  const { assignments: contextAssignments, updateAssignment } = useTemporarySchedule();

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
    Object.entries(contextAssignments).forEach(([assignmentDate, dateAssignments]) => {
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
      const weekDates = getWeekDates(date);
      const currentWeeklyHours = calculateCurrentWeeklyHours();

      // Get already assigned employee IDs for this date
      const assignedEmployeeIds = new Set();
      updatedAssignments.forEach(assignment => {
        if (assignment.status === 'assigned' && assignment.assignedEmployee?.id) {
          assignedEmployeeIds.add(assignment.assignedEmployee.id);
        }
      });
      
      // Add employees from temporary assignments
      const dateAssignments = contextAssignments[date] || [];
      dateAssignments.forEach(tempAssignment => {
        assignedEmployeeIds.add(tempAssignment.employeeId);
      });

      // Track employee assignments across the week for diversity
      const employeeWeeklyAssignments = new Map<string, {
        times: Set<string>;
        stations: Set<string>;
        days: Set<string>;
        totalHours: number;
      }>();

      // Initialize tracking for all employees
      employees.forEach(emp => {
        employeeWeeklyAssignments.set(emp.id, {
          times: new Set(),
          stations: new Set(),
          days: new Set(),
          totalHours: currentWeeklyHours[emp.id] || 0
        });
      });

      // Populate existing assignments from context
      weekDates.forEach(weekDate => {
        const weekAssignments = contextAssignments[weekDate] || [];
        weekAssignments.forEach(assignment => {
          const tracking = employeeWeeklyAssignments.get(assignment.employeeId);
          if (tracking && assignment.shiftData) {
            tracking.days.add(weekDate);
            tracking.times.add(assignment.shiftData.startTime);
            assignment.shiftData.requiredStation.forEach(station => {
              tracking.stations.add(station);
            });
          }
        });
      });

      // Sort shifts by priority (harder to fill shifts first)
      const sortedShifts = [...unassignedShifts].sort((a, b) => {
        // Prioritize shifts with fewer matching employees
        const aMatches = employees.filter(emp => canEmployeeWorkShift(emp, a, assignedEmployeeIds)).length;
        const bMatches = employees.filter(emp => canEmployeeWorkShift(emp, b, assignedEmployeeIds)).length;
        return aMatches - bMatches;
      });

      // Try AI suggestions first, fallback to enhanced assignment
      for (const shift of sortedShifts) {
        let assignedEmployee = null;

        try {
          // Try AI suggestions first
          const suggestions = await getEmployeeSuggestions(shift.id, date);
          
          if (suggestions.length > 0) {
            // Find the best available employee from AI suggestions
            const availableEmployee = suggestions.find(suggestion => {
              const employee = employees.find(emp => emp.id === suggestion.employee.id);
              return employee && canEmployeeWorkShift(employee, shift, assignedEmployeeIds);
            });

            if (availableEmployee) {
              assignedEmployee = employees.find(emp => emp.id === availableEmployee.employee.id);
            }
          }
        } catch (error) {
          console.warn(`AI suggestions failed for shift ${shift.id}, using enhanced assignment:`, error.message);
        }

        // Enhanced assignment logic if AI suggestions failed
        if (!assignedEmployee) {
          assignedEmployee = findBestEmployeeForShift(shift, employees, assignedEmployeeIds, employeeWeeklyAssignments);
        }

        if (assignedEmployee) {
          // Update the assignment
          const assignmentIndex = updatedAssignments.findIndex(a => a.id === shift.id);
          if (assignmentIndex !== -1) {
            updatedAssignments[assignmentIndex] = {
              ...updatedAssignments[assignmentIndex],
              assignedEmployee: assignedEmployee,
              status: 'assigned' as const
            };
            assignedEmployeeIds.add(assignedEmployee.id);
            assignedCount++;

            // Update tracking for diversity
            const tracking = employeeWeeklyAssignments.get(assignedEmployee.id);
            if (tracking) {
              tracking.days.add(date);
              tracking.times.add(shift.time);
              shift.requiredStation.forEach(station => {
                tracking.stations.add(station);
              });
              tracking.totalHours += calculateShiftHours(shift.time, shift.endTime);
            }
          }
        }
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

      if (assignedCount > 0) {
        const coverageRate = Math.round((assignedCount / unassignedShifts.length) * 100);
        toast.success(`Auto-assignment completed! ${assignedCount}/${unassignedShifts.length} shifts assigned (${coverageRate}% coverage)`);
      } else {
        toast.info('No shifts could be auto-assigned. Please check employee availability and station requirements.');
      }

    } catch (error) {
      console.error('Auto-assignment failed:', error);
      toast.error('Auto-assignment failed. Please try again.');
    } finally {
      setIsAutoAssigning(false);
    }
  };

  // Helper function to check if employee can work a shift
  const canEmployeeWorkShift = (employee: Employee, shift: ShiftAssignment, assignedIds: Set<string>): boolean => {
    if (assignedIds.has(employee.id)) return false;
    
    // Check station compatibility
    if (shift.requiredStation && shift.requiredStation.length > 0) {
      const employeeStations = Array.isArray(employee.station) 
        ? employee.station.flat().map(s => String(s).toLowerCase().trim())
        : String(employee.station || '').split(',').map(s => s.toLowerCase().trim());
      
      const hasMatchingStation = shift.requiredStation.some(required =>
        employeeStations.some(empStation =>
          empStation.includes(required.toLowerCase()) || required.toLowerCase().includes(empStation)
        )
      );
      
      if (!hasMatchingStation) return false;
    }
    
    return true;
  };

  // Enhanced employee selection for diversity
  const findBestEmployeeForShift = (
    shift: ShiftAssignment, 
    availableEmployees: Employee[], 
    assignedIds: Set<string>,
    weeklyTracking: Map<string, { times: Set<string>; stations: Set<string>; days: Set<string>; totalHours: number }>
  ): Employee | null => {
    const eligibleEmployees = availableEmployees.filter(emp => 
      canEmployeeWorkShift(emp, shift, assignedIds)
    );

    if (eligibleEmployees.length === 0) return null;

    // Score employees based on diversity and workload balance
    const scoredEmployees = eligibleEmployees.map(employee => {
      const tracking = weeklyTracking.get(employee.id);
      if (!tracking) return { employee, score: 0 };

      let score = 100; // Base score

      // Prefer employees with fewer total hours (workload balance)
      if (tracking.totalHours >= 24) {
        score -= 50; // Heavily penalize if already at 24+ hours
      } else if (tracking.totalHours >= 16) {
        score -= 20;
      } else if (tracking.totalHours < 8) {
        score += 30; // Bonus for underworked employees
      }

      // Diversity bonuses for employees with 24+ hour availability
      if (tracking.totalHours < 24) {
        // Time diversity bonus
        if (!tracking.times.has(shift.time)) {
          score += 15;
        }

        // Station diversity bonus
        const hasWorkedAnyStation = shift.requiredStation.some(station => 
          tracking.stations.has(station)
        );
        if (!hasWorkedAnyStation) {
          score += 10;
        }

        // Day spread bonus (prefer employees working fewer days)
        if (tracking.days.size < 4) {
          score += 5;
        }
      }

      // Slight preference for employees who haven't worked this day yet
      if (!tracking.days.has(date)) {
        score += 5;
      }

      return { employee, score };
    });

    // Sort by score (highest first) and return the best candidate
    scoredEmployees.sort((a, b) => b.score - a.score);
    return scoredEmployees[0]?.employee || null;
  };

  return {
    isAutoAssigning,
    handleAutoAssign,
    calculateCurrentWeeklyHours
  };
}
