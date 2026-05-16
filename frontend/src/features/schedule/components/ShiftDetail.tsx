import { useState } from 'react';
import { Badge } from '../../shared/components/ui/badge';
import { Button } from '../../shared/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../shared/components/ui/table';
import { AlertTriangle, Users, Clock, ChevronDown, ChevronUp, Check, Plus, Edit, Save } from 'lucide-react';
import type { Shift, Employee, ScheduleConflict } from '../../shared/types';

interface ShiftDetailProps {
  shift?: Shift;
  shifts?: Shift[];
  employees: Employee[];
  conflicts: ScheduleConflict[];
  date?: string;
  onClose?: () => void;
}

export function ShiftDetail({
  shift,
  employees,
  conflicts,
  onClose,
}: ShiftDetailProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle single shift or shifts array
  const shifts = shift && !Array.isArray(shift) ? [shift] : [];
  const totalShifts = shifts.length;
  const assignedShifts = shifts.filter(s => s.assignedEmployees.length > 0).length;
  const totalEmployees = new Set(shifts.flatMap(s => s.assignedEmployees)).size;

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : 'Unknown';
  };

  const getEmployeeRole = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.role : '';
  };

  const getShiftConflicts = (shiftId: string) => {
    return conflicts.filter(conflict => conflict.shiftId === shiftId);
  };

  const getShiftType = (startTime: string): 'opener' | 'mid' | 'closer' | 'graveyard' => {
    const hour = parseInt(startTime.split(':')[0], 10);
    if (hour >= 6 && hour < 12) return 'opener';
    if (hour >= 12 && hour < 18) return 'mid';
    if (hour >= 18 && hour < 24) return 'closer';
    return 'graveyard';
  };

  if (!isExpanded || shifts.length === 0) {
    return (
      <div className="space-y-6">
        {/* Day Summary */}
        <div className="p-4 bg-muted/30 rounded-lg">
          <h4 className="text-lg font-semibold mb-2">
            Summary for {shift ? new Date(shift.date).toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }) : 'Unknown Date'}
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{totalShifts}</p>
              <p className="text-sm text-muted-foreground">Total Shifts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{assignedShifts}</p>
              <p className="text-sm text-muted-foreground">Assigned</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{totalEmployees}</p>
              <p className="text-sm text-muted-foreground">Employees</p>
            </div>
          </div>
        </div>

        {/* Quick Shift List */}
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 font-semibold">
            <Users className="w-5 h-5" />
            Today's Shifts
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {shifts.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="font-medium">{s.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {s.startTime} - {s.endTime} • {s.department}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {s.assignedEmployees.length > 0 && (
                    <Badge variant="default" className="bg-green-600">
                      <Check className="w-3 h-3 mr-1" />
                      {s.assignedEmployees.length}
                    </Badge>
                  )}
                  {getShiftConflicts(s.id).length > 0 && (
                    <Badge variant="destructive">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {getShiftConflicts(s.id).length}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={() => setIsExpanded(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ChevronDown className="w-4 h-4" />
            View Full Details
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with collapse button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Full Shift Details</h3>
        <Button
          onClick={() => setIsExpanded(false)}
          variant="ghost"
          size="sm"
          className="flex items-center gap-2"
        >
          <ChevronUp className="w-4 h-4" />
          Collapse
        </Button>
      </div>

      {/* Full Details Table */}
      <div className="border rounded-2x1 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-semibold">Time</TableHead>
              <TableHead className="font-semibold">Title</TableHead>
              <TableHead className="font-semibold">Department</TableHead>
              <TableHead className="font-semibold">Required Skills</TableHead>
              <TableHead className="font-semibold">Type</TableHead>
              <TableHead className="font-semibold">Assigned Employees</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts.map((s, index) => {
              const shiftConflicts = getShiftConflicts(s.id);
              const isEvenRow = index % 2 === 0;
              return (
                <TableRow
                  key={s.id}
                  className={`
                    ${isEvenRow ? 'bg-background' : 'bg-muted/20'}
                    ${s.assignedEmployees.length > 0 ? 'bg-green-50/50' : ''}
                    transition-colors duration-150
                  `}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-mono">
                        {s.startTime} - {s.endTime}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{s.title}</TableCell>
                  <TableCell className="capitalize">{s.department}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(s.requiredStation) && s.requiredStation.map((station: string) => (
                        <Badge key={station} variant="outline" className="text-xs">
                          {station.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {getShiftType(s.startTime)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {s.assignedEmployees.length > 0 ? (
                      <div className="space-y-1">
                        {s.assignedEmployees.map((empId: string) => (
                          <div key={empId} className="text-sm">
                            <p className="font-medium">{getEmployeeName(empId)}</p>
                            <p className="text-xs text-muted-foreground">{getEmployeeRole(empId)}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={s.assignedEmployees.length > 0 ? 'default' : 'secondary'}
                        className={s.assignedEmployees.length > 0 ? 'bg-green-600' : ''}
                      >
                        {s.assignedEmployees.length > 0 ? 'Assigned' : 'Unassigned'}
                      </Badge>
                      {shiftConflicts.length > 0 && (
                        <Badge variant="destructive">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {shiftConflicts.length}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => {
              // TODO: Implement create shift functionality
              console.log('Create shift for', shift?.date);
            }}
          >
            <Plus className="w-4 h-4" />
            Add Shift
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => {
              // TODO: Implement edit schedule functionality
              console.log('Edit schedule for', shift?.date);
            }}
          >
            <Edit className="w-4 h-4" />
            Edit Schedule
          </Button>
        </div>
        <Button
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          onClick={() => {
            // TODO: Implement save schedule functionality
            console.log('Save schedule for', shift?.date);
          }}
        >
          <Save className="w-4 h-4" />
          Create Schedule
        </Button>
      </div>

      {/* Conflicts Summary */}
      {conflicts.length > 0 && (
        <div>
          <h4 className="flex items-center gap-2 mb-2 font-semibold">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Conflicts ({conflicts.length})
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {conflicts.map((conflict, index) => (
              <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                {conflict.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}