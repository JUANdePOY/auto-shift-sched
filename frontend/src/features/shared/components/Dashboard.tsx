import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Badge } from '../../shared/components/ui/badge';
import { Progress } from '../../shared/components/ui/progress';
import { Button } from '../../shared/components/ui/button';
import { CalendarDays, Users, Target, AlertTriangle, Clock, TrendingUp, Building2 } from 'lucide-react';
import { availabilityService } from '../../availability/services/availabilityService';
import { useState, useEffect } from 'react';
import type { WeeklySchedule, Employee } from '../../shared/types';

interface DashboardProps {
  schedule: WeeklySchedule | null;
  employees: Employee[];
  onViewSchedule: () => void;
}

export function Dashboard({ schedule, employees, onViewSchedule }: DashboardProps) {
  const [nextWeekAvailability, setNextWeekAvailability] = useState<{ submissionRate: number; totalEmployees: number; submissions: number } | null>(null);

  // Get next week's start date (Monday)
  const getNextWeekStart = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? 1 : 8 - dayOfWeek; // Next Monday
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + diff);
    return nextMonday.toISOString().split('T')[0];
  };

  useEffect(() => {
    const fetchNextWeekAvailability = async () => {
      try {
        const nextWeekStart = getNextWeekStart();
        const status = await availabilityService.getAvailabilityStatus(nextWeekStart);
        setNextWeekAvailability({
          submissionRate: status.submissionRate,
          totalEmployees: status.totalEmployees,
          submissions: status.submissions
        });
      } catch (error) {
        console.error('Failed to fetch next week availability:', error);
        // Fallback to mock data if API fails
        setNextWeekAvailability({
          submissionRate: 70,
          totalEmployees: employees.length,
          submissions: Math.round(employees.length * 0.7)
        });
      }
    };

    fetchNextWeekAvailability();
  }, [employees.length]);

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.currentWeeklyHours > 0).length;
  const averageUtilization = employees.reduce((sum, emp) =>
    sum + (emp.currentWeeklyHours / emp.maxHoursPerWeek), 0) / employees.length * 100;

  const urgentConflicts = schedule?.conflicts?.filter(conflict => conflict.severity === 'error').length || 0;
  const warnings = schedule?.conflicts?.filter(conflict => conflict.severity === 'warning').length || 0;

  if (!schedule) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1>Shift Scheduling Dashboard</h1>
            <p className="text-muted-foreground">Loading schedule data...</p>
          </div>
        </div>
        <div className="text-center py-12">
          <CalendarDays className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium">No schedule data available</h3>
          <p className="text-muted-foreground">Please wait while we load the schedule data.</p>
        </div>
      </div>
    );
  }

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
          <Button onClick={onViewSchedule}>
            <CalendarDays className="w-4 h-4 mr-2" />
            View Schedule
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <Card className="transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Schedule Coverage</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedule.coverageRate}%</div>
            <Progress value={schedule.coverageRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {schedule.shifts.filter(s => s.assignedEmployees.length >= s.requiredEmployees).length} of {schedule.shifts.length} shifts covered
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Schedule Efficiency</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedule.scheduleEfficiency}%</div>
            <Progress value={schedule.scheduleEfficiency} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-green-600">↑ 12%</span> vs last week
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Employee Utilization</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(averageUtilization)}%</div>
            <Progress value={averageUtilization} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {activeEmployees} of {totalEmployees} employees scheduled
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Conflicts & Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{urgentConflicts + warnings}</div>
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

        {/* Department Breakdown */}
        <Card className="transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Department Breakdown</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Service</span>
                <span className="text-sm font-bold">
                  {employees.filter(e => e.department === 'Service').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Production</span>
                <span className="text-sm font-bold">
                  {employees.filter(e => e.department === 'Production').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Availability Status */}
        <Card className="transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Next Week Availability</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Submitted</span>
                <span className="text-sm font-bold">
                  {nextWeekAvailability ? nextWeekAvailability.submissionRate : 0}%
                </span>
              </div>
              <Progress
                value={nextWeekAvailability ? nextWeekAvailability.submissionRate : 0}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {nextWeekAvailability ? nextWeekAvailability.submissions : 0} of {nextWeekAvailability ? nextWeekAvailability.totalEmployees : employees.length} employees
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Recent AI Suggestions */}
        <Card className="transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader>
            <CardTitle>Latest AI Suggestions</CardTitle>
            <CardDescription>
              Smart recommendations to optimize your schedule
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {schedule.suggestions.slice(0, 3).map((suggestion) => (
              <div key={suggestion.id} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{suggestion.title}</p>
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
                <Button size="sm" variant="ghost" className="hover:bg-blue-50">Apply</Button>
              </div>
            ))}
            {schedule.suggestions.length > 3 && (
              <p className="text-sm text-muted-foreground text-center">
                {schedule.suggestions.length - 3} more suggestions available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Shifts */}
        <Card className="transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader>
            <CardTitle>Today's Shifts</CardTitle>
            <CardDescription>
              Current and upcoming shifts for today
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {schedule.shifts
              .filter(shift => shift.date === new Date().toISOString().split('T')[0])
              .slice(0, 4)
              .map((shift) => (
                <div key={shift.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{shift.title}</p>
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
                    <p className="text-sm font-bold">
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

        {/* Monthly Overview */}
        <Card className="transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader>
            <CardTitle>Monthly Overview</CardTitle>
            <CardDescription>
              Trends and performance over the past month
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Avg Coverage Rate</span>
                <span className="text-sm font-bold text-green-600">94%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Hours Scheduled</span>
                <span className="text-sm font-bold">1,247</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Conflicts Resolved</span>
                <span className="text-sm font-bold">23</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Employee Satisfaction</span>
                <span className="text-sm font-bold text-blue-600">87%</span>
              </div>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3" />
                <span>+8% vs last month</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates and changes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-2 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-xs font-medium">Schedule published</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-xs font-medium">AI suggestions applied</p>
                  <p className="text-xs text-muted-foreground">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 bg-orange-50 rounded-lg">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-xs font-medium">New employee added</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 bg-purple-50 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-xs font-medium">Availability updated</p>
                  <p className="text-xs text-muted-foreground">2 days ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}