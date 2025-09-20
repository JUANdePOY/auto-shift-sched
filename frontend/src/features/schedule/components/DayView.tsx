import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Badge } from '../../shared/components/ui/badge';
import { Calendar, Clock, Users, AlertTriangle } from 'lucide-react';
import type { Shift, ScheduleConflict } from '../../shared/types';

interface DayViewProps {
  date: Date;
  shifts: Shift[];
  timeSlots: string[];
  onShiftClick: (shift: Shift) => void;
  getShiftConflicts: (shiftId: string) => ScheduleConflict[];
}

export function DayView({
  date,
  shifts,
  timeSlots,
  onShiftClick,
  getShiftConflicts,
}: DayViewProps) {
  // Helper function to normalize time format with leading zeros
  const padTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours.padStart(2, '0')}:${minutes}`;
  };

  // Group shifts by time slots - show shifts that start within each hour
  const shiftsByTimeSlot = timeSlots.reduce((acc, time) => {
    acc[time] = shifts.filter(shift => {
      const startTime = padTime(shift.startTime);
      const startHour = startTime.split(':')[0];
      const slotHour = time.split(':')[0];
      return startHour === slotHour;
    });
    return acc;
  }, {} as Record<string, Shift[]>);

  // Debug logging
  console.log('DayView - Total shifts:', shifts.length);
  console.log('DayView - Shifts by time slot:', shiftsByTimeSlot);
  shifts.forEach(shift => {
    console.log(`Shift: ${shift.title}, startTime: ${shift.startTime}, padded: ${padTime(shift.startTime)}`);
  });

  // Get all shifts sorted by start time for the compact list view
  const allShiftsSorted = [...shifts].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Timeline View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
            <Badge variant="outline">
              {shifts.length} shifts
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-1">
              {timeSlots.map((time) => {
                const timeShifts = shiftsByTimeSlot[time] || [];

                return (
                  <div key={time} className="flex items-start gap-3 py-1">
                    <div className="w-14 text-xs text-muted-foreground pt-1">
                      {time}
                    </div>
                    <div className="flex-1">
                      {timeShifts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {timeShifts.map((shift) => {
                            const shiftConflicts = getShiftConflicts(shift.id);
                            const hasConflicts = shiftConflicts.length > 0;

                            return (
                              <div
                                key={shift.id}
                                className={`p-2 rounded border cursor-pointer transition-colors hover:bg-muted/50 ${
                                  hasConflicts ? 'border-red-200 bg-red-50' : 'border-border bg-muted/20'
                                }`}
                                onClick={() => onShiftClick(shift)}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium truncate">{shift.title}</span>
                                  {hasConflicts && (
                                    <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />
                                  )}
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{shift.startTime}-{shift.endTime}</span>
                                  <span>{shift.assignedEmployees.length}/{shift.requiredEmployees}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="h-2"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compact List View */}
      <Card>
        <CardHeader>
          <CardTitle>All Shifts Today</CardTitle>
          <CardDescription>
            Sorted by start time • Click to view details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {allShiftsSorted.length > 0 ? (
                allShiftsSorted.map((shift) => {
                  const shiftConflicts = getShiftConflicts(shift.id);
                  const hasConflicts = shiftConflicts.length > 0;

                  return (
                    <div
                      key={shift.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                        hasConflicts ? 'border-red-200 bg-red-50' : 'border-border'
                      }`}
                      onClick={() => onShiftClick(shift)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{shift.title}</h4>
                        <div className="flex items-center gap-2">
                          {hasConflicts && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                          <Badge
                            variant={shift.priority === 'high' ? 'destructive' :
                                    shift.priority === 'medium' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {shift.priority}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {shift.startTime} - {shift.endTime}
                        </span>
                        <span className="capitalize">{shift.department}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs">
                          <Users className="w-3 h-3" />
                          <span>
                            {shift.assignedEmployees.length}/{shift.requiredEmployees} assigned
                          </span>
                        </div>
                        {Array.isArray(shift.requiredStation) && shift.requiredStation.length > 0 && (
                          <div className="flex gap-1">
                            {shift.requiredStation.slice(0, 2).map(station => (
                              <Badge key={station} variant="outline" className="text-xs">
                                {station.replace('_', ' ')}
                              </Badge>
                            ))}
                            {shift.requiredStation.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{shift.requiredStation.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No shifts scheduled</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
