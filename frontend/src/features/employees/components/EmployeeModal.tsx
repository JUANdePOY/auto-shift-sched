import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/components/ui/select';
import { Checkbox } from '../../shared/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../shared/components/ui/dialog';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Label } from '../../shared/components/ui/label';
import { toast } from 'sonner';
import type { Employee, Department, Station, WeeklyAvailability } from '../../shared/types';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (employeeData: Omit<Employee, 'id'>) => Promise<void>;
  initialData?: Employee | null;
  departments: Department[];
  stations: Station[];
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({ isOpen, onClose, onSubmit, initialData, departments, stations }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState<'Service' | 'Production'>('Service');
  const [selectedStations, setSelectedStations] = useState<string[]>([]);
  const [maxHoursPerWeek, setMaxHoursPerWeek] = useState(40);
  const [currentWeeklyHours, setCurrentWeeklyHours] = useState(0);
  const [availability, setAvailability] = useState<WeeklyAvailability>({
    monday: { available: false },
    tuesday: { available: false },
    wednesday: { available: false },
    thursday: { available: false },
    friday: { available: false },
    saturday: { available: false },
    sunday: { available: false }
  });

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setEmail(initialData.email);
      setDepartment(initialData.department);
      if (Array.isArray(initialData.station)) {
        setSelectedStations(initialData.station);
      } else if (initialData.station) {
        setSelectedStations([initialData.station]);
      } else {
        setSelectedStations([]);
      }
      setMaxHoursPerWeek(initialData.maxHoursPerWeek);
      setCurrentWeeklyHours(initialData.currentWeeklyHours);
      setAvailability(initialData.availability);
    } else {
      setName('');
      setEmail('');
      setDepartment('Service');
      setSelectedStations([]);
      setMaxHoursPerWeek(40);
      setCurrentWeeklyHours(0);
      setAvailability({
        monday: { available: false },
        tuesday: { available: false },
        wednesday: { available: false },
        thursday: { available: false },
        friday: { available: false },
        saturday: { available: false },
        sunday: { available: false }
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async () => {
    try {
      const employeeData = { 
        name, 
        email, 
        department, 
        station: selectedStations, 
        maxHoursPerWeek, 
        currentWeeklyHours,
        availability
      };
      await onSubmit(employeeData);
      onClose();
    } catch (error) {
      toast.error('Failed to save employee');
      console.error('Error saving employee:', error);
    }
  };

  const handleStationChange = (stationName: string, checked: boolean) => {
    if (checked) {
      setSelectedStations(prev => [...prev, stationName]);
    } else {
      setSelectedStations(prev => prev.filter(name => name !== stationName));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Update employee details' : 'Add a new employee to the system'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="department" className="text-right">Department</Label>
            <Select value={department} onValueChange={(value) => setDepartment(value as 'Service' | 'Production')}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Stations</Label>
            <div className="col-span-3 space-y-2 max-h-40 overflow-y-auto">
              {(() => {
                const selectedDept = departments.find(dept => dept.name === department);
                const deptId = selectedDept ? selectedDept.id : '';
                
                return stations
                  .filter(station => station.departmentId === deptId)
                  .map(station => (
                    <div key={station.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`station-${station.id}`}
                        checked={selectedStations.includes(station.name)}
                        onCheckedChange={(checked) => handleStationChange(station.name, checked as boolean)}
                      />
                      <Label htmlFor={`station-${station.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {station.name}
                      </Label>
                    </div>
                  ));
              })()}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="maxHours" className="text-right">Max Hours/Week</Label>
            <Input
              id="maxHours"
              type="number"
              value={maxHoursPerWeek}
              onChange={(e) => setMaxHoursPerWeek(Number(e.target.value))}
              className="col-span-3"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>{initialData ? 'Update' : 'Create'} Employee</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
