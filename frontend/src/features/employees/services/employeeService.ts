import type { Employee } from '../../shared/types';

const API_URL = '/api/employees';

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

/**
 * Fetches all employees from the API.
 * @returns A promise that resolves to an array of employees.
 */
export async function getAllEmployees(): Promise<Employee[]> {
  const response = await fetch(API_URL, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch employees');
  }
  return response.json();
}

/**
 * Fetches a single employee by their ID.
 * @param id The ID of the employee to fetch.
 * @returns A promise that resolves to the employee object.
 */
export async function getEmployeeById(id: string): Promise<Employee> {
  const response = await fetch(`${API_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch employee with id ${id}`);
  }
  return response.json();
}

/**
 * Creates a new employee.
 * @param employeeData The data for the new employee.
 * @returns A promise that resolves to the newly created employee object.
 */
export async function createEmployee(employeeData: Omit<Employee, 'id'>): Promise<Employee> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(employeeData),
  });
  if (!response.ok) {
    throw new Error('Failed to create employee');
  }
  return response.json();
}

/**
 * Updates an existing employee.
 * @param id The ID of the employee to update.
 * @param employeeData The new data for the employee.
 * @returns A promise that resolves to the updated employee object.
 */
export async function updateEmployee(id: string, employeeData: Partial<Omit<Employee, 'id'>>): Promise<Employee> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(employeeData),
  });
  if (!response.ok) {
    throw new Error(`Failed to update employee with id ${id}`);
  }
  return response.json();
}

/**
 * Deletes an employee by their ID.
 * @param id The ID of the employee to delete.
 * @returns A promise that resolves when the employee is deleted.
 */
export async function deleteEmployee(id: string): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to delete employee with id ${id}`);
  }
  return response.json();
}
