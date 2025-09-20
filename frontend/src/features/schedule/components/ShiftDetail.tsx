import { Button } from '../../shared/components/ui/button';
import { Badge } from '../../shared/components/ui/badge';
import { AlertTriangle, Users, Edit, Trash2, Plus } from 'lucide-react';
import type { Shift, Employee, ScheduleConflict } from '../../shared/types';

interface ShiftDetailProps {
  shift: Shift;
  employees: Employee[];
  conflicts: ScheduleConflict[];
  onAssignEmployee: (shiftId: string, employeeId: string) => void;
  onUnassignEmployee: (shiftId: string, employeeId: string) => void;
  onEditShift: () => void;
  getEmployeeName: (employeeId: string) => string;
}

export function ShiftDetail({
  shift,
  employees,
  conflicts,
  onAssignEmployee,
  onUnassignEmployee,
  onEditShift,
}: ShiftDetailProps) {
  const availableEmployees = employees.filter((emp: Employee) =>
    !shift.assignedEmployees.includes(emp.id) &&
    Array.isArray(shift.requiredStation) && shift.requiredStation.some((station: string) => emp.station?.includes(station))
  );

  return (
    <div className="space-y-6">

      {/* Shift Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Time</p>
          <p>{shift.startTime} - {shift.endTime}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Department</p>
          <p className="capitalize">{shift.department}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Priority</p>
          <Badge variant={shift.priority === 'high' ? 'destructive' :
                         shift.priority === 'medium' ? 'default' : 'secondary'}>
            {shift.priority}
          </Badge>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Required Skills</p>
          <div className="flex gap-1 flex-wrap">
            {Array.isArray(shift.requiredStation) && shift.requiredStation.map(station => (
              <Badge key={station} variant="outline" className="text-xs">
                {station.replace('_', ' ')}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div>
          <h4 className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Conflicts
          </h4>
          <div className="space-y-2">
            {conflicts.map((conflict, index) => (
              <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                {conflict.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assigned Employees */}
      <div>
        <h4 className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4" />
          Assigned Employees ({shift.assignedEmployees.length}/{shift.requiredEmployees})
        </h4>
        <div className="space-y-2">
          {shift.assignedEmployees.map(empId => {
            const employee = employees.find(emp => emp.id === empId);
            return (
              <div key={empId} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div>
                  <p className="text-sm">{employee?.name}</p>
                  <p className="text-xs text-muted-foreground">{employee?.role}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUnassignEmployee(shift.id, empId)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Available Employees */}
      {availableEmployees.length > 0 && (
        <div>
          <h4>Available Employees</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {availableEmployees.slice(0, 5).map(employee => (
              <div key={employee.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <div>
                  <p className="text-sm">{employee.name}</p>
                  <p className="text-xs text-muted-foreground">{employee.department}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => onAssignEmployee(shift.id, employee.id)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Assign
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onEditShift}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Shift
        </Button>
      </div>
    </div>
  );
}
