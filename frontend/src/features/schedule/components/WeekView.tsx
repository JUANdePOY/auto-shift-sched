import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Badge } from '../../shared/components/ui/badge';
import { Calendar, Clock, Users, AlertTriangle } from 'lucide-react';
import type { Shift, ScheduleConflict } from '../../shared/types';

interface WeekViewProps {
  weekDates: Date[];
  shifts: (Shift & { assignedEmployeeNames?: string[]; assignedEmployeeStations?: string[][] })[];
  onShiftClick: (shift: Shift) => void;
  getShiftConflicts: (shiftId: string) => ScheduleConflict[];
}

export function WeekView({
  weekDates,
  shifts,
  onShiftClick,
  getShiftConflicts
}: WeekViewProps) {
  return (
    <div className="grid grid-cols-7 gap-3">
      {weekDates.map((date, index) => {
        // Use local date formatting to avoid timezone issues
        const dateString = date.getFullYear() + '-' +
          String(date.getMonth() + 1).padStart(2, '0') + '-' +
          String(date.getDate()).padStart(2, '0');
        const dayShifts = shifts.filter(shift => shift.date === dateString);
        const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index];

        return (
          <Card key={date.toISOString()} className="min-h-[500px] flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    {dayName}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </CardDescription>
                </div>
                {dayShifts.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {dayShifts.length}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-2">
              <div className="space-y-1.5 max-h-[420px] overflow-y-auto">
                {dayShifts.map((shift) => {
                  const shiftConflicts = getShiftConflicts(shift.id);
                  const hasConflicts = shiftConflicts.length > 0;

                  // Prepare employee names for display
                  const employeeNames = shift.assignedEmployeeNames || [];
                  const displayNames = employeeNames.slice(0, 3).map(name => name.split(' ')[0]);
                  const remainingNames = employeeNames.length - 3;
                  const fullNamesText = employeeNames.join(', ');

                  // Prepare stations for display
                  const allStations = shift.assignedEmployeeStations?.flat() || [];
                  const uniqueStations = [...new Set(allStations)];
                  const displayStations = uniqueStations.slice(0, 2);
                  const remainingStations = uniqueStations.length - 2;
                  const fullStationsText = uniqueStations.join(', ');

                  return (
                    <div
                      key={shift.id}
                      className={`p-2 rounded-md border cursor-pointer transition-all hover:shadow-sm hover:scale-[1.02] ${
                        hasConflicts ? 'border-red-300 bg-red-50/50' : 'border-border bg-card'
                      }`}
                      onClick={() => onShiftClick(shift)}
                      title={`${shift.title} (${shift.startTime}-${shift.endTime})`}
                    >
                      {/* Header with title and conflict indicator */}
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-medium truncate flex-1 mr-2" title={shift.title}>
                          {shift.title}
                        </p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {hasConflicts && (
                            <span title="Has conflicts">
                              <AlertTriangle className="w-3 h-3 text-red-500" />
                            </span>
                          )}
                          <Badge
                            variant={shift.priority === 'high' ? 'destructive' :
                                    shift.priority === 'medium' ? 'default' : 'secondary'}
                            className="text-xs px-1.5 py-0.5"
                          >
                            {shift.priority}
                          </Badge>
                        </div>
                      </div>

                      {/* Time and assignment count */}
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{shift.startTime}-{shift.endTime}</span>
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">
                          {shift.assignedEmployees.length}/{shift.requiredEmployees}
                        </span>
                      </div>

                      {/* Employee names */}
                      {employeeNames.length > 0 && (
                        <div className="mb-1">
                          <div
                            className="text-xs text-muted-foreground truncate"
                            title={fullNamesText}
                          >
                            <Users className="w-3 h-3 inline mr-1" />
                            {displayNames.join(', ')}
                            {remainingNames > 0 && ` +${remainingNames}`}
                          </div>
                        </div>
                      )}

                      {/* Stations */}
                      {uniqueStations.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {displayStations.map(station => (
                            <Badge
                              key={station}
                              variant="outline"
                              className="text-xs px-1.5 py-0.5 h-4"
                              title={station.replace('_', ' ')}
                            >
                              {station.replace('_', ' ')}
                            </Badge>
                          ))}
                          {remainingStations > 0 && (
                            <Badge
                              variant="outline"
                              className="text-xs px-1.5 py-0.5 h-4"
                              title={fullStationsText}
                            >
                              +{remainingStations}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {dayShifts.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No shifts</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
