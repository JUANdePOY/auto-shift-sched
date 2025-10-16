import type { AvailabilitySubmission, AvailabilityStatus, AvailabilityHistory, AdminAvailabilitySubmission } from '../types/availability';

const API_BASE_URL = '/api/availability';

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const availabilityService = {
  // Get availability for specific employee and week
  async getAvailability(employeeId: number, weekStart: string): Promise<AvailabilitySubmission> {
    const response = await fetch(`${API_BASE_URL}/${employeeId}/${weekStart}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch availability: ${response.statusText}`);
    }
    return response.json();
  },

  // Submit availability for a week
  async submitAvailability(submission: Omit<AvailabilitySubmission, 'isLocked' | 'submissionDate' | 'status'>): Promise<AvailabilitySubmission> {
    const response = await fetch(`${API_BASE_URL}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(submission),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit availability');
    }

    return response.json();
  },

  // Lock availability submissions for a week (admin only)
  async lockAvailability(weekStart: string): Promise<{ message: string; lockedCount: number }> {
    const response = await fetch(`${API_BASE_URL}/lock`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ weekStart }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to lock availability');
    }

    return response.json();
  },

  // Get availability submission status for a week
  async getAvailabilityStatus(weekStart: string): Promise<AvailabilityStatus> {
    const response = await fetch(`${API_BASE_URL}/status/${weekStart}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch availability status: ${response.statusText}`);
    }
    return response.json();
  },

  // Get availability history for an employee
  async getAvailabilityHistory(employeeId: number): Promise<AvailabilityHistory> {
    const response = await fetch(`${API_BASE_URL}/history/${employeeId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch availability history: ${response.statusText}`);
    }
    return response.json();
  },

  // Get all availability submissions for a week (admin view)
  async getWeeklySubmissions(weekStart: string): Promise<AdminAvailabilitySubmission[]> {
    const response = await fetch(`${API_BASE_URL}/week/${weekStart}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch weekly submissions: ${response.statusText}`);
    }
    return response.json();
  },

  // Admin submit/update availability for an employee
  async adminSubmitAvailability(employeeId: number, weekStart: string, availability: Record<string, unknown>): Promise<AvailabilitySubmission> {
    const response = await fetch(`${API_BASE_URL}/admin/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ employeeId, weekStart, availability }),
    });
    if (!response.ok) {
      throw new Error(`Failed to submit admin availability: ${response.statusText}`);
    }
    return response.json();
  },
};
