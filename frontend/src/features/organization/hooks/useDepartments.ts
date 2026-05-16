import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getStations,
  createStation,
  updateStation,
  deleteStation,
} from '../services/departmentService';
import type { Department, Station, DepartmentFormData, StationFormData } from '../types';

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDepartments();
      setDepartments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch departments');
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  }, []);

  const addDepartment = useCallback(async (data: DepartmentFormData) => {
    try {
      const newDepartment = await createDepartment(data);
      setDepartments(prev => [...prev, newDepartment]);
      toast.success('Department created successfully');
      return newDepartment;
    } catch (err) {
      toast.error('Failed to create department');
      throw err;
    }
  }, []);

  const editDepartment = useCallback(async (id: string, data: Partial<DepartmentFormData>) => {
    try {
      const updatedDepartment = await updateDepartment(id, data);
      setDepartments(prev => prev.map(dept => dept.id === id ? updatedDepartment : dept));
      toast.success('Department updated successfully');
      return updatedDepartment;
    } catch (err) {
      toast.error('Failed to update department');
      throw err;
    }
  }, []);

  const removeDepartment = useCallback(async (id: string) => {
    try {
      await deleteDepartment(id);
      setDepartments(prev => prev.filter(dept => dept.id !== id));
      toast.success('Department deleted successfully');
    } catch (err) {
      toast.error('Failed to delete department');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  return { departments, loading, error, fetchDepartments, addDepartment, editDepartment, removeDepartment };
}

export function useStations() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStations();
      setStations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stations');
      toast.error('Failed to load stations');
    } finally {
      setLoading(false);
    }
  }, []);

  const addStation = useCallback(async (data: StationFormData) => {
    try {
      const newStation = await createStation(data);
      setStations(prev => [...prev, newStation]);
      toast.success('Station created successfully');
      return newStation;
    } catch (err) {
      toast.error('Failed to create station');
      throw err;
    }
  }, []);

  const editStation = useCallback(async (id: string, data: Partial<StationFormData>) => {
    try {
      const updatedStation = await updateStation(id, data);
      setStations(prev => prev.map(station => station.id === id ? updatedStation : station));
      toast.success('Station updated successfully');
      return updatedStation;
    } catch (err) {
      toast.error('Failed to update station');
      throw err;
    }
  }, []);

  const removeStation = useCallback(async (id: string) => {
    try {
      await deleteStation(id);
      setStations(prev => prev.filter(station => station.id !== id));
      toast.success('Station deleted successfully');
    } catch (err) {
      toast.error('Failed to delete station');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  return { stations, loading, error, fetchStations, addStation, editStation, removeStation };
}