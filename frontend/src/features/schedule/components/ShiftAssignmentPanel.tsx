import React, { useState, useEffect } from 'react';
import { Button } from '../../shared/components/ui/button';
import { Badge } from '../../shared/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/components/ui/select';
import { Input } from '../../shared/components/ui/input';
import { Label } from '../../shared/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../shared/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../shared/components/ui/table';
import { Tooltip, TooltipTrigger, TooltipContent } from '../../shared/components/ui/tooltip';
import { toast } from 'sonner';
import {
  Users,
  Clock,
  Zap,
  Save,
  RefreshCw,
  UserMinus,
  X,
  Plus,
  Trash2,
  Edit,
  Check,
} from 'lucide-react';
import { AISuggestionsPanel } from '../../ai-suggestions/components/AISuggestionPanel';
import EditShiftDialog from './EditShiftDialog';
import type { Employee, Department } from '../../../features/shared/types';
import { getAllDepartments } from '../../employees/services/departmentService';
import { createShift } from '../services/scheduleService';

interface ShiftAssignment {
  id: string;
  time: string;
  title: string;
  department: string;
  requiredStation: string[];
  assignedEmployee?: Employee;
  status: 'unassigned' | 'assigned' | 'conflict';
}

interface ShiftAssignmentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  employees: Employee[];
  onSaveFinalSchedule?: (date: string, assignments: Array<{ shiftId: string; employeeId: string }>, notes?: string) => Promise<void>;
}

// Helper function to calculate end time (start + 6 hours)
const calculateEndTime = (startTime: string): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);
  startDate.setHours(startDate.getHours() + 6);
  return startDate.toTimeString().slice(0, 5); // HH:MM format
};

