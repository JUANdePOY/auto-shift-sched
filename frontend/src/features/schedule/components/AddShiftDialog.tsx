// ==================== ADD SHIFT DIALOG COMPONENT ====================

import React from 'react';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Label } from '../../shared/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../shared/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/components/ui/select';
import type { Department, NewShiftForm } from '../types/shiftAssignmentTypes';

interface AddShiftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  newShiftForm: NewShiftForm;
  onFormChange: (field: keyof NewShiftForm, value: any) => void;
  departments: Department[];
  onStationToggle: (station: string) => void;
  onAddShift: () => void;
}

const AddShiftDialog: React.FC<AddShiftDialogProps> = ({
  isOpen,
  onClose,
  newShiftForm,
  onFormChange,
  departments,
  onStationToggle,
  onAddShift
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
              onChange={(e) => onFormChange('time', e.target.value)}
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
              onChange={(e) => onFormChange('title', e.target.value)}
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
              onValueChange={(value) => onFormChange('department', value)}
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
                      onChange={() => onStationToggle(station.name)}
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
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onAddShift}>
            Add Shift
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddShiftDialog;
