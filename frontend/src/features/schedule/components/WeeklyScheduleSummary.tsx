import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Badge } from '../../shared/components/ui/badge';
import { Button } from '../../shared/components/ui/button';
import { Progress } from '../../shared/components/ui/progress';
import { Alert, AlertDescription } from '../../shared/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../shared/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../shared/components/ui/collapsible';
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { useTemporarySchedule, type EmployeeWorkload, type ScheduleConflict } from '../contexts/TemporaryScheduleContext';

interface WeeklyScheduleSummaryProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function WeeklyScheduleSummary({ isOpen, onToggle }: WeeklyScheduleSummaryProps) {
  const { summary } = useTemporarySchedule();
  const [showConflicts, setShowConflicts] = useState(true);
  const [showWorkloads, setShowWorkloads] = useState(true);

  const getStatusIcon = (status: EmployeeWorkload['status']) => {
    switch (status) {
      case 'underworked':
        return <TrendingDown className="w-4 h-4 text-blue-500" />;
      case 'overworked':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'balanced':
        return <Minus className="w-4 h-4 text-green-500" />;
    }
  };

  const getStatusColor = (status: EmployeeWorkload['status']) => {
    switch (status) {
      case 'underworked':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'overworked':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'balanced':
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getConflictIcon = (severity: ScheduleConflict['severity']) => {
    return severity === 'error' ?
      <AlertTriangle className="w-4 h-4 text-red-500" /> :
      <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  };

  const completionPercentage = summary.totalDays > 0 ? (summary.completedDays / summary.totalDays) * 100 : 0;
  const errorConflicts = summary.conflicts.filter(c => c.severity === 'error');
  const warningConflicts = summary.conflicts.filter(c => c.severity === 'warning');

  return (
    <Card className="w-full">
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <CardTitle className="text-lg">Weekly Schedule Summary</CardTitle>
                  <CardDescription>
                    Progress: {summary.completedDays}/{summary.totalDays} days • {summary.totalAssignments} assignments
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {errorConflicts.length > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errorConflicts.length} errors
                  </Badge>
                )}
                {warningConflicts.length > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800">
                    <AlertTriangle className="w-3 h-3" />
                    {warningConflicts.length} warnings
                  </Badge>
                )}
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Progress Overview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Weekly Completion</h3>
                <span className="text-sm text-muted-foreground">
                  {summary.completedDays} of {summary.totalDays} days scheduled
                </span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  {summary.completedDays} completed
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-500" />
                  {summary.totalDays - summary.completedDays} remaining
                </span>
              </div>
            </div>

            {/* Conflicts Section */}
            {(errorConflicts.length > 0 || warningConflicts.length > 0) && (
              <div className="space-y-3">
                <Collapsible open={showConflicts} onOpenChange={setShowConflicts}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        Conflicts ({summary.conflicts.length})
                      </h3>
                      {showConflicts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-3">
                    {summary.conflicts.map((conflict, index) => (
                      <Alert key={index} className={conflict.severity === 'error' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}>
                        <div className="flex items-start gap-2">
                          {getConflictIcon(conflict.severity)}
                          <AlertDescription className="text-sm">
                            <strong>{conflict.employeeName}:</strong> {conflict.message}
                            {conflict.date && (
                              <span className="text-xs text-muted-foreground ml-2">
                                ({new Date(conflict.date).toLocaleDateString()})
                              </span>
                            )}
                          </AlertDescription>
                        </div>
                      </Alert>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}

            {/* Employee Workloads Section */}
            <div className="space-y-3">
              <Collapsible open={showWorkloads} onOpenChange={setShowWorkloads}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      Employee Workloads ({summary.employeeWorkloads.length})
                    </h3>
                    {showWorkloads ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">Employee</TableHead>
                          <TableHead className="font-semibold text-center">Shifts</TableHead>
                          <TableHead className="font-semibold text-center">Hours</TableHead>
                          <TableHead className="font-semibold text-center">Status</TableHead>
                          <TableHead className="font-semibold">Departments</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {summary.employeeWorkloads
                          .sort((a, b) => b.totalHours - a.totalHours)
                          .map((workload) => (
                          <TableRow key={workload.employeeId}>
                            <TableCell className="font-medium">
                              {workload.employeeName}
                            </TableCell>
                            <TableCell className="text-center">
                              {workload.totalShifts}
                            </TableCell>
                            <TableCell className="text-center font-mono">
                              {workload.totalHours.toFixed(1)}h
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className={`flex items-center gap-1 w-fit mx-auto ${getStatusColor(workload.status)}`}
                              >
                                {getStatusIcon(workload.status)}
                                {workload.status.charAt(0).toUpperCase() + workload.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {workload.departments.map((dept, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {dept}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Workload Summary Stats */}
                  <div className="flex gap-4 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Balanced: {summary.employeeWorkloads.filter(w => w.status === 'balanced').length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Underworked: {summary.employeeWorkloads.filter(w => w.status === 'underworked').length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Overworked: {summary.employeeWorkloads.filter(w => w.status === 'overworked').length}</span>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
