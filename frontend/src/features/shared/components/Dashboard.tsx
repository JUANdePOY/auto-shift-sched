import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Badge } from '../../shared/components/ui/badge';
import { Progress } from '../../shared/components/ui/progress';
import { Button } from '../../shared/components/ui/button';
import { CalendarDays, Users, Target, AlertTriangle, Clock, TrendingUp, Building2, BarChart3 } from 'lucide-react';
import { availabilityService } from '../../availability/services/availabilityService';
import { dashboardService } from '../../shared/services/dashboardService';
import { useState, useEffect } from 'react';
import type { WeeklySchedule, Employee, ScheduleConflict } from '../../shared/types';
import type { WeekSummary, EmployeeUtilization, MonthlyOverview, ActivityItem } from '../../shared/services/dashboardService';

interface DashboardProps {
  schedule: WeeklySchedule | null;
  employees: Employee[];
  onViewSchedule: () => void;
}

export function Dashboard({ schedule, employees, onViewSchedule }: DashboardProps) {
  const [nextWeekAvailability, setNextWeekAvailability] = useState<{ submissionRate: number; totalEmployees: number; submissions: number } | null>(null);
  const [weekSummary, setWeekSummary] = useState<WeekSummary | null>(null);
  const [employeeUtilization, setEmployeeUtilization] = useState<EmployeeUtilization | null>(null);
  const [monthlyOverview, setMonthlyOverview] = useState<MonthlyOverview | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  // Get next week's start date (Monday)
  const getNextWeekStart = (baseDate?: string) => {
    const start = baseDate ? new Date(baseDate) : new Date();
    const dayOfWeek = start.getDay();
    // Normalize to next Monday relative to the given start date
    const diff = dayOfWeek === 0 ? 1 : 8 - dayOfWeek; // Next Monday from given date
    const nextMonday = new Date(start);
    nextMonday.setDate(start.getDate() + diff);
    return nextMonday.toISOString().split('T')[0];
  };

  // Get current week's start date (Monday)
  const getCurrentWeekStart = (baseDate?: string) => {
    const today = baseDate ? new Date(baseDate) : new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Current Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    return monday.toISOString().split('T')[0];
  };

  const addDaysToDate = (dateStr: string, days: number) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Prefer the provided schedule's week start when available
        const currentWeekStart = schedule?.weekStart ?? getCurrentWeekStart();
        // Compute next week relative to the selected week
        const nextWeekStart = getNextWeekStart(addDaysToDate(currentWeekStart, 0));

        // Fetch all dashboard data in parallel
        const [
          weekSummaryData,
          utilizationData,
          monthlyData,
          activityData,
          availabilityData
        ] = await Promise.all([
          dashboardService.getWeekSummary(currentWeekStart).catch(() => null),
          dashboardService.getEmployeeUtilization(currentWeekStart).catch(() => null),
          dashboardService.getMonthlyOverview().catch(() => null),
          dashboardService.getRecentActivity().catch(() => null),
          availabilityService.getAvailabilityStatus(nextWeekStart).catch(() => ({
            submissionRate: 0,
            totalEmployees: employees.length,
            submissions: 0
          }))
        ]);

        setWeekSummary(weekSummaryData);
        setEmployeeUtilization(utilizationData);
        setMonthlyOverview(monthlyData);
        setRecentActivity(activityData || []);
        setNextWeekAvailability(availabilityData || {
          submissionRate: 0,
          totalEmployees: employees.length,
          submissions: 0
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, [employees.length]);

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

  // Use selected schedule week start for display when available
  const selectedWeekStart = schedule?.weekStart ?? getCurrentWeekStart();
  const weekStartDate = new Date(selectedWeekStart);

  // Use actual data from API calls with fallbacks
  // Ensure percentages are bounded 0-100 and fallbacks are sensible
  const coverage = Math.min(Math.max(weekSummary?.coverageRate ?? 0, 0), 100);
  const utilizationPercent = Math.min(Math.max(employeeUtilization?.averageUtilization ?? 0, 0), 100);
  const employeesScheduled = employeeUtilization?.employeesScheduled ?? 0;
  const totalEmps = employeeUtilization?.totalEmployees ?? employees.length;
  const conflictCount = weekSummary?.conflicts?.length ?? 0;
  const urgentCount = weekSummary?.conflicts?.filter((c: ScheduleConflict) => c.severity === 'error').length ?? 0;
  const scheduleEfficiency = weekSummary ? Math.round((weekSummary.coveredShifts / weekSummary.totalShifts) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-2xl p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Dashboard Overview
              </h1>
              <p className="text-slate-600 mt-1 text-lg">
                Week of {weekStartDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          </div>
          
          <Button
            onClick={onViewSchedule}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
          >
            <CalendarDays className="w-5 h-5 mr-2" />
            View Schedule
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="transition-all hover:shadow-lg hover:-translate-y-1 duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Schedule Coverage</CardTitle>
            <CalendarDays className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{coverage}%</div>
            <Progress value={coverage} className="mt-3 h-2" />
            <p className="text-xs text-slate-600 mt-3">
              {weekSummary?.coveredShifts ?? 0} of {weekSummary?.totalShifts ?? 0} shifts covered
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-lg hover:-translate-y-1 duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Employee Utilization</CardTitle>
            <Users className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{Math.round(utilizationPercent)}%</div>
            <Progress value={utilizationPercent} className="mt-3 h-2" />
            <p className="text-xs text-slate-600 mt-3">
              {employeesScheduled} of {totalEmps} employees scheduled
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-lg hover:-translate-y-1 duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Department Split</CardTitle>
            <Building2 className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Service</span>
                <span className="text-lg font-bold text-slate-900">
                  {employees.filter(e => e.department === 'Service').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Production</span>
                <span className="text-lg font-bold text-slate-900">
                  {employees.filter(e => e.department === 'Production').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-lg hover:-translate-y-1 duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Availability Status</CardTitle>
            <Target className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {nextWeekAvailability ? nextWeekAvailability.submissionRate : 0}%
            </div>
            <Progress
              value={nextWeekAvailability ? nextWeekAvailability.submissionRate : 0}
              className="mt-3 h-2"
            />
            <p className="text-xs text-slate-600 mt-3">
              {nextWeekAvailability ? nextWeekAvailability.submissions : 0} of {nextWeekAvailability ? nextWeekAvailability.totalEmployees : employees.length} submitted
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Cards Section - Removed AI Suggestions, Added Monthly Overview and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upcoming Shifts */}
        <Card className="transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader>
            <CardTitle>Today's Shifts</CardTitle>
            <CardDescription>
              Current and upcoming shifts for today
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {weekSummary?.assignments
              // Show assignments for today if today is within the selected week, otherwise show assignments for the first day of the selected week
              ?.filter(assignment => {
                const todayIso = new Date().toISOString().split('T')[0];
                const weekStartIso = selectedWeekStart;
                const weekEndIso = addDaysToDate(weekStartIso, 6);
                const isTodayInWeek = todayIso >= weekStartIso && todayIso <= weekEndIso;
                const targetDate = isTodayInWeek ? todayIso : weekStartIso;
                return assignment.date === targetDate;
              })
              ?.slice(0, 4)
              ?.map((assignment) => (
                <div key={`${assignment.shift_id}-${assignment.employee_id}`} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{assignment.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {assignment.startTime} - {assignment.endTime}
                      <Badge variant="secondary" className="text-xs">
                        {assignment.employee_name}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">Assigned</p>
                    <p className="text-xs text-muted-foreground">to {assignment.employee_name}</p>
                  </div>
                </div>
              )) ?? []}

            {(!weekSummary?.assignments || weekSummary.assignments.filter(assignment =>
              // same logic as above for empty state
              (() => {
                const todayIso = new Date().toISOString().split('T')[0];
                const weekStartIso = selectedWeekStart;
                const weekEndIso = addDaysToDate(weekStartIso, 6);
                const isTodayInWeek = todayIso >= weekStartIso && todayIso <= weekEndIso;
                const targetDate = isTodayInWeek ? todayIso : weekStartIso;
                return assignment.date === targetDate;
              })()
            ).length === 0) && (
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
              Trends and performance over the month
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Avg Coverage Rate</span>
                <span className="text-sm font-bold text-green-600">
                  {monthlyOverview?.currentMonth?.averageCoverageRate ?? 94}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Hours Scheduled</span>
                <span className="text-sm font-bold">
                  {monthlyOverview?.currentMonth?.totalHours ?? '0'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Assignments</span>
                <span className="text-sm font-bold">
                  {monthlyOverview?.currentMonth?.totalAssignments ?? 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Employees Scheduled</span>
                <span className="text-sm font-bold text-blue-600">
                  {monthlyOverview?.currentMonth?.uniqueEmployees ?? 0}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3" />
                <span>{monthlyOverview?.percentageChanges?.assignmentsChange ?? 0}% vs last month</span>
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
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.slice(0, 4).map((activity, idx) => {
                  const typeColors: Record<string, { bg: string; dot: string }> = {
                    schedule_published: { bg: 'bg-green-50', dot: 'bg-green-500' },
                    availability_submitted: { bg: 'bg-blue-50', dot: 'bg-blue-500' },
                    employee_added: { bg: 'bg-orange-50', dot: 'bg-orange-500' },
                    shift_assigned: { bg: 'bg-purple-50', dot: 'bg-purple-500' }
                  };
                  
                  const colors = typeColors[activity.type] || { bg: 'bg-gray-50', dot: 'bg-gray-500' };
                  
                  return (
                    <div key={idx} className={`flex items-start gap-3 p-2 ${colors.bg} rounded-lg`}>
                      <div className={`w-2 h-2 ${colors.dot} rounded-full mt-2`}></div>
                      <div className="flex-1">
                        <p className="text-xs font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">{activity.timeAgo}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-xs">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}