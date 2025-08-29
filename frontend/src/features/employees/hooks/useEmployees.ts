import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getAllEmployees, createEmployee, updateEmployee, deleteEmployee } from '../services/employeeService';
import type { Employee } from '../../shared/types';
import { createAppError, logError, shouldShowErrorToUser } from '../../shared/utils/errorHandler';

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedEmployees = await getAllEmployees();
      setEmployees(fetchedEmployees);
    } catch (err) {
      const appError = createAppError(err, 'Failed to fetch employees');
      setError(appError.message);
      if (shouldShowErrorToUser(appError)) {
        toast.error(appError.message);
      }
      logError(appError, 'fetchEmployees');
    } finally {
      setLoading(false);
    }
  };

  const addEmployee = async (employeeData: Omit<Employee, 'id'>) => {
    try {
      const newEmployee = await createEmployee(employeeData);
      setEmployees(prev => [...prev, newEmployee]);
      toast.success('Employee created successfully');
      return newEmployee;
    } catch (err) {
      const appError = createAppError(err, 'Failed to create employee');
      if (shouldShowErrorToUser(appError)) {
        toast.error(appError.message);
      }
      logError(appError, 'addEmployee');
      throw new Error(appError.message);
    }
  };

  const editEmployee = async (id: string, employeeData: Partial<Omit<Employee, 'id'>>) => {
    try {
      const updatedEmployee = await updateEmployee(id, employeeData);
      setEmployees(prev => prev.map(emp => emp.id === id ? updatedEmployee : emp));
      toast.success('Employee updated successfully');
      return updatedEmployee;
    } catch (err) {
      const appError = createAppError(err, 'Failed to update employee');
      if (shouldShowErrorToUser(appError)) {
        toast.error(appError.message);
      }
      logError(appError, 'editEmployee');
      throw new Error(appError.message);
    }
  };

  const removeEmployee = async (id: string) => {
    try {
      await deleteEmployee(id);
      setEmployees(prev => prev.filter(emp => emp.id !== id));
      toast.success('Employee deleted successfully');
    } catch (err) {
      const appError = createAppError(err, 'Failed to delete employee');
      if (shouldShowErrorToUser(appError)) {
        toast.error(appError.message);
      }
      logError(appError, 'removeEmployee');
      throw new Error(appError.message);
    }
  };

  const updateEmployeeHours = (employeeId: string, hoursChange: number) => {
    setEmployees(prevEmployees => 
      prevEmployees.map(emp => 
        emp.id === employeeId 
          ? { ...emp, currentWeeklyHours: Math.max(0, emp.currentWeeklyHours + hoursChange) }
          : emp
      )
    );
  };

  const getEmployeeById = (employeeId: string) => {
    return employees.find(emp => emp.id === employeeId);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return {
    employees,
    loading,
    error,
    fetchEmployees,
    addEmployee,
    editEmployee,
    removeEmployee,
    updateEmployeeHours,
    getEmployeeById
  };
}
