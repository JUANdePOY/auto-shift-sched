import { useState, useEffect } from 'react';
import { crewService } from '../services/crewService';
import type { CrewShift, CrewProfile, CrewStats, CrewAvailability } from '../types';

export function useCrewData(employeeId: string) {
  const [profile, setProfile] = useState<CrewProfile | null>(null);
  const [upcomingShifts, setUpcomingShifts] = useState<CrewShift[]>([]);
  const [stats, setStats] = useState<CrewStats | null>(null);
  const [availability, setAvailability] = useState<CrewAvailability | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<{ isLocked: boolean; submissionRate: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      const data = await crewService.getProfile(employeeId);
      setProfile(data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load profile');
    }
  };

  const fetchUpcomingShifts = async () => {
    try {
      const data = await crewService.getUpcomingShifts(employeeId);
      setUpcomingShifts(data);
    } catch (err) {
      console.error('Failed to fetch upcoming shifts:', err);
      setError('Failed to load shifts');
    }
  };

  const fetchStats = async () => {
    try {
      const data = await crewService.getStats(employeeId);
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError('Failed to load stats');
    }
  };

  const fetchAvailability = async (weekStart: string) => {
    try {
      const data = await crewService.getAvailability(employeeId, weekStart);
      setAvailability(data);

      // Also fetch availability status for lock checking
      const status = await crewService.getAvailabilityStatus(employeeId, weekStart);
      setAvailabilityStatus(status);
    } catch (err) {
      console.error('Failed to fetch availability:', err);
      setError('Failed to load availability');
    }
  };

  const submitAvailability = async (availabilityData: Omit<CrewAvailability, 'id' | 'submittedAt'>) => {
    try {
      // Check if availability is locked before submitting
      const status = await crewService.getAvailabilityStatus(employeeId, availabilityData.weekStart);
      if (status.isLocked) {
        throw new Error('Availability submissions are locked for this week');
      }

      const data = await crewService.submitAvailability(employeeId, availabilityData);
      setAvailability(data);
      return data;
    } catch (err) {
      console.error('Failed to submit availability:', err);
      throw err;
    }
  };

  const updateAvailability = async (availabilityId: string, updates: Partial<CrewAvailability>) => {
    try {
      // Check if availability is locked before updating
      if (updates.weekStart) {
        const status = await crewService.getAvailabilityStatus(employeeId, updates.weekStart);
        if (status.isLocked) {
          throw new Error('Availability submissions are locked for this week');
        }
      }

      const data = await crewService.updateAvailability(employeeId, availabilityId, updates);
      setAvailability(data);
      return data;
    } catch (err) {
      console.error('Failed to update availability:', err);
      throw err;
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);

      await Promise.all([
        fetchProfile(),
        fetchUpcomingShifts(),
        fetchStats(),
      ]);

      setLoading(false);
    };

    if (employeeId) {
      fetchAllData();
    }
  }, [employeeId]);

  return {
    profile,
    upcomingShifts,
    stats,
    availability,
    availabilityStatus,
    loading,
    error,
    fetchAvailability,
    submitAvailability,
    updateAvailability,
    refetch: () => {
      fetchProfile();
      fetchUpcomingShifts();
      fetchStats();
    }
  };
}
