import React, { useState } from 'react';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../shared/components/ui/dialog';
import { toast } from 'sonner';
import { calculateEndTime } from './shiftAssignmentUtils';
import type { AddShiftDialogProps, NewShiftForm } from './ShiftAssignmentTypes';

const AddShiftDialog: React.FC<AddShiftDialogProps> = ({
  isOpen,
  onClose,
  departments,
  onAddShift
}) => {
  const [newShiftForm, setNewShiftForm] = useState<NewShiftForm>({
    time: '09:00',
    title: '',
    department: '',
    requiredStation: []
  });

  const handleAddShift = () => {
    if (!newShiftForm.title || !newShiftForm.department || newShiftForm.requiredStation.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const shiftToAdd = {
      time: newShiftForm.time,
      endTime: calculateEndTime(newShiftForm.time),
      title: newShiftForm.title,
      department: newShiftForm.department,
      requiredStation: newShiftForm.requiredStation.map(s => s.trim().toLowerCase())
    };

    onAddShift(shiftToAdd);

    setNewShiftForm({
      time: '09:00',
      title: '',
      department: '',
      requiredStation: []
    });
    onClose();
  };

  const handleStationToggle = (station: string) => {
    setNewShiftForm(prev => ({
      ...prev,
      requiredStation: prev.requiredStation.includes(station)
        ? prev.requiredStation.filter(s => s !== station)
        : [...prev.requiredStation, station]
    }));
  };

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
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAddShift}>
            Add Shift
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddShiftDialog;
