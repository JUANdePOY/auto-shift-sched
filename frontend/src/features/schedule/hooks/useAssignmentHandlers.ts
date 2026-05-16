import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { updateShift } from '../services/scheduleService';
import type { ShiftAssignment, Employee, NewShiftForm, EditShiftForm } from '../types/shiftAssignmentTypes';
import { getAvailableEmployees, getShiftType, calculateEndTime } from '../utils/shiftAssignmentUtils';

interface UseAssignmentHandlersParams {
  assignments: ShiftAssignment[];
  setAssignments: (assignments: ShiftAssignment[]) => void;
  employees: Employee[];
  date: string;
  onSaveFinalSchedule?: (date: string, assignments: Array<{ shiftId: string; employeeId: string }>, notes?: string) => Promise<void>;
  onClose?: () => void;
  clearAssignmentsForDate: (date: string) => void;
  updateAssignment: (date: string, shiftId: string, employeeId: string | null, employee?: Employee, shiftData?: any) => void;
  departments: { id: string; name: string; stations: { id: string; name: string }[] }[];
}

export const useAssignmentHandlers = ({
  assignments,
  setAssignments,
  employees,
  date,
  onSaveFinalSchedule,
  clearAssignmentsForDate,
  updateAssignment,
  departments
}: UseAssignmentHandlersParams) => {
  // Form states
  const [newShiftForm, setNewShiftForm] = useState<NewShiftForm>({
    time: '09:00',
    title: '',
    department: '',
    requiredStation: []
  });

  const [editingShift, setEditingShift] = useState<ShiftAssignment | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Handler functions
  const handleAssignEmployee = (shiftId: string, employeeId: string) => {
    console.log('handleAssignEmployee called with:', { shiftId, employeeId });
    console.log('Available employees:', employees.map(e => ({ id: e.id, name: e.name })));

    const employee = employees.find(emp => emp.id == employeeId);
    console.log('Found employee:', employee);

    if (!employee) {
      console.error('Employee not found for ID:', employeeId);
      return;
    }

    // Find the shift data to include with the assignment
    const shift = assignments.find(a => a.id === shiftId);
    const shiftData = shift ? {
      title: shift.title,
      startTime: shift.time,
      endTime: shift.endTime,
      department: shift.department,
      requiredStation: shift.requiredStation
    } : undefined;

    // Update context - the UI will update via useEffect when context changes
    updateAssignment(date, shiftId, employeeId, employee, shiftData);
  };

  const handleUnassignEmployee = (shiftId: string) => {
    // Update context first - this will trigger the useEffect to update local state
    updateAssignment(date, shiftId, null);
  };

  const handleSaveSchedule = async () => {
    if (!onSaveFinalSchedule) {
      toast.error('Save function not available');
      return;
    }

    try {
      const formattedAssignments = assignments
        .filter(assignment => assignment.assignedEmployee)
        .map(assignment => ({
          shiftId: assignment.id,
          employeeId: assignment.assignedEmployee!.id
        }));

      await onSaveFinalSchedule(date, formattedAssignments);
      // Clear temporary assignments after saving to final schedule
      clearAssignmentsForDate(date);
      toast.success('Final schedule saved successfully!');
    } catch (error) {
      console.error('Failed to save final schedule:', error);
      toast.error('Failed to save final schedule');
    }
  };

  const handleAddShift = () => {
    if (!newShiftForm.title || !newShiftForm.department || newShiftForm.requiredStation.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newAssignment: ShiftAssignment = {
      id: `shift-${Date.now()}`,
      time: newShiftForm.time,
      endTime: calculateEndTime(newShiftForm.time),
      title: newShiftForm.title,
      department: newShiftForm.department,
      requiredStation: newShiftForm.requiredStation.map(s => s.trim().toLowerCase()),
      status: 'unassigned',
      type: getShiftType(newShiftForm.time)
    };

    setAssignments([...assignments, newAssignment]);
    setNewShiftForm({
      time: '09:00',
      title: '',
      department: '',
      requiredStation: []
    });
    setShowAddDialog(false);
    toast.success('Shift added successfully!');
  };

  const handleDeleteShift = (shiftId: string) => {
    setAssignments(assignments.filter(assignment => assignment.id !== shiftId));
    toast.success('Shift deleted successfully!');
  };

  const handleEditShift = (shift: ShiftAssignment) => {
    setEditingShift(shift);
  };

  const handleSaveEdit = async (shiftId: string, editForm: EditShiftForm) => {
    try {
      // Ensure time format is HH:MM:SS for database consistency
      const formatTime = (time: string) => time.length === 5 ? `${time}:00` : time;

      // Update the shift in the database
      await updateShift(shiftId, {
        startTime: formatTime(editForm.startTime),
        endTime: formatTime(editForm.endTime),
        department: editForm.department,
        requiredStation: editForm.requiredStation
      });

      // Update local state
      setAssignments(assignments.map(assignment =>
        assignment.id === shiftId
          ? {
              ...assignment,
              time: editForm.startTime,
              endTime: editForm.endTime,
              department: editForm.department,
              requiredStation: editForm.requiredStation.map(s => s.trim().toLowerCase()),
              type: getShiftType(editForm.startTime),
              // If the assigned employee no longer matches the new department/stations, unassign them
assignedEmployee: assignment.assignedEmployee &&
                 getAvailableEmployees(
                   {
                     ...assignment,
                     department: editForm.department,
                     requiredStation: editForm.requiredStation.map(s => s.trim().toLowerCase())
                   },
                   employees,
                   () => [],
                   date,
                   []
                 ).some(emp => emp.id === assignment.assignedEmployee?.id)
                 ? assignment.assignedEmployee
                 : undefined,
               status: assignment.assignedEmployee &&
                 getAvailableEmployees(
                   {
                     ...assignment,
                     department: editForm.department,
                     requiredStation: editForm.requiredStation.map(s => s.trim().toLowerCase())
                   },
                   employees,
                   () => [],
                   date,
                   []
                 ).some(emp => emp.id === assignment.assignedEmployee?.id)
                 ? 'assigned'
                 : 'unassigned'
            }
          : assignment
      ));

      toast.success('Shift updated successfully!');
    } catch (error) {
      console.error('Failed to update shift:', error);
      toast.error('Failed to update shift in database');
    }
  };

  const handleCloseEditDialog = () => {
    setEditingShift(null);
  };

  const handleApplyAISuggestion = (suggestion: any) => {
    if (suggestion.action) {
      const { shiftId, employeeId } = suggestion.action;
      handleAssignEmployee(shiftId, employeeId);
    }
  };

  const handleStationToggle = (stationName: string) => {
    setNewShiftForm(prev => ({
      ...prev,
      requiredStation: prev.requiredStation.includes(stationName)
        ? prev.requiredStation.filter(s => s !== stationName)
        : [...prev.requiredStation, stationName]
    }));
  };

  const handleFormChange = (field: string, value: any) => {
    setNewShiftForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return {
    // Form states
    newShiftForm,
    setNewShiftForm,
    editingShift,
    showAddDialog,
    setShowAddDialog,

    // Handlers
    handleAssignEmployee,
    handleUnassignEmployee,
    handleSaveSchedule,
    handleAddShift,
    handleDeleteShift,
    handleEditShift,
    handleSaveEdit,
    handleCloseEditDialog,
    handleApplyAISuggestion,
    handleStationToggle,
    handleFormChange
  };
};
