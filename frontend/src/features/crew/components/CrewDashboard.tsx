import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Badge } from '../../shared/components/ui/badge';
import { Button } from '../../shared/components/ui/button';
import { CalendarDays, Clock, TrendingUp, User, AlertCircle, CheckCircle } from 'lucide-react';
import { useCrewData } from '../hooks/useCrewData';
import { CrewUpcomingShifts } from './CrewUpcomingShifts';
import { CrewProfile } from './CrewProfile';

interface CrewDashboardProps {
  employeeId: string;
}

export function CrewDashboard({ employeeId }: CrewDashboardProps) {
  const { profile, upcomingShifts, stats, loading, error } = useCrewData(employeeId);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1>My Dashboard</h1>
            <p className="text-muted-foreground">Loading your information...</p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1>My Dashboard</h1>
            <p className="text-muted-foreground">Error loading dashboard</p>
          </div>
        </div>
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive opacity-50" />
          <h3 className="text-lg font-medium">Unable to load dashboard</h3>
          <p className="text-muted-foreground">{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const todayShifts = upcomingShifts.filter(shift =>
    shift.date === new Date().toISOString().split('T')[0]
  );

  const nextShift = upcomingShifts.find(shift =>
    new Date(shift.date) > new Date()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>My Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.name || 'Employee'}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Today's Shifts</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayShifts.length}</div>
            <p className="text-xs text-muted-foreground">
              {todayShifts.length > 0 ? 'Scheduled today' : 'No shifts today'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">This Week Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.totalHoursThisWeek || 0}h</div>
            <p className="text-xs text-muted-foreground">
              of {profile?.maxHoursPerWeek || 40}h target
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Upcoming Shifts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.upcomingShifts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Next 2 weeks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Reliability Score</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.reliabilityScore || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Based on attendance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Next Shift Alert */}
      {nextShift && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              Next Shift
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{nextShift.title}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(nextShift.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                  })} • {nextShift.startTime} - {nextShift.endTime}
                </p>
                <p className="text-sm text-muted-foreground">Station: {nextShift.station}</p>
              </div>
              <Badge variant={nextShift.status === 'confirmed' ? 'default' : 'secondary'}>
                {nextShift.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Shifts */}
      <CrewUpcomingShifts shifts={upcomingShifts} />

      {/* Profile Summary */}
      <CrewProfile profile={profile} stats={stats} />
    </div>
  );
}
