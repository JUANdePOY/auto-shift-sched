// ==================== SHIFT ASSIGNMENT TABLE COMPONENT ====================

import React from 'react';
import { Button } from '../../shared/components/ui/button';
import { Badge } from '../../shared/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../shared/components/ui/table';
import { Tooltip, TooltipTrigger, TooltipContent } from '../../shared/components/ui/tooltip';
import { Clock, Users, Check, X, UserMinus, Edit, Trash2 } from 'lucide-react';
import type { ShiftAssignment } from '../types/shiftAssignmentTypes';

interface ShiftAssignmentTableProps {
  assignments: ShiftAssignment[];
  onAssignEmployee: (shiftId: string, employeeId: string) => void;
  onUnassignEmployee: (shiftId: string) => void;
  onEditShift: (shift: ShiftAssignment) => void;
  onDeleteShift: (shiftId: string) => void;
  onOpenAISuggestionPanel: (shiftId: string) => void;
  viewMode?: boolean;
}

const ShiftAssignmentTable: React.FC<ShiftAssignmentTableProps> = ({
  assignments,
  onAssignEmployee,
  onUnassignEmployee,
  onEditShift,
  onDeleteShift,
  onOpenAISuggestionPanel,
  viewMode = false
}) => {
  return (
    <div className="border rounded-lg overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-muted/50">
            <TableHead className="font-semibold text-foreground">Required Station(s)</TableHead>
            <TableHead className="font-semibold text-foreground">Time In and Out</TableHead>
            <TableHead className="font-semibold text-foreground">Type</TableHead>
            <TableHead className="font-semibold text-foreground">Assigned Employee</TableHead>
            <TableHead className="font-semibold text-foreground">Status</TableHead>
            {!viewMode && <TableHead className="font-semibold text-foreground">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((assignment, index) => {
            const isEvenRow = index % 2 === 0;
            return (
              <TableRow
                key={assignment.id}
                className={`
                  ${isEvenRow ? 'bg-background' : 'bg-muted/20'}
                  ${assignment.status === 'assigned' ? 'bg-green-50/50 hover:bg-green-100/50' : 'hover:bg-muted/30'}
                  transition-colors duration-150
                `}
              >
                <TableCell className="py-4">
                  <div className="flex flex-wrap gap-1">
                    {assignment.requiredStation.map((station, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {station.replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="font-medium flex items-center gap-2 py-4">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-mono">
                    In: {assignment.time} Out: {assignment.endTime}
                  </span>
                </TableCell>
                <TableCell className="py-4">
                  <Badge variant="outline" className="capitalize">
                    {assignment.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  {assignment.assignedEmployee ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{assignment.assignedEmployee.name}</p>
                        <p className="text-sm text-muted-foreground">{assignment.assignedEmployee.role}</p>
                      </div>
                      {!viewMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onUnassignEmployee(assignment.id)}
                          title="Unassign employee"
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    !viewMode && (
                      <div className="space-y-2">
                        <Button
                          onClick={() => onOpenAISuggestionPanel(assignment.id)}
                          variant="outline"
                          className="w-full flex items-center gap-2"
                        >
                          <Users className="w-4 h-4" />
                          Assign Employee
                        </Button>
                      </div>
                    )
                  )}
                </TableCell>
                <TableCell className="py-4">
                  <Badge
                    variant={assignment.status === 'assigned' ? 'default' : assignment.status === 'conflict' ? 'destructive' : 'secondary'}
                    className={`
                      flex items-center gap-1 ${
                      assignment.status === 'assigned' ? 'bg-green-600 hover:bg-green-700' :
                      assignment.status === 'conflict' ? 'bg-red-600 hover:bg-red-700' :
                      'bg-gray-500 hover:bg-gray-600'
                    }`}
                  >
                    {assignment.status === 'assigned' && <Check className="w-3 h-3" />}
                    {assignment.status === 'conflict' && <X className="w-3 h-3" />}
                    {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                  </Badge>
                </TableCell>
                {!viewMode && (
                  <TableCell className="py-4">
                    <div className="flex gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditShift(assignment)}
                            className="hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit shift details</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteShift(assignment.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete shift</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default ShiftAssignmentTable;
