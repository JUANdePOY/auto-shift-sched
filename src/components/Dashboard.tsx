import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { CalendarDays, Users, Target, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import type { WeeklySchedule, Employee } from '@/types/index.ts';

interface DashboardProps {
  schedule: WeeklySchedule;
  employees: Employee[];
  onViewSchedule: () => void;
  onViewSuggestions: () => void;
}

export function Dashboard({ schedule, employees, onViewSchedule, onViewSuggestions }: DashboardProps) {
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.currentWeeklyHours > 0).length;
  const averageUtilization = employees.reduce((sum, emp) => 
    sum + (emp.currentWeeklyHours / emp.maxHoursPerWeek), 0) / employees.length * 100;

  const urgentConflicts = schedule.conflicts.filter(conflict => conflict.severity === 'error').length;
  const warnings = schedule.conflicts.filter(conflict => conflict.severity === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Shift Scheduling Dashboard</h1>
          <p className="text-muted-foreground">
            Week of {new Date(schedule.weekStart).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={onViewSuggestions} variant="outline">
            <TrendingUp className="w-4 h-4 mr-2" />
            AI Suggestions ({schedule.suggestions.length})
          </Button>
          <Button onClick={onViewSchedule}>
            <CalendarDays className="w-4 h-4 mr-2" />
            View Schedule
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Schedule Coverage</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{schedule.coverageRate}%</div>
            <Progress value={schedule.coverageRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {schedule.shifts.filter(s => s.assignedEmployees.length >= s.requiredEmployees).length} of {schedule.shifts.length} shifts covered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Schedule Efficiency</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{schedule.scheduleEfficiency}%</div>
            <Progress value={schedule.scheduleEfficiency} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-green-600">↑ 12%</span> vs last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Employee Utilization</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{Math.round(averageUtilization)}%</div>
            <Progress value={averageUtilization} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {activeEmployees} of {totalEmployees} employees scheduled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Conflicts & Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl">{urgentConflicts + warnings}</div>
              {urgentConflicts > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {urgentConflicts} urgent
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {warnings} warnings, {urgentConflicts} critical issues
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent AI Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle>Latest AI Suggestions</CardTitle>
            <CardDescription>
              Smart recommendations to optimize your schedule
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {schedule.suggestions.slice(0, 3).map((suggestion) => (
              <div key={suggestion.id} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm">{suggestion.title}</p>
                  <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {suggestion.confidence}% confidence
                    </Badge>
                    <span className="text-xs text-blue-600">
                      +{suggestion.impact.efficiency}% efficiency
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="ghost">Apply</Button>
              </div>
            ))}
            {schedule.suggestions.length > 3 && (
              <Button variant="outline" className="w-full" onClick={onViewSuggestions}>
                View All {schedule.suggestions.length} Suggestions
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Shifts */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Shifts</CardTitle>
            <CardDescription>
              Current and upcoming shifts for today
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {schedule.shifts
              .filter(shift => shift.date === new Date().toISOString().split('T')[0])
              .slice(0, 3)
              .map((shift) => (
                <div key={shift.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm">{shift.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {shift.startTime} - {shift.endTime}
                      <Badge 
                        variant={shift.priority === 'high' ? 'destructive' : 
                                shift.priority === 'medium' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {shift.priority}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      {shift.assignedEmployees.length}/{shift.requiredEmployees}
                    </p>
                    <p className="text-xs text-muted-foreground">assigned</p>
                  </div>
                </div>
              ))}
            
            {schedule.shifts.filter(shift => 
              shift.date === new Date().toISOString().split('T')[0]
            ).length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No shifts scheduled for today</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}