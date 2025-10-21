import React, { useState, useEffect } from 'react';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../shared/components/ui/dialog';
import { toast } from 'sonner';
import type { EditShiftDialogProps } from './ShiftAssignmentTypes';

const EditShiftDialog: React.FC<EditShiftDialogProps> = ({
  isOpen,
  onClose,
  shift,
  departments,
  onSaveEdit
}) => {
  const [editForm, setEditForm] = useState({
    department: '',
    requiredStation: [] as string[],
    startTime: '',
    endTime: ''
  });

  useEffect(() => {
    if (shift && isOpen) {
      setEditForm({
        department: shift.department,
        requiredStation: [...shift.requiredStation],
        startTime: shift.time,
        endTime: shift.endTime
      });
    }
  }, [shift, isOpen]);

  const handleSaveEdit = () => {
    if (!editForm.department || editForm.requiredStation.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    onSaveEdit(shift!.id, editForm);
    onClose();
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Shift</DialogTitle>
          <DialogDescription>
            Modify the shift details for {shift.title}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startTime" className="text-right">
              Start Time
            </Label>
            <Input
              id="startTime"
              type="time"
              value={editForm.startTime}
              onChange={(e) => setEditForm(prev => ({ ...prev, startTime: e.target.value }))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endTime" className="text-right">
              End Time
            </Label>
            <Input
              id="endTime"
              type="time"
              value={editForm.endTime}
              onChange={(e) => setEditForm(prev => ({ ...prev, endTime: e.target.value }))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="department" className="text-right">
              Department
            </Label>
            <Select
              value={editForm.department}
              onValueChange={(value) => setEditForm(prev => ({ ...prev, department: value }))}
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
                .find((dept) => dept.name === editForm.department)
                ?.stations.map((station) => (
                  <div key={station.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={station.id}
                      checked={editForm.requiredStation.includes(station.name)}
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
          <Button onClick={handleSaveEdit}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditShiftDialog;
