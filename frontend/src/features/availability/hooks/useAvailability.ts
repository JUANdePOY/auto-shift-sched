import { useState, useEffect } from 'react';
import { availabilityService } from '../services/availabilityService';
import type { AvailabilitySubmission, AvailabilityStatus, AvailabilityHistory } from '../types/availability';

export const useAvailability = (employeeId?: number, weekStart?: string) => {
  const [availability, setAvailability] = useState<AvailabilitySubmission | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = async (id: number, start: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await availabilityService.getAvailability(id, start);
      setAvailability(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch availability');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId && weekStart) {
      fetchAvailability(employeeId, weekStart);
    }
  }, [employeeId, weekStart]);

  const submitAvailability = async (submission: Omit<AvailabilitySubmission, 'isLocked' | 'submissionDate' | 'status'>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await availabilityService.submitAvailability(submission);
      setAvailability(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit availability');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    availability,
    loading,
    error,
    submitAvailability,
    refetch: () => employeeId && weekStart ? fetchAvailability(employeeId, weekStart) : Promise.resolve(),
  };
};

export const useAvailabilityStatus = (weekStart?: string) => {
  const [status, setStatus] = useState<AvailabilityStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async (start: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await availabilityService.getAvailabilityStatus(start);
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch availability status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (weekStart) {
      fetchStatus(weekStart);
    }
  }, [weekStart]);

  return {
    status,
    loading,
    error,
    refetch: () => weekStart ? fetchStatus(weekStart) : Promise.resolve(),
  };
};

export const useAvailabilityHistory = (employeeId?: number) => {
  const [history, setHistory] = useState<AvailabilityHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await availabilityService.getAvailabilityHistory(id);
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch availability history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) {
      fetchHistory(employeeId);
    }
  }, [employeeId]);

  return {
    history,
    loading,
    error,
    refetch: () => employeeId ? fetchHistory(employeeId) : Promise.resolve(),
  };
};