const ShiftAssignmentPanel: React.FC<ShiftAssignmentPanelProps> = ({
  isOpen,
  onClose,
  date,
  employees,
  onSaveFinalSchedule
}) => {
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stations, setStations] = useState<{ id: string; name: string }[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(date);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftAssignment | null>(null);
  const [newShiftForm, setNewShiftForm] = useState({
    time: '09:00',
    title: '',
    department: '',
    requiredStation: [] as string[]
  });

  // AI Suggestion Panel state
  const [showAISuggestionPanel, setShowAISuggestionPanel] = useState(false);
  const [selectedShiftForAI, setSelectedShiftForAI] = useState<string | null>(null);

  // Handler to open AI suggestion panel when select employee is clicked
  const handleOpenAISuggestionPanel = (shiftId: string) => {
    setSelectedShiftForAI(shiftId);
    setShowAISuggestionPanel(true);
  };

  // Handler to close AI suggestion panel
  const handleCloseAISuggestionPanel = () => {
    setSelectedShiftForAI(null);
    setShowAISuggestionPanel(false);
  };

  // Handler to apply AI suggestion
  const handleApplyAISuggestion = (suggestion: { id: string }) => {
    handleAssignEmployee(selectedShiftForAI!, suggestion.id);
  };

  // Fetch departments and stations on component mount
  useEffect(() => {
    const fetchDepartmentsAndStations = async () => {
      try {
        const depts = await getAllDepartments();
        setDepartments(depts);
        // Flatten stations from all departments
        const allStations = depts.flatMap(dept => dept.stations);
        setStations(allStations);
      } catch (err) {
        console.error('Failed to fetch departments:', err);
        toast.error('Failed to load departments and stations');
      }
    };

    if (isOpen) {
      fetchDepartmentsAndStations();
    }
  }, [isOpen]);

  // Reset selectedDate when date prop changes
  useEffect(() => {
    setSelectedDate(date);
  }, [date]);

  // Initialize shift assignments when departments are loaded or selectedDate changes
  useEffect(() => {
    if (isOpen && assignments.length === 0 && departments.length > 0 && stations.length > 0) {
      const initialAssignments: ShiftAssignment[] = [];
      const timeSlots = [
        '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
        '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
        '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
      ];

      timeSlots.forEach((time, index) => {
        const department = departments[Math.floor(Math.random() * departments.length)];
        const station = department.stations[Math.floor(Math.random() * department.stations.length)];

        initialAssignments.push({
          id: `shift-${index + 1}`,
          time,
          title: `${department.name.charAt(0).toUpperCase() + department.name.slice(1)} Shift`,
          department: department.name,
          requiredStation: [station.name],
          status: 'unassigned'
        });
      });

      setAssignments(initialAssignments);
    }
  }, [isOpen, assignments.length, departments, stations, selectedDate]);

  const getAvailableEmployees = (shift: ShiftAssignment) => {
    return employees.filter(employee => {
      if (!employee.station) return false;

      // Handle both string and array cases for employee.station
      const employeeStations = Array.isArray(employee.station) ? employee.station : [employee.station];
      const hasMatchingStation = employeeStations.some((station: string) =>
        shift.requiredStation.includes(station)
      );

      return hasMatchingStation && employee.department === shift.department;
    });
  };

  const handleAssignEmployee = (shiftId: string, employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    setAssignments(prev => prev.map(assignment =>
      assignment.id === shiftId
        ? { ...assignment, assignedEmployee: employee, status: 'assigned' }
        : assignment
    ));
  };

  const handleUnassignEmployee = (shiftId: string) => {
    setAssignments(prev => prev.map(assignment =>
      assignment.id === shiftId
        ? { ...assignment, assignedEmployee: undefined, status: 'unassigned' }
        : assignment
    ));
  };

  const handleAutoAssign = async () => {
    setIsAutoAssigning(true);

    try {
      // First, save all current shifts to database to get proper IDs
      const savedShifts: Array<{ id: string; time: string; title: string; department: string; dbId: string }> = [];
      for (const assignment of assignments) {
        try {
          const shiftData = {
            title: assignment.title,
            startTime: assignment.time,
            endTime: assignment.time, // Use same time for end, can be adjusted later
            date: selectedDate,
            requiredStation: assignment.requiredStation,
            requiredEmployees: 1,
            assignedEmployees: [],
            isCompleted: false,
            priority: 'medium' as const,
            department: assignment.department
          };

          const savedShift = await createShift(shiftData);
          savedShifts.push({ ...assignment, dbId: savedShift.id });
        } catch (error) {
          console.error('Failed to save shift:', assignment, error);
        }
      }

      if (savedShifts.length === 0) {
        toast.error('No shifts to assign. Please add shifts first.');
        setIsAutoAssigning(false);
        return;
      }

      // Calculate week start and end dates
      const weekStart = new Date(selectedDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const startDateStr = weekStart.toISOString().split('T')[0];
      const endDateStr = weekEnd.toISOString().split('T')[0];

      // Import the schedule service
      const { generateAutomatedSchedule } = await import('../services/scheduleService');

      // Generate automated schedule using crew availability
      const result = await generateAutomatedSchedule(startDateStr, endDateStr);

      // Update assignments with the generated assignments
      const updatedAssignments = assignments.map(assignment => {
        // Find saved shift that matches this assignment
        const savedShift = savedShifts.find(s =>
          s.time === assignment.time &&
          s.title === assignment.title &&
          s.department === assignment.department
        );

        if (savedShift) {
          // Find assignment for this saved shift
          const matchingAssignment = result.assignments.find(a => a.shiftId === savedShift.dbId);

          if (matchingAssignment) {
            const employee = employees.find(emp => emp.id === matchingAssignment.employeeId);
            return {
              ...assignment,
              assignedEmployee: employee,
              status: 'assigned' as const
            };
          }
        }

        return assignment;
      });

      setAssignments(updatedAssignments);
      toast.success(`Auto-assignment completed! Coverage: ${result.coverageRate}%`);
    } catch (error) {
      console.error('Auto-assignment failed:', error);
      toast.error('Auto-assignment failed. Please check crew availability.');
    } finally {
      setIsAutoAssigning(false);
    }
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
          employeeId: assignment.assignedEmployee!.id,
          employeeName: assignment.assignedEmployee!.name,
          shiftTitle: assignment.title,
          department: assignment.department,
          requiredStations: assignment.requiredStation,
          time: assignment.time,
          startTime: assignment.time,
          endTime: assignment.time, // Use same time for end, can be adjusted later
          date: selectedDate
        }));

      await onSaveFinalSchedule(selectedDate, formattedAssignments);
      toast.success('Final schedule saved successfully!');
      onClose();
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
      title: newShiftForm.title,
      department: newShiftForm.department,
      requiredStation: newShiftForm.requiredStation,
      status: 'unassigned'
    };

    setAssignments(prev => [...prev, newAssignment]);
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
    setAssignments(prev => prev.filter(assignment => assignment.id !== shiftId));
    toast.success('Shift deleted successfully!');
  };

  const handleStationToggle = (station: string) => {
    setNewShiftForm(prev => ({
      ...prev,
      requiredStation: prev.requiredStation.includes(station)
        ? prev.requiredStation.filter(s => s !== station)
        : [...prev.requiredStation, station]
    }));
  };

  const handleEditShift = (shift: ShiftAssignment) => {
    setEditingShift(shift);
  };

  const handleSaveEdit = (shiftId: string, editForm: {
    department: string;
    requiredStation: string[];
    startTime: string;
    endTime: string;
  }) => {
    setAssignments(prev => prev.map(assignment =>
      assignment.id === shiftId
        ? {
            ...assignment,
            time: editForm.startTime,
            department: editForm.department,
            requiredStation: editForm.requiredStation,
            // If the assigned employee no longer matches the new department/stations, unassign them
            assignedEmployee: assignment.assignedEmployee &&
              getAvailableEmployees({
                ...assignment,
                department: editForm.department,
                requiredStation: editForm.requiredStation
              }).some(emp => emp.id === assignment.assignedEmployee?.id)
              ? assignment.assignedEmployee
              : undefined,
            status: assignment.assignedEmployee &&
              getAvailableEmployees({
                ...assignment,
                department: editForm.department,
                requiredStation: editForm.requiredStation
              }).some(emp => emp.id === assignment.assignedEmployee?.id)
              ? 'assigned'
              : 'unassigned'
          }
        : assignment
    ));

    toast.success('Shift updated successfully!');
  };

  const handleCloseEditDialog = () => {
    setEditingShift(null);
  };

  const assignedCount = assignments.filter(a => a.status === 'assigned').length;
  const totalCount = assignments.length;

  if (!isOpen) return null;

  // Sort assignments by time for table display
  const sortedAssignments = [...assignments].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div
      className="fixed inset-0 bg-background z-50 flex h-full text-sm font-sans text-foreground"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shift-assignment-panel-title"
    >
      {/* Main Content Area */}
      <div
        className={`${
          showAISuggestionPanel ? 'w-2/3' : 'w-full'
        } flex flex-col bg-background p-8 overflow-y-auto relative transition-all duration-300 shadow-lg`}
      >
        <header className="flex items-center justify-between mb-8 border-b border-muted pb-4">
          <h2
            id="shift-assignment-panel-title"
            className="text-3xl font-semibold flex items-center gap-3 text-blue-700"
          >
            <Users className="w-7 h-7" aria-hidden="true" />
            Daily Shift Assignments -{' '}
            <time dateTime={selectedDate} className="ml-2 font-mono text-lg text-muted-foreground">
              {new Date(selectedDate).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </h2>
          <button
            onClick={onClose}
            aria-label="Close shift assignment panel"
            className="text-muted-foreground hover:text-foreground transition rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <X className="w-6 h-6" />
          </button>
        </header>

        <div className="space-y-6 flex-1 overflow-y-auto">
          {/* Action Buttons */}
          <section
            className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border"
            aria-labelledby="action-buttons-heading"
          >
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setShowAddDialog(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                aria-label="Add new shift"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                Add Shift
              </Button>

              <Button
                onClick={handleAutoAssign}
                disabled={isAutoAssigning}
                variant="outline"
                className="flex items-center gap-2 border-purple-300 hover:bg-purple-50 hover:border-purple-400"
                aria-label={isAutoAssigning ? 'Auto-assigning shifts' : 'Auto-assign shifts'}
              >
                {isAutoAssigning ? (
                  <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Zap className="w-4 h-4" aria-hidden="true" />
                )}
                {isAutoAssigning ? 'Auto-Assigning...' : 'Auto-Assign'}
              </Button>

              <div
                className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border shadow-sm"
                role="status"
                aria-label={`Assignment progress: ${assignedCount} of ${totalCount} shifts assigned`}
              >
                <Users className="w-4 h-4 text-blue-600" aria-hidden="true" />
                <span className="text-sm font-medium">
                  {assignedCount}/{totalCount} Assigned
                </span>
                <div
                  className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={assignedCount}
                  aria-valuemax={totalCount}
                >
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${totalCount > 0 ? (assignedCount / totalCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Date Picker */}
              <div className="flex items-center gap-2">
                <Label htmlFor="schedule-date" className="text-sm font-medium">
                  Date:
                </Label>
                <Input
                  id="schedule-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-40"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="px-6 hover:bg-gray-50"
                aria-label="Cancel and close panel"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSchedule}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white shadow-sm px-6"
                aria-label="Save final schedule"
              >
                <Save className="w-4 h-4" aria-hidden="true" />
                Save Schedule
              </Button>
            </div>
          </section>

          {/* Shift Assignments Table */}
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-muted/50">
                  <TableHead className="font-semibold text-foreground">Required Station(s)</TableHead>
                  <TableHead className="font-semibold text-foreground">Time In and Out</TableHead>
                  <TableHead className="font-semibold text-foreground">Assigned Employee</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAssignments.map((assignment, index) => {
                  const availableEmployees = getAvailableEmployees(assignment);
                  const isEvenRow = index % 2 === 0;
                  return (
                    <TableRow
                      key={assignment.id}
                      className={`
                        ${isEvenRow ? 'bg-background' : 'bg-muted/20'}
                        ${assignment.status === 'assigned' ? 'bg-green-50/50 hover:bg-green-100/50' : 'hover:bg-muted/30'}
                        transition-colors duration-150
                      `}
                    >
                      <TableCell className="py-4">
                        <div className="flex flex-wrap gap-1">
                          {assignment.requiredStation.map((station, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {station}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium flex items-center gap-2 py-4">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-mono">
                          In: {assignment.time} Out: {calculateEndTime(assignment.time)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {assignment.assignedEmployee ? (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{assignment.assignedEmployee.name}</p>
                              <p className="text-sm text-muted-foreground">{assignment.assignedEmployee.role}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnassignEmployee(assignment.id)}
                              title="Unassign employee"
                            >
                              <UserMinus className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <Select
                                  onValueChange={(value) => {
                                    handleAssignEmployee(assignment.id, value);
                                  }}
                                  onOpenChange={(open) => {
                                    if (open) {
                                      handleOpenAISuggestionPanel(assignment.id);
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select employee" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableEmployees.map(employee => (
                                      <SelectItem key={employee.id} value={employee.id}>
                                        <span>{employee.name} - {employee.role}</span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            {availableEmployees.length === 0 && (
                              <p className="text-xs text-muted-foreground">
                                No available employees
                              </p>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge
                          variant={assignment.status === 'assigned' ? 'default' : assignment.status === 'conflict' ? 'destructive' : 'secondary'}
                          className={`flex items-center gap-1 ${
                            assignment.status === 'assigned' ? 'bg-green-600 hover:bg-green-700' :
                            assignment.status === 'conflict' ? 'bg-red-600 hover:bg-red-700' :
                            'bg-gray-500 hover:bg-gray-600'
                          }`}
                        >
                          {assignment.status === 'assigned' && <Check className="w-3 h-3" />}
                          {assignment.status === 'conflict' && <X className="w-3 h-3" />}
                          {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditShift(assignment)}
                                className="hover:bg-blue-50 hover:text-blue-600"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit shift details</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteShift(assignment.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete shift</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Right Side AI Suggestion Panel */}
      {showAISuggestionPanel && selectedShiftForAI && (
        <div className="w-1/3 bg-background border-l border-border flex flex-col overflow-hidden">
          <AISuggestionsPanel
            isOpen={showAISuggestionPanel}
            onClose={handleCloseAISuggestionPanel}
            shiftId={selectedShiftForAI}
            shiftTitle={assignments.find(a => a.id === selectedShiftForAI)?.title || ''}
            shiftTime={assignments.find(a => a.id === selectedShiftForAI)?.time || ''}
            department={assignments.find(a => a.id === selectedShiftForAI)?.department || ''}
            requiredStations={assignments.find(a => a.id === selectedShiftForAI)?.requiredStation || []}
            availableEmployees={getAvailableEmployees(assignments.find(a => a.id === selectedShiftForAI)!)}
            employees={employees}
            onApplySuggestion={(suggestion: { id: string }) => handleApplyAISuggestion(suggestion)}
            mode="panel"
          />
        </div>
      )}

      {/* Edit Shift Dialog */}
      <EditShiftDialog
        isOpen={!!editingShift}
        onClose={handleCloseEditDialog}
        shift={editingShift}
        departments={departments}
        onSave={handleSaveEdit}
      />

      {/* Add Shift Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Shift</DialogTitle>
            <DialogDescription>
              Create a new shift assignment for the selected date.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Time
              </Label>
              <Input
                id="time"
                type="time"
                value={newShiftForm.time}
                onChange={(e) => setNewShiftForm(prev => ({ ...prev, time: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={newShiftForm.title}
                onChange={(e) => setNewShiftForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Morning Shift"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Department
              </Label>
              <Select
                value={newShiftForm.department}
                onValueChange={(value) => setNewShiftForm(prev => ({ ...prev, department: value }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Stations
              </Label>
              <div className="col-span-3 space-y-2">
                {departments
                  .find(dept => dept.name === newShiftForm.department)
                  ?.stations.map(station => (
                    <div key={station.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={station.id}
                        checked={newShiftForm.requiredStation.includes(station.name)}
                        onChange={() => handleStationToggle(station.name)}
                        className="rounded"
                      />
                      <Label htmlFor={station.id} className="text-sm">
                        {station.name}
                      </Label>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddShift}>
              Add Shift
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShiftAssignmentPanel;
