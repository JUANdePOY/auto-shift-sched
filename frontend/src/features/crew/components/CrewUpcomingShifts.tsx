import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Badge } from '../../shared/components/ui/badge';
import { CalendarDays, Clock, MapPin } from 'lucide-react';
import type { CrewShift } from '../types';

interface CrewUpcomingShiftsProps {
  shifts: CrewShift[];
}

export function CrewUpcomingShifts({ shifts }: CrewUpcomingShiftsProps) {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const todayShifts = shifts.filter(shift => shift.date === today);
  const tomorrowShifts = shifts.filter(shift => shift.date === tomorrow);
  const futureShifts = shifts.filter(shift => shift.date > tomorrow).slice(0, 5);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const ShiftCard = ({ shift }: { shift: CrewShift }) => (
    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">{shift.title}</h4>
          <Badge
            variant={
              shift.status === 'confirmed' ? 'default' :
              shift.status === 'pending' ? 'secondary' : 'destructive'
            }
            className="text-xs"
          >
            {shift.status}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <CalendarDays className="w-3 h-3" />
            {formatDate(shift.date)}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {shift.startTime} - {shift.endTime}
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {shift.station}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Today's Shifts */}
      {todayShifts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today's Shifts</CardTitle>
            <CardDescription>
              Your scheduled shifts for today
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayShifts.map((shift) => (
              <ShiftCard key={shift.id} shift={shift} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tomorrow's Shifts */}
      {tomorrowShifts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tomorrow</CardTitle>
            <CardDescription>
              Your scheduled shifts for tomorrow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tomorrowShifts.map((shift) => (
              <ShiftCard key={shift.id} shift={shift} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Shifts */}
      {futureShifts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Shifts</CardTitle>
            <CardDescription>
              Your next scheduled shifts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {futureShifts.map((shift) => (
              <ShiftCard key={shift.id} shift={shift} />
            ))}
            {shifts.filter(shift => shift.date > tomorrow).length > 5 && (
              <p className="text-sm text-muted-foreground text-center">
                +{shifts.filter(shift => shift.date > tomorrow).length - 5} more shifts scheduled
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* No shifts message */}
      {shifts.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <CalendarDays className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No upcoming shifts</h3>
            <p className="text-muted-foreground">
              You don't have any shifts scheduled at the moment.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
