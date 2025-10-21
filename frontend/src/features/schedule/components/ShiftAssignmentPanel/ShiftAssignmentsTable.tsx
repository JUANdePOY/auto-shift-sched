import React from 'react';
import { Button } from '../../../shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/components/ui/select';
import { Badge } from '../../../shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Trash2, Edit, Lightbulb } from 'lucide-react';
import type { ShiftAssignmentsTableProps } from './ShiftAssignmentTypes';

const ShiftAssignmentsTable: React.FC<ShiftAssignmentsTableProps> = ({
  assignments,
  typeFilter,
  onAssignEmployee,
  onUnassignEmployee,
  onOpenAISuggestionPanel,
  onEditShift,
  onDeleteShift,
  getAvailableEmployees
}) => {

  const filteredAssignments = assignments.filter(assignment =>
    typeFilter === 'all' || assignment.type === typeFilter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-green-100 text-green-800';
      case 'unassigned': return 'bg-red-100 text-red-800';
      case 'conflict': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'opener': return 'bg-blue-100 text-blue-800';
      case 'mid': return 'bg-purple-100 text-purple-800';
      case 'closer': return 'bg-orange-100 text-orange-800';
      case 'graveyard': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shift Assignments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => (
            <div
              key={assignment.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium">{assignment.title}</h3>
                  <Badge className={getTypeColor(assignment.type)}>
                    {assignment.type}
                  </Badge>
                  <Badge className={getStatusColor(assignment.status)}>
                    {assignment.status}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Time: {assignment.time} - {assignment.endTime}</p>
                  <p>Department: {assignment.department}</p>
                  <p>Stations: {assignment.requiredStation.join(', ')}</p>
                  {assignment.assignedEmployee && (
                    <p className="text-green-600">
                      Assigned to: {assignment.assignedEmployee.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!assignment.assignedEmployee ? (
                  <Select
                    onValueChange={(employeeId) => onAssignEmployee(assignment.id, employeeId)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Assign employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableEmployees(assignment).map(employee => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUnassignEmployee(assignment.id)}
                  >
                    Unassign
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenAISuggestionPanel(assignment.id)}
                >
                  <Lightbulb className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditShift(assignment)}
                >
                  <Edit className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteShift(assignment.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {filteredAssignments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No shifts found for the selected filter.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ShiftAssignmentsTable;
