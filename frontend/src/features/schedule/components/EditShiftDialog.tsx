import React, { useState, useEffect } from 'react';
import { Button } from '../../shared/components/ui/button';
import { Badge } from '../../shared/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/components/ui/select';
import { Input } from '../../shared/components/ui/input';
import { Label } from '../../shared/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../shared/components/ui/dialog';
import { Separator } from '../../shared/components/ui/separator';
import { Clock, Users, AlertCircle, Check, X as CancelIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { Employee, Department } from '../../../features/shared/types';

interface ShiftAssignment {
  id: string;
  time: string;
  title: string;
  department: string;
  requiredStation: string[];
  assignedEmployee?: Employee;
  status: 'unassigned' | 'assigned' | 'conflict';
  type: 'opener' | 'mid' | 'closer' | 'graveyard';
}

interface EditShiftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shift: ShiftAssignment | null;
  departments: Department[];
  onSave: (shiftId: string, editForm: {
    department: string;
    requiredStation: string[];
    startTime: string;
    endTime: string;
  }) => void;
}

const EditShiftDialog: React.FC<EditShiftDialogProps> = ({
  isOpen,
  onClose,
  shift,
  departments,
  onSave
}) => {
  const [editForm, setEditForm] = useState({
    department: '',
    requiredStation: [] as string[],
    startTime: '',
    endTime: ''
  });

  const [editFormErrors, setEditFormErrors] = useState<{
    startTime?: string;
    endTime?: string;
    department?: string;
    requiredStation?: string;
  }>({});

  // Initialize form when shift changes
  useEffect(() => {
    if (shift) {
      setEditForm({
        department: shift.department,
        requiredStation: [...shift.requiredStation],
        startTime: shift.time,
        endTime: calculateEndTime(shift.time)
      });
      setEditFormErrors({});
    }
  }, [shift]);

  // Helper function to calculate end time (start + 6 hours)
  const calculateEndTime = (startTime: string): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    startDate.setHours(startDate.getHours() + 6);
    return startDate.toTimeString().slice(0, 5); // HH:MM format
  };

  const validateEditForm = () => {
    const errors: typeof editFormErrors = {};

    if (!editForm.department) {
      errors.department = 'Department is required';
    }

    if (editForm.requiredStation.length === 0) {
      errors.requiredStation = 'At least one station must be selected';
    }

    if (!editForm.startTime) {
      errors.startTime = 'Start time is required';
    }

    if (!editForm.endTime) {
      errors.endTime = 'End time is required';
    }

    if (editForm.startTime && editForm.endTime) {
      const start = new Date(`1970-01-01T${editForm.startTime}:00`);
      const end = new Date(`1970-01-01T${editForm.endTime}:00`);
      if (end <= start) {
        errors.endTime = 'End time must be after start time';
      }
    }

    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Auto update end time when start time changes
  useEffect(() => {
    if (editForm.startTime) {
      const start = new Date(`1970-01-01T${editForm.startTime}:00`);
      const defaultEnd = new Date(start);
      defaultEnd.setHours(defaultEnd.getHours() + 6);
      const defaultEndStr = defaultEnd.toTimeString().slice(0, 5);
      if (!editForm.endTime || editForm.endTime <= editForm.startTime) {
        setEditForm(prev => ({ ...prev, endTime: defaultEndStr }));
      }
    }
  }, [editForm.endTime, editForm.startTime]);

  const handleSave = () => {
    if (!shift) return;

    if (!validateEditForm()) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    onSave(shift.id, editForm);
    handleClose();
  };

  const handleClose = () => {
    setEditFormErrors({});
    onClose();
  };

  const handleDepartmentChange = (department: string) => {
    setEditForm(prev => ({
      ...prev,
      department,
      requiredStation: [] // Reset stations when department changes
    }));
  };

  const handleStationToggle = (station: string) => {
    setEditForm(prev => ({
      ...prev,
      requiredStation: prev.requiredStation.includes(station)
        ? prev.requiredStation.filter(s => s !== station)
        : [...prev.requiredStation, station]
    }));
  };

  if (!shift) return null;

  const selectedDepartment = departments.find(dept => dept.name === editForm.department);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Edit Shift Details
          </DialogTitle>
          <DialogDescription>
            Modify the shift information and requirements below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Shift Info */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Current Shift Information
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Title:</span>
                <p className="font-medium">{shift.title}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Current Time:</span>
                <p className="font-medium">{shift.time} - {calculateEndTime(shift.time)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Department:</span>
                <p className="font-medium">{shift.department}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <Badge
                  variant={shift.status === 'assigned' ? 'default' : 'secondary'}
                  className="ml-2"
                >
                  {shift.status}
                </Badge>
              </div>
            </div>
            {shift.assignedEmployee && (
              <div className="mt-3 pt-3 border-t">
                <span className="text-muted-foreground">Assigned Employee:</span>
                <p className="font-medium">{shift.assignedEmployee.name} ({shift.assignedEmployee.role})</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Time Section */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Shift Time
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time *</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={editForm.startTime}
                  onChange={(e) => setEditForm(prev => ({ ...prev, startTime: e.target.value }))}
                  className={editFormErrors.startTime ? 'border-red-500 focus:ring-red-500' : ''}
                  aria-invalid={!!editFormErrors.startTime}
                  aria-describedby={editFormErrors.startTime ? 'start-time-error' : undefined}
                />
                {editFormErrors.startTime && (
                  <p id="start-time-error" className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {editFormErrors.startTime}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time *</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={editForm.endTime}
                  onChange={(e) => setEditForm(prev => ({ ...prev, endTime: e.target.value }))}
                  className={editFormErrors.endTime ? 'border-red-500 focus:ring-red-500' : ''}
                  aria-invalid={!!editFormErrors.endTime}
                  aria-describedby={editFormErrors.endTime ? 'end-time-error' : undefined}
                />
                {editFormErrors.endTime && (
                  <p id="end-time-error" className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {editFormErrors.endTime}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Department Section */}
          <div className="space-y-4">
            <h4 className="font-medium">Department *</h4>
            <div className="space-y-2">
              <Select
                value={editForm.department}
                onValueChange={handleDepartmentChange}
                aria-invalid={!!editFormErrors.department}
                aria-describedby={editFormErrors.department ? 'department-error' : undefined}
              >
                <SelectTrigger className={editFormErrors.department ? 'border-red-500 focus:ring-red-500' : ''}>
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
              {editFormErrors.department && (
                <p id="department-error" className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {editFormErrors.department}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Stations Section */}
          <div className="space-y-4">
            <h4 className="font-medium">Required Stations *</h4>
            {selectedDepartment ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto border rounded-md p-3 bg-background">
                  {selectedDepartment.stations.map(station => (
                    <div key={station.id} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`edit-${station.id}`}
                        checked={editForm.requiredStation.includes(station.name)}
                        onChange={() => handleStationToggle(station.name)}
                        className="rounded border-gray-300"
                        aria-invalid={!!editFormErrors.requiredStation}
                        aria-describedby={editFormErrors.requiredStation ? 'required-station-error' : undefined}
                      />
                      <Label htmlFor={`edit-${station.id}`} className="text-sm cursor-pointer flex-1">
                        {station.name}
                      </Label>
                    </div>
                  ))}
                </div>
                {editFormErrors.requiredStation && (
                  <p id="required-station-error" className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {editFormErrors.requiredStation}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Please select a department first to see available stations.
              </p>
            )}
          </div>

          {/* Current Stations Display */}
          {editForm.requiredStation.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Selected Stations:</Label>
              <div className="flex flex-wrap gap-2">
                {editForm.requiredStation.map((station, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {station}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            className="px-6"
          >
            <CancelIcon className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="px-6 bg-green-600 hover:bg-green-700"
          >
            <Check className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditShiftDialog;
