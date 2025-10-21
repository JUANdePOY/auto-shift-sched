import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/components/ui/select';
import { User } from 'lucide-react';
import type { Employee } from '../../shared/types';
import { parseTime } from '../utils/suggestionUtils';

interface QuickAssignSectionProps {
  availableEmployees: Employee[];
  requiredStations: string[];
  department: string;
  shiftTime?: string;
  shiftEndTime?: string;
  employeeCurrentHours: Record<string, number>;
  onQuickAssign: (employeeId: string) => void;
}

export function QuickAssignSection({
  availableEmployees,
  requiredStations,
  department,
  shiftTime,
  shiftEndTime,
  employeeCurrentHours,
  onQuickAssign
}: QuickAssignSectionProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  // Filter employees based on station and department requirements
  const filteredEmployees = availableEmployees.filter(employee => {
    if (!employee.station) return false;

    // Convert employee stations to array and clean up
    let employeeStations: string[] = [];

    if (Array.isArray(employee.station)) {
      // Handle nested array structure
      employeeStations = employee.station.flat().map(s => {
        if (typeof s === 'string') {
          return s.trim().toLowerCase();
        }
        if (typeof s === 'object' && s !== null && 'name' in s) {
          const name = (s as { name: unknown }).name;
          return typeof name === 'string' ? name.trim().toLowerCase() : '';
        }
        return String(s).trim().toLowerCase();
      });
    } else if (typeof employee.station === 'string') {
      // Handle single string with possible commas
      employeeStations = employee.station.split(',').map(s => s.trim().toLowerCase());
    } else {
      // Handle any other case by converting to string
      employeeStations = String(employee.station).split(',').map(s => s.trim().toLowerCase());
    }

    // Remove any empty strings from the array
    employeeStations = employeeStations.filter(s => s !== '');

    // Clean up required stations
    const trimmedRequiredStations = requiredStations
      .filter(s => s != null && s !== '')
      .map(s => s.trim().toLowerCase());

    // Check for matches and store matching stations
    const matchingStations = trimmedRequiredStations.filter(required =>
      employeeStations.includes(required)
    );

    return matchingStations.length > 0 && employee.department === department;
  });

  const handleAssign = () => {
    if (selectedEmployee) {
      onQuickAssign(selectedEmployee);
      setSelectedEmployee('');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <User className="w-4 h-4" />
          Quick Assign
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger>
            <SelectValue placeholder="Select employee" />
          </SelectTrigger>
          <SelectContent>
            {filteredEmployees.map(employee => {
              // Get actual current scheduled hours for the week
              const currentHours = employeeCurrentHours[employee.id] || 0;

              // Calculate shift duration in hours
              const shiftStartMinutes = shiftTime ? parseTime(shiftTime) : 0;
              const shiftEndMinutes = shiftEndTime ? parseTime(shiftEndTime) : 0;
              const shiftHours = (shiftEndMinutes - shiftStartMinutes) / 60;

              const afterHours = currentHours + shiftHours;

              return (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.name} - {employee.role} (Current: {currentHours.toFixed(1)} hrs, After: {afterHours.toFixed(1)} hrs)
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Button
          onClick={handleAssign}
          disabled={!selectedEmployee}
          size="sm"
          className="w-full"
        >
          Assign Selected
        </Button>
      </CardContent>
    </Card>
  );
}
