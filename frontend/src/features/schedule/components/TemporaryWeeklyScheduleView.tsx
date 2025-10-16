import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Badge } from '../../shared/components/ui/badge';
import { Button } from '../../shared/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, Save, ArrowLeft } from 'lucide-react';
import { ScheduleHeader } from './header/ScheduleHeader';
import ShiftAssignmentPanel from './ShiftAssignmentPanel';
import type { Employee } from '../../shared/types';

interface TemporaryWeeklyScheduleViewProps {
  weekDates: Date[];
  employees: Employee[];
  onSaveWeeklySchedule: (assignments: Array<{ shiftId: string; employeeId: string; date: string }>) => Promise<void>;
  onBackToScheduleView: () => void;
  navigateWeek: (direction: 'prev' | 'next') => void;
  formatDateToString: (date: Date) => string;
  onRefreshData: (weekStart?: string) => void;
  currentWeek: Date;
}

interface DayAssignments {
  date: string;
  assignments: Array<{ shiftId: string; employeeId: string; employeeName: string; shiftTitle: string; department: string; requiredStations: string[]; time: string; startTime: string; endTime: string }>;
  isComplete: boolean;
}

const TemporaryWeeklyScheduleView: React.FC<TemporaryWeeklyScheduleViewProps> = ({
  weekDates,
  employees,
  onSaveWeeklySchedule,
  onBackToScheduleView,
  navigateWeek,
  formatDateToString,
  onRefreshData,
  currentWeek
}) => {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isAssignmentPanelOpen, setIsAssignmentPanelOpen] = useState(false);
  const [weeklyAssignments, setWeeklyAssignments] = useState<DayAssignments[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize weekly assignments structure
  useEffect(() => {
    const initialAssignments: DayAssignments[] = weekDates.map(date => ({
      date: formatDateToString(date),
      assignments: [],
      isComplete: false
    }));
    setWeeklyAssignments(initialAssignments);
  }, [weekDates, formatDateToString]);

  const handleDayClick = (date: Date) => {
    setSelectedDay(date);
    setIsAssignmentPanelOpen(true);
  };

  const handleSaveDayAssignments = async (date: string, assignments: Array<{ shiftId: string; employeeId: string }>) => {
    // Transform the assignments to include additional details for local storage
    const enrichedAssignments = assignments.map(assignment => {
      const employee = employees.find(emp => emp.id === assignment.employeeId);
      return {
        shiftId: assignment.shiftId,
        employeeId: assignment.employeeId,
        employeeName: employee?.name || '',
        shiftTitle: '', // We'll need to get this from the shift data
        department: '', // We'll need to get this from the shift data
        requiredStations: [] as string[], // We'll need to get this from the shift data
        time: '', // We'll need to get this from the shift data
        startTime: '', // We'll need to get this from the shift data
        endTime: '' // We'll need to get this from the shift data
      };
    });

    setWeeklyAssignments(prev => prev.map(day =>
      day.date === date
        ? { ...day, assignments: enrichedAssignments, isComplete: assignments.length > 0 }
        : day
    ));
    setIsAssignmentPanelOpen(false);
    setSelectedDay(null);
  };

  const handleSaveWeeklySchedule = async () => {
    setIsSaving(true);
    try {
      // Flatten all assignments into a single array
      const allAssignments = weeklyAssignments.flatMap(day =>
        day.assignments.map(assignment => ({
          shiftId: assignment.shiftId,
          employeeId: assignment.employeeId,
          date: day.date
        }))
      );

      await onSaveWeeklySchedule(allAssignments);
      onBackToScheduleView();
    } catch (error) {
      console.error('Failed to save weekly schedule:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getDayStatus = (date: Date) => {
    const dateString = formatDateToString(date);
    const dayData = weeklyAssignments.find(day => day.date === dateString);
    return dayData?.isComplete ? 'complete' : dayData?.assignments.length > 0 ? 'partial' : 'empty';
  };

  const completedDays = weeklyAssignments.filter(day => day.isComplete).length;
  const totalDays = weeklyAssignments.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <ScheduleHeader
        onRefreshData={onRefreshData}
        currentWeek={currentWeek}
        formatDateToString={formatDateToString}
        onCreateSchedule={() => {}} // Not used in this view
        onCreateWeeklySchedule={onBackToScheduleView}
      />

      {/* Weekly Progress */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-800">Weekly Schedule Creation</span>
          </div>
          <Badge variant="outline" className="bg-white">
            {completedDays}/{totalDays} days completed
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={onBackToScheduleView}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Schedule View
          </Button>

          <Button
            onClick={handleSaveWeeklySchedule}
            disabled={isSaving || completedDays === 0}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Weekly Schedule'}
          </Button>
        </div>
      </div>

      {/* Weekly Cards Grid */}
      <div className="flex justify-center items-center">
        <div className="space-y-6">
          {/* Top row: 4 cards */}
          <div className="grid grid-cols-4 gap-8 z-0">
            {weekDates.slice(0, 4).map((date) => {
              const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][weekDates.indexOf(date)];
              const status = getDayStatus(date);
              const dayData = weeklyAssignments.find(day => day.date === formatDateToString(date));

              return (
                <Card
                  key={date.toISOString()}
                  className={`aspect-square cursor-pointer transition-all hover:shadow-lg hover:scale-105 relative ${
                    status === 'complete' ? 'border-green-300 bg-green-50' :
                    status === 'partial' ? 'border-yellow-300 bg-yellow-50' :
                    'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handleDayClick(date)}
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
                      <Badge
                        variant={status === 'complete' ? 'default' : status === 'partial' ? 'secondary' : 'outline'}
                        className={`text-xs ${
                          status === 'complete' ? 'bg-green-600' :
                          status === 'partial' ? 'bg-yellow-600' : ''
                        }`}
                      >
                        {status === 'complete' ? '✓' : status === 'partial' ? '~' : '+'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-2 flex-1 flex flex-col justify-center">
                    {dayData && dayData.assignments && dayData.assignments.length > 0 ? (
                      <div className="space-y-2 text-center">
                        <div className="text-sm font-bold text-blue-600">
                          {dayData.assignments.length} shift{dayData.assignments.length !== 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Set(dayData.assignments.map(a => a.employeeId)).size} employee{new Set(dayData.assignments.map(a => a.employeeId)).size !== 1 ? 's' : ''}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <Calendar className="w-6 h-6 mx-auto mb-1 opacity-30" />
                        <p className="text-xs">Click to assign</p>
                      </div>
                    )}
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

            <div className="grid grid-cols-3 gap-8 flex-5">
              {weekDates.slice(4, 7).map((date) => {
                const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][weekDates.indexOf(date)];
                const status = getDayStatus(date);
                const dayData = weeklyAssignments.find(day => day.date === formatDateToString(date));

                return (
                  <Card
                    key={date.toISOString()}
                    className={`aspect-square cursor-pointer transition-all hover:shadow-lg hover:scale-105 relative ${
                      status === 'complete' ? 'border-green-300 bg-green-50' :
                      status === 'partial' ? 'border-yellow-300 bg-yellow-50' :
                      'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => handleDayClick(date)}
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
                        <Badge
                          variant={status === 'complete' ? 'default' : status === 'partial' ? 'secondary' : 'outline'}
                          className={`text-xs ${
                            status === 'complete' ? 'bg-green-600' :
                            status === 'partial' ? 'bg-yellow-600' : ''
                          }`}
                        >
                          {status === 'complete' ? '✓' : status === 'partial' ? '~' : '+'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-2 flex-1 flex flex-col justify-center">
                    {dayData && dayData.assignments && dayData.assignments.length > 0 ? (
                      <div className="space-y-2 text-center">
                        <div className="text-sm font-bold text-blue-600">
                          {dayData.assignments.length} shift{dayData.assignments.length !== 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Set(dayData.assignments.map(a => a.employeeId)).size} employee{new Set(dayData.assignments.map(a => a.employeeId)).size !== 1 ? 's' : ''}
                        </div>
                      </div>
                    ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          <Calendar className="w-6 h-6 mx-auto mb-1 opacity-30" />
                          <p className="text-xs">Click to assign</p>
                        </div>
                      )}
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
        </div>
      </div>

      {/* Shift Assignment Panel */}
      {isAssignmentPanelOpen && selectedDay && (
        <ShiftAssignmentPanel
          isOpen={isAssignmentPanelOpen}
          onClose={() => {
            setIsAssignmentPanelOpen(false);
            setSelectedDay(null);
          }}
          date={formatDateToString(selectedDay)}
          employees={employees}
          onSaveFinalSchedule={handleSaveDayAssignments}
        />
      )}
    </div>
  );
};

export default TemporaryWeeklyScheduleView;
