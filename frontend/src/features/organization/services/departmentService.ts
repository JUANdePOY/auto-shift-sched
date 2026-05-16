import type { Department, Station, DepartmentFormData, StationFormData } from '../types';

const API_BASE = '/api';

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export async function getDepartments(): Promise<Department[]> {
  const response = await fetch(`${API_BASE}/departments`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch departments');
  }
  return response.json();
}

export async function createDepartment(data: DepartmentFormData): Promise<Department> {
  const response = await fetch(`${API_BASE}/departments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create department');
  }
  return response.json();
}

export async function updateDepartment(id: string, data: Partial<DepartmentFormData>): Promise<Department> {
  const response = await fetch(`${API_BASE}/departments/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to update department with id ${id}`);
  }
  return response.json();
}

export async function deleteDepartment(id: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE}/departments/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to delete department with id ${id}`);
  }
  return response.json();
}

export async function getStations(): Promise<Station[]> {
  const response = await fetch(`${API_BASE}/stations`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch stations');
  }
  return response.json();
}

export async function createStation(data: StationFormData): Promise<Station> {
  const response = await fetch(`${API_BASE}/stations`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create station');
  }
  return response.json();
}

export async function updateStation(id: string, data: Partial<StationFormData>): Promise<Station> {
  const response = await fetch(`${API_BASE}/stations/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to update station with id ${id}`);
  }
  return response.json();
}

export async function deleteStation(id: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE}/stations/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to delete station with id ${id}`);
  }
  return response.json();
}