import type { Department, Station } from '../../shared/types';

const API_URL = `http://${window.location.hostname}:3001/api/departments`;

/**
 * Fetches all departments from the API.
 * @returns A promise that resolves to an array of departments.
 */
export async function getAllDepartments(): Promise<Department[]> {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch departments');
  }
  return response.json();
}

/**
 * Creates a new department.
 * @param departmentData The data for the new department.
 * @returns A promise that resolves to the newly created department object.
 */
export async function createDepartment(departmentData: Omit<Department, 'id'>): Promise<Department> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(departmentData),
  });
  if (!response.ok) {
    throw new Error('Failed to create department');
  }
  return response.json();
}

/**
 * Updates an existing department.
 * @param id The ID of the department to update.
 * @param departmentData The new data for the department.
 * @returns A promise that resolves to the updated department object.
 */
export async function updateDepartment(id: string, departmentData: Partial<Omit<Department, 'id'>>): Promise<Department> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(departmentData),
  });
  if (!response.ok) {
    throw new Error(`Failed to update department with id ${id}`);
  }
  return response.json();
}

/**
 * Deletes a department by its ID.
 * @param id The ID of the department to delete.
 * @returns A promise that resolves when the department is deleted.
 */
export async function deleteDepartment(id: string): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to delete department with id ${id}`);
  }
  return response.json();
}

/**
 * Fetches all stations for a specific department.
 * @param departmentId The ID of the department to fetch stations for.
 * @returns A promise that resolves to an array of stations.
 */
export async function getStationsByDepartment(departmentId: string): Promise<Station[]> {
  const response = await fetch(`${API_URL}/${departmentId}/stations`);
  if (!response.ok) {
    throw new Error(`Failed to fetch stations for department with id ${departmentId}`);
  }
  return response.json();
}
