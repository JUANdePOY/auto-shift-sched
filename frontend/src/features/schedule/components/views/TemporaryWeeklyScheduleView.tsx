import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { WeeklyScheduleSummary } from '../WeeklyScheduleSummary';
import { useTemporarySchedule } from '../../contexts/TemporaryScheduleContext';

interface TemporaryWeeklyScheduleViewProps {
  weekDates: Date[];
  navigateWeek: (direction: 'prev' | 'next') => void;
  onDayClick: (date: string) => void;
  onSaveWeeklySchedule?: () => void;
}

export function TemporaryWeeklyScheduleView({
  weekDates,
  navigateWeek,
  onDayClick,
  onSaveWeeklySchedule
}: TemporaryWeeklyScheduleViewProps) {
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { summary, canSaveWeeklySchedule, saveWeeklySchedule } = useTemporarySchedule();

  const handleDayClick = (dateString: string) => {
    setSelectedDate(dateString);
    onDayClick(dateString);
  };

  const getDayStatus = (date: Date) => {
    const dateString = date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');

    const daySchedule = summary.employeeWorkloads.length > 0 ?
      summary.employeeWorkloads.some(workload =>
        summary.conflicts.some(conflict =>
          conflict.date === dateString && conflict.employeeId === workload.employeeId
        )
      ) : false;

    const hasAssignments = summary.totalAssignments > 0;

    if (daySchedule && summary.conflicts.some(c => c.date === dateString && c.severity === 'error')) {
      return 'error';
    }
    if (hasAssignments) {
      return 'completed';
    }
    return 'incomplete';
  };

  const getDayIcon = (date: Date) => {
    const status = getDayStatus(date);
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Panel */}
      <WeeklyScheduleSummary isOpen={showSummary} onToggle={() => setShowSummary(!showSummary)} />

      <div className="flex justify-center items-center mt-8">
        <div className="space-y-6">
        {/* Top row: 4 cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-12 z-0">
          {weekDates.slice(0, 4).map((date) => {
            const dateString = date.getFullYear() + '-' +
              String(date.getMonth() + 1).padStart(2, '0') + '-' +
              String(date.getDate()).padStart(2, '0');
            const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][weekDates.indexOf(date)];

            return (
              <Card
                key={date.toISOString()}
                className={`aspect-square cursor-pointer transition-all hover:shadow-lg hover:scale-125 relative ${hoveredDay === date ? 'z-[1]' : 'z-0'} ${selectedDate === dateString ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                onMouseEnter={() => setHoveredDay(date)}
                onMouseLeave={() => setHoveredDay(null)}
                onClick={() => handleDayClick(dateString)}
              >
                <CardHeader className="pb-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xs font-semibold">
                        {dayName}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </CardDescription>
                    </div>
                    {getDayIcon(date)}
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex-1 flex flex-col justify-center">
                  <div className="text-center py-4 text-muted-foreground">
                    <Calendar className="w-6 h-6 mx-auto mb-1 opacity-30" />
                    <p className="text-xs">Click to assign shifts</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom row: navigation + 3 cards + navigation */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('prev')}
            className="flex-shrink-0 px-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 flex-5">
            {weekDates.slice(4, 7).map((date) => {
              const dateString = date.getFullYear() + '-' +
                String(date.getMonth() + 1).padStart(2, '0') + '-' +
                String(date.getDate()).padStart(2, '0');
              const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][weekDates.indexOf(date)];

              return (
                <Card
                  key={date.toISOString()}
                  className={`aspect-square cursor-pointer transition-all hover:shadow-lg hover:scale-125 relative ${hoveredDay === date ? 'z-[1]' : 'z-0'} ${selectedDate === dateString ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                  onMouseEnter={() => setHoveredDay(date)}
                  onMouseLeave={() => setHoveredDay(null)}
                  onClick={() => handleDayClick(dateString)}
                >
                  <CardHeader className="pb-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xs font-semibold">
                          {dayName}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </CardDescription>
                      </div>
                      {getDayIcon(date)}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 flex-1 flex flex-col justify-center">
                    <div className="text-center py-4 text-muted-foreground">
                      <Calendar className="w-6 h-6 mx-auto mb-1 opacity-30" />
                      <p className="text-xs">Click to assign shifts</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('next')}
            className="flex-shrink-0 px-2"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">

          {onSaveWeeklySchedule && (
            <Button
              onClick={async () => {
                const success = await saveWeeklySchedule();
                if (success) {
                  onSaveWeeklySchedule();
                }
              }}
              disabled={!canSaveWeeklySchedule()}
              className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Weekly Schedule
            </Button>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
