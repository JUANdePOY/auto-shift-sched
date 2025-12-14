import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { Button } from '../../../shared/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { WeeklyScheduleSummary } from '../WeeklyScheduleSummary';
import FinalScheduleView from './FinalScheduleView';
import { formatDateToYYYYMMDD } from '../../utils/exportUtils';
import type { Shift, ScheduleConflict } from '../../../shared/types';

// Utility function to convert 24-hour time to 12-hour format
const formatTo12Hour = (time: string): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

interface WeeklyCardViewProps {
  weekDates: Date[];
  shifts: (Shift & { assignedEmployeeNames?: string[]; assignedEmployeeStations?: string[][] })[];
  navigateWeek: (direction: 'prev' | 'next') => void;
  onShiftClick?: (shift: Shift | null) => void;
  getShiftConflicts?: (shiftId: string) => ScheduleConflict[];
  finalSchedule?: Array<{
    shift_id: number;
    employee_id: number;
    shift_title: string;
    date: string;
    startTime: string;
    endTime: string;
    employee_name: string;
    required_stations: string[];
  }> | null;
  isReadOnly?: boolean;
}

export function WeeklyCardView({
  weekDates,
  shifts,
  navigateWeek,
  finalSchedule,
  isReadOnly = false
}: WeeklyCardViewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleCardClick = (date: Date) => {
    const dateString = date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');
    setSelectedDate(dateString);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setSelectedDate(null);
  };

  return (
    <div className="flex justify-center items-center mt-10">
      <div className="space-y-10">
      {/* Header with week navigation */}
      <div className="flex items-center justify-between px-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateWeek('prev')}
          className="flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-sm sm:text-lg font-semibold text-center">
          Week of {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateWeek('next')}
          className="flex-shrink-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Weekly cards grid: responsive layout for all 7 days */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {weekDates.map((date) => {
          const dateString = formatDateToYYYYMMDD(date);
          const dayShifts = shifts.filter(shift => formatDateToYYYYMMDD(shift.date) === dateString);
          const dayFinalSchedule = finalSchedule?.filter(schedule => formatDateToYYYYMMDD(schedule.date) === dateString) || [];
          const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][weekDates.indexOf(date)];

          return (
            <Card
              key={date.toISOString()}
              className="aspect-square transition-all hover:shadow-lg hover:scale-130 cursor-pointer"
              onClick={() => handleCardClick(date)}
            >
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xs font-semibold">
                      {dayName}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {(() => {
                        const [y, m, d] = dateString.split('-');
                        return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      })()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    {dayFinalSchedule.length > 0 && (
                      <Badge variant="default" className="text-xs bg-blue-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Final
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-2 flex-1 flex flex-col justify-center">
                {(dayShifts.length > 0 || dayFinalSchedule.length > 0) ? (
                  <div className="space-y-2 text-center">
                    {/* Day Summary */}
                    <div className="flex justify-center gap-1">
                      {(() => {
                        const totalShifts = dayFinalSchedule.length > 0 ? dayFinalSchedule.length : dayShifts.length;
                        const totalEmployees = dayFinalSchedule.length > 0
                          ? new Set(dayFinalSchedule.map(schedule => schedule.employee_id)).size
                          : new Set(dayShifts.flatMap(shift => shift.assignedEmployees || []).filter(Boolean)).size;

                        return (
                          <>
                            <Badge variant="secondary" className="text-xs px-2 py-0.5">
                              {totalShifts} shift{totalShifts !== 1 ? 's' : ''}
                            </Badge>
                            <Badge variant="secondary" className="text-xs px-2 py-0.5">
                              {totalEmployees} employee{totalEmployees !== 1 ? 's' : ''}
                            </Badge>
                          </>
                        );
                      })()}
                    </div>

                    {/* Employee assignments */}
                    <div className="text-xs text-center text-muted-foreground max-w-full space-y-0.5">
                      {(() => {
                        // Use final schedule data if available, otherwise use shift assignedEmployeeNames
                        const assignments = dayFinalSchedule.length > 0
                          ? dayFinalSchedule.map(schedule => ({
                              name: schedule.employee_name,
                              title: schedule.shift_title,
                              startTime: schedule.startTime,
                              endTime: schedule.endTime
                            }))
                          : dayShifts.flatMap(shift =>
                              (shift.assignedEmployeeNames || []).map((name) => ({
                                name,
                                title: shift.title || 'Shift',
                                startTime: shift.startTime,
                                endTime: shift.endTime
                              }))
                            );

                        return assignments.length > 0 ? (
                          <>
                            {assignments.slice(0, 3).map((assignment, idx) => (
                              <div key={idx} className="truncate">
                                <span className="font-medium">{assignment.name}</span>
                                {assignment.startTime && assignment.endTime && (
                                  <span className="text-muted-foreground block text-[10px]">
                                    {formatTo12Hour(assignment.startTime)} - {formatTo12Hour(assignment.endTime)}
                                  </span>
                                )}
                              </div>
                            ))}
                            {assignments.length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                +{assignments.length - 3} more
                              </div>
                            )}
                          </>
                        ) : null;
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Calendar className="w-6 h-6 mx-auto mb-1 opacity-30" />
                    <p className="text-xs">No shifts</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        
      </div>
      </div>

      {/* Final Schedule View */}
      {selectedDate && (
        <FinalScheduleView
          isOpen={isPanelOpen}
          onClose={handleClosePanel}
          date={selectedDate}
          isReadOnly={isReadOnly}
        />
      )}
    </div>
  );
}
