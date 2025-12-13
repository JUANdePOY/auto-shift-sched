import type { Employee } from '../types';

/**
 * Filters out admin employees from the employee list
 * Admin employees should not appear in scheduling, availability, or assignment lists
 * @param employees - Array of employees to filter
 * @returns Array of employees excluding admins
 */
export function filterNonAdminEmployees(employees: Employee[]): Employee[] {
  return employees.filter(employee => employee.role !== 'admin');
}

/**
 * Gets only admin employees from the employee list
 * @param employees - Array of employees to filter
 * @returns Array of admin employees only
 */
export function getAdminEmployees(employees: Employee[]): Employee[] {
  return employees.filter(employee => employee.role === 'admin');
}