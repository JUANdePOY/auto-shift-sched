import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/components/ui/select';
import { User, Clock } from 'lucide-react';
import type { Employee } from '../../shared/types';
import { parseTime, calculateEmployeeScore } from '../utils/suggestionUtils';

interface QuickAssignSectionProps {
  availableEmployees: Employee[];
  requiredStations: string[];
  department: string;
  shiftTime?: string;
  shiftEndTime?: string;
  employeeCurrentHours: Record<string, number>;
  onQuickAssign: (employeeId: string) => void;
  assignedEmployeeIds?: string[];
}

export function QuickAssignSection({
  availableEmployees,
  requiredStations,
  department,
  shiftTime,
  shiftEndTime,
  employeeCurrentHours,
  onQuickAssign,
  assignedEmployeeIds = []
}: QuickAssignSectionProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  // Calculate shift duration for hours calculation
  const shiftDuration = useMemo(() => {
    if (!shiftTime || !shiftEndTime) return 0;
    const startMinutes = parseTime(shiftTime);
    const endMinutes = parseTime(shiftEndTime);
    return (endMinutes - startMinutes) / 60;
  }, [shiftTime, shiftEndTime]);

  // Filter and rank employees by station matching and current hours
  const rankedEmployees = useMemo(() => {
    if (!availableEmployees || !requiredStations || requiredStations.length === 0) {
      return [];
    }

    const filtered = availableEmployees.filter(employee => {
      // Skip employees already assigned on this date
      if (assignedEmployeeIds.includes(employee.id)) return false;
      
      if (!employee.station) return false;

      const employeeStations = Array.isArray(employee.station)
        ? employee.station.flat().map(s => String(s).toLowerCase().trim())
        : String(employee.station).split(',').map(s => s.toLowerCase().trim());

      const shiftStations = requiredStations.map(s => s.toLowerCase().trim());

      // Employee must have at least one exact matching station
      return shiftStations.some(shiftStation =>
        employeeStations.some(empStation =>
          empStation === shiftStation || 
          empStation.includes(shiftStation) || 
          shiftStation.includes(empStation)
        )
      );
    });

    // Rank employees by AI score (considers hours, skills, availability)
    return filtered.map(employee => {
      const currentHours = employeeCurrentHours[employee.id] || 0;
      const projectedHours = currentHours + shiftDuration;
      const score = calculateEmployeeScore(
        employee,
        undefined, // shiftDate not needed for quick assign
        shiftTime,
        shiftEndTime,
        requiredStations,
        currentHours
      );
      return { employee, currentHours, projectedHours, score };
    }).sort((a, b) => b.score - a.score);
  }, [availableEmployees?.length, requiredStations?.join(','), shiftTime, shiftEndTime, shiftDuration, assignedEmployeeIds?.join(',')]);

  const handleAssign = () => {
    if (selectedEmployee) {
      onQuickAssign(selectedEmployee);
      setSelectedEmployee('');
    }
  };

  // Only compute the expensive label when we have a real selection
  const selectedEntry = useMemo(
    () =>
      rankedEmployees.find(r => r.employee.id === selectedEmployee),
    [rankedEmployees, selectedEmployee]
  );
  const projectedHours = selectedEntry?.projectedHours ?? 0;
  const isOver40 = projectedHours > 40;
  const buttonLabel = selectedEmployee
    ? isOver40
      ? 'Assign (Over 40h)'
      : 'Assign Selected'
    : 'Assign Selected';

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
            <SelectValue placeholder={`Select employee (${rankedEmployees.length} available)`} />
          </SelectTrigger>
          <SelectContent>
            {rankedEmployees.length > 0 ? (
              rankedEmployees.map(({ employee, currentHours, projectedHours: pj }) => {
                const hoursWarning = pj > 40;
                return (
                  <SelectItem key={employee.id} value={employee.id}>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{employee.name}</span>
                      <div className="flex items-center gap-1 text-xs">
                        <Clock className="w-3 h-3" />
                        <span className={hoursWarning ? 'text-orange-600 font-medium' : 'text-muted-foreground'}>
                          {currentHours.toFixed(1)}h → {pj!.toFixed(1)}h
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                );
              })
            ) : (
              <SelectItem value="no-employees" disabled>
                No employees with matching stations
              </SelectItem>
            )}
          </SelectContent>
        </Select>

        <Button
          onClick={handleAssign}
          disabled={!selectedEmployee}
          size="sm"
          className="w-full"
        >
          {buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
