import type { CrewShift, CrewAvailability, CrewProfile, CrewStats } from '../types';
import { availabilityService } from '../../availability/services/availabilityService';

const API_BASE_URL = '/api/crew';

class CrewService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  async getUpcomingShifts(employeeId: string): Promise<CrewShift[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/${employeeId}/shifts/upcoming`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch upcoming shifts: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('Failed to fetch upcoming shifts:', error);
      throw error;
    }
  }

  async getProfile(employeeId: string): Promise<CrewProfile> {
    try {
      const response = await fetch(`${API_BASE_URL}/${employeeId}/profile`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch crew profile: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('Failed to fetch crew profile:', error);
      throw error;
    }
  }

  async getStats(employeeId: string): Promise<CrewStats> {
    try {
      const response = await fetch(`${API_BASE_URL}/${employeeId}/stats`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch crew stats: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('Failed to fetch crew stats:', error);
      throw error;
    }
  }

  async submitAvailability(employeeId: string, availability: Omit<CrewAvailability, 'id' | 'submittedAt'>): Promise<CrewAvailability> {
    try {
      // Map CrewAvailability to AvailabilitySubmission format
      const submission = {
        employeeId: parseInt(employeeId),
        weekStart: availability.weekStart,
        availability: availability.preferences as any // Cast to avoid type mismatch
      };

      const result = await availabilityService.submitAvailability(submission);

      // Map back to CrewAvailability format
      return {
        id: result.employeeId.toString(), // Use employeeId as id for now
        weekStart: result.weekStart,
        preferences: result.availability as any,
        submittedAt: result.submissionDate || new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to submit availability:', error);
      throw error;
    }
  }

  async getAvailability(employeeId: string, weekStart: string): Promise<CrewAvailability | null> {
    try {
      const result = await availabilityService.getAvailability(parseInt(employeeId), weekStart);

      if (result.status === 'not_submitted') {
        return null;
      }

      // Map AvailabilitySubmission to CrewAvailability format
      return {
        id: employeeId,
        weekStart: result.weekStart,
        preferences: result.availability as any,
        submittedAt: result.submissionDate || ''
      };
    } catch (error) {
      console.error('Failed to fetch availability:', error);
      throw error;
    }
  }

  async updateAvailability(employeeId: string, availabilityId: string, updates: Partial<CrewAvailability>): Promise<CrewAvailability> {
    try {
      // For updates, we need to submit a new availability (since availability_submissions doesn't support updates directly)
      // The backend handles this by allowing resubmission
      const submission = {
        employeeId: parseInt(employeeId),
        weekStart: updates.weekStart || '',
        availability: updates.preferences as any || {}
      };

      const result = await availabilityService.submitAvailability(submission);

      // Map back to CrewAvailability format
      return {
        id: availabilityId,
        weekStart: result.weekStart,
        preferences: result.availability as any,
        submittedAt: result.submissionDate || new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to update availability:', error);
      throw error;
    }
  }

  // New method to check if availability is locked for a week
  async getAvailabilityStatus(employeeId: string, weekStart: string): Promise<{ isLocked: boolean; submissionRate: number }> {
    try {
      const status = await availabilityService.getAvailabilityStatus(weekStart);
      return {
        isLocked: status.locked,
        submissionRate: status.submissionRate
      };
    } catch (error) {
      console.error('Failed to fetch availability status:', error);
      throw error;
    }
  }
}

export const crewService = new CrewService();
