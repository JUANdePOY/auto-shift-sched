import { toast } from 'sonner';
import type { Employee } from '../types';

export function useAssignments() {
  const handleAssignEmployee = (
    shiftId: string, 
    employeeId: string, 
    employees: Employee[],
    updateSchedule: (shiftId: string, employeeId: string, assign: boolean) => void,
    updateEmployeeHours: (employeeId: string, hoursChange: number) => void
  ) => {
    updateSchedule(shiftId, employeeId, true);
    updateEmployeeHours(employeeId, 8);

    const employeeName = employees.find(emp => emp.id === employeeId)?.name;
    toast.success(`Assigned ${employeeName} to shift`);
  };

  const handleUnassignEmployee = (
    shiftId: string, 
    employeeId: string, 
    employees: Employee[],
    updateSchedule: (shiftId: string, employeeId: string, assign: boolean) => void,
    updateEmployeeHours: (employeeId: string, hoursChange: number) => void
  ) => {
    updateSchedule(shiftId, employeeId, false);
    updateEmployeeHours(employeeId, -8);

    const employeeName = employees.find(emp => emp.id === employeeId)?.name;
    toast.success(`Unassigned ${employeeName} from shift`);
  };

  return {
    handleAssignEmployee,
    handleUnassignEmployee
  };
}
