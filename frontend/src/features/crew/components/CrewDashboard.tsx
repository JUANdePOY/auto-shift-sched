import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Badge } from '../../shared/components/ui/badge';
import { Button } from '../../shared/components/ui/button';
import { CalendarDays, Clock, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { useCrewData } from '../hooks/useCrewData';
import { CrewUpcomingShifts } from './CrewUpcomingShifts';
import { CrewProfile } from './CrewProfile';

interface CrewDashboardProps {
  employeeId: string;
}

export function CrewDashboard({ employeeId }: CrewDashboardProps) {
  const { profile, upcomingShifts, stats, loading, error } = useCrewData(employeeId);

  // Format time to 12-hour format
  const formatTo12Hour = (time: string): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Format station to remove brackets and quotes
  const formatStation = (station: any) => {
    if (Array.isArray(station)) {
      return station.join(', ');
    }
    if (typeof station === 'string') {
      return station.replace(/[\[\]"']/g, '').replace(/,/g, ', ');
    }
    return station || 'Not assigned';
  };

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

  // Calculate actual hours from shifts
  const calculateHoursFromShifts = (shifts: typeof upcomingShifts, startDate: Date, endDate: Date) => {
    return shifts
      .filter(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate >= startDate && shiftDate <= endDate;
      })
      .reduce((total, shift) => {
        if (shift.startTime && shift.endTime) {
          const start = new Date(`2000-01-01T${shift.startTime}`);
          const end = new Date(`2000-01-01T${shift.endTime}`);
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          return total + (hours > 0 ? hours : 0);
        }
        return total;
      }, 0);
  };

  // Get current week dates
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

  // Get current month dates
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Calculate actual hours
  const actualWeeklyHours = Math.round(calculateHoursFromShifts(upcomingShifts, startOfWeek, endOfWeek) * 10) / 10;
  const actualMonthlyHours = Math.round(calculateHoursFromShifts(upcomingShifts, startOfMonth, endOfMonth) * 10) / 10;
  const upcomingShiftsCount = upcomingShifts.filter(shift => new Date(shift.date) > now).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center pb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <CalendarDays className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Welcome back, {profile?.name || 'Employee'}!
        </h1>
        <p className="text-slate-600 text-lg">
          Here's your dashboard overview for today
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-md border border-slate-200 bg-white hover:shadow-lg transition-all duration-200 hover:border-slate-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold text-slate-700">Today's Shifts</CardTitle>
            <div className="p-2 bg-slate-100 rounded-lg">
              <CalendarDays className="h-5 w-5 text-slate-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800 mb-1">{todayShifts.length}</div>
            <p className="text-sm font-medium text-slate-600">
              {todayShifts.length > 0 ? 'Scheduled today' : 'No shifts today'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md border border-slate-200 bg-white hover:shadow-lg transition-all duration-200 hover:border-slate-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold text-slate-700">This Week Hours</CardTitle>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Clock className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800 mb-1">{actualWeeklyHours}h</div>
            <p className="text-sm font-medium text-slate-600">
              of {profile?.maxHoursPerWeek || 40}h target
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md border border-slate-200 bg-white hover:shadow-lg transition-all duration-200 hover:border-slate-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold text-slate-700">Upcoming Shifts</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800 mb-1">{upcomingShiftsCount}</div>
            <p className="text-sm font-medium text-slate-600">
              Next 2 weeks
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md border border-slate-200 bg-white hover:shadow-lg transition-all duration-200 hover:border-slate-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold text-slate-700">Monthly Hours</CardTitle>
            <div className="p-2 bg-amber-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800 mb-1">{actualMonthlyHours}h</div>
            <p className="text-sm font-medium text-slate-600">
              This month's total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Next Shift Alert */}
      {nextShift && (
        <Card className="shadow-lg border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl text-slate-800">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              Your Next Shift
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xl font-bold text-slate-800">{nextShift.title}</p>
                <div className="flex items-center gap-2 text-slate-600">
                  <CalendarDays className="h-4 w-4" />
                  <span className="font-medium">
                    {new Date(nextShift.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">{formatTo12Hour(nextShift.startTime)} - {formatTo12Hour(nextShift.endTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Station:</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {formatStation(nextShift.station)}
                  </Badge>
                </div>
              </div>
              <Badge 
                variant={nextShift.status === 'confirmed' ? 'default' : 'secondary'}
                className={`text-base px-4 py-2 ${
                  nextShift.status === 'confirmed' 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600' 
                    : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                {nextShift.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Shifts - Takes 2 columns */}
        <div className="lg:col-span-2">
          <CrewUpcomingShifts shifts={upcomingShifts} onWeekChange={(direction) => {
            console.log('Week navigation:', direction);
          }} />
        </div>

      </div>
    </div>
  );
}
