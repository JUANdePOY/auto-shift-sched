import { useState } from 'react';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/components/ui/select';
import { Calendar, ChevronLeft, ChevronRight, Clock, Users } from 'lucide-react';
import type { Shift } from '../../../shared/types';

interface UnifiedScheduleNavigationProps {
  viewMode: 'week' | 'day';
  currentWeek: Date;
  selectedDay: Date;
  weekDates: Date[];
  shiftsToDisplay: Shift[];
  isToday: (date: Date) => boolean;
  isWeekend: (date: Date) => boolean;
  getRelativeDateLabel: (date: Date) => string;
  navigateToToday: () => void;
  navigateWeek: (direction: 'prev' | 'next') => void;
  navigateMonth: (direction: 'prev' | 'next') => void;
  setSelectedDay: (date: Date) => void;
  setCurrentWeek: (date: Date) => void;
}

export function UnifiedScheduleNavigation({
  viewMode,
  currentWeek,
  selectedDay,
  weekDates,
  shiftsToDisplay,
  isToday,
  isWeekend,
  getRelativeDateLabel,
  navigateToToday,
  navigateWeek,
  navigateMonth,
  setSelectedDay,
  setCurrentWeek
}: UnifiedScheduleNavigationProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    selectedDay.toISOString().split('T')[0]
  );

  // Get shifts for the current view
  const getShiftsForView = () => {
    if (viewMode === 'week') {
      return shiftsToDisplay;
    } else {
      // Day view - filter shifts for selected day
      const dateString = selectedDay.getFullYear() + '-' +
        String(selectedDay.getMonth() + 1).padStart(2, '0') + '-' +
        String(selectedDay.getDate()).padStart(2, '0');
      return shiftsToDisplay.filter(shift => shift.date === dateString);
    }
  };

  const currentShifts = getShiftsForView();
  const totalShifts = currentShifts.length;
  const totalEmployees = currentShifts.reduce((sum, shift) => sum + shift.assignedEmployees.length, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-4">
      {/* Header with View Mode and Quick Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {viewMode === 'week' ? 'Week View' : 'Day View'}
              </h2>
              <p className="text-sm text-gray-600">
                {viewMode === 'week'
                  ? `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  : selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                }
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 ml-8">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">{totalShifts} shifts</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
              <Users className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">{totalEmployees} employees</span>
            </div>
          </div>
        </div>

        {/* Today Button */}
        <Button
          variant={isToday(viewMode === 'week' ? new Date() : selectedDay) ? "default" : "outline"}
          size="sm"
          onClick={navigateToToday}
          className="flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          Today
        </Button>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between">
        {/* Left Navigation */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => viewMode === 'week' ? navigateWeek('prev') : navigateMonth('prev')}
            className="flex items-center gap-2 hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4" />
            {viewMode === 'week' ? 'Previous Week' : 'Previous Month'}
          </Button>

          {viewMode === 'day' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newDay = new Date(selectedDay);
                newDay.setDate(newDay.getDate() - 1);
                setSelectedDay(newDay);
              }}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous Day
            </Button>
          )}
        </div>

        {/* Center - Date Display and Selection */}
        <div className="flex items-center gap-4">
          {viewMode === 'week' ? (
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {currentWeek.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <p className="text-sm text-gray-600">
                Week {Math.ceil((currentWeek.getDate() - currentWeek.getDay() + 1) / 7)} of {currentWeek.getFullYear()}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedDay.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h3>
                <div className="flex items-center justify-center gap-2 mt-1">
                  {isToday(selectedDay) && (
                    <Badge variant="default" className="bg-blue-600 text-xs">Today</Badge>
                  )}
                  {isWeekend(selectedDay) && (
                    <Badge variant="outline" className="text-xs">Weekend</Badge>
                  )}
                  <span className="text-sm text-gray-600">{getRelativeDateLabel(selectedDay)}</span>
                </div>
              </div>

              <Select
                value={selectedDate}
                onValueChange={(value) => {
                  const newDate = new Date(value);
                  setSelectedDate(value);
                  setSelectedDay(newDate);
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weekDates.map((date) => {
                    const isDateToday = isToday(date);
                    const dateShifts = shiftsToDisplay.filter(shift => {
                      const dateString = date.getFullYear() + '-' +
                        String(date.getMonth() + 1).padStart(2, '0') + '-' +
                        String(date.getDate()).padStart(2, '0');
                      return shift.date === dateString;
                    });

                    return (
                      <SelectItem
                        key={date.toISOString()}
                        value={date.toISOString().split('T')[0]}
                        className={`${isDateToday ? 'bg-blue-50 text-blue-700 font-semibold' : ''}`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>
                            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                          <div className="flex items-center gap-2">
                            {dateShifts.length > 0 && (
                              <Badge variant="outline" className="text-xs">{dateShifts.length}</Badge>
                            )}
                            {isDateToday && <Badge variant="default" className="text-xs">Today</Badge>}
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Right Navigation */}
        <div className="flex items-center gap-3">
          {viewMode === 'day' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newDay = new Date(selectedDay);
                newDay.setDate(newDay.getDate() + 1);
                setSelectedDay(newDay);
              }}
              className="flex items-center gap-2"
            >
              Next Day
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => viewMode === 'week' ? navigateWeek('next') : navigateMonth('next')}
            className="flex items-center gap-2 hover:bg-gray-50"
          >
            {viewMode === 'week' ? 'Next Week' : 'Next Month'}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Week Overview for Day View */}
      {viewMode === 'day' && (
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Week Overview</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const weekStart = new Date(selectedDay);
                weekStart.setDate(selectedDay.getDate() - selectedDay.getDay());
                setCurrentWeek(weekStart);
              }}
              className="text-xs"
            >
              View Full Week
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weekDates.map((date, index) => {
              const isSelected = date.toDateString() === selectedDay.toDateString();
              const isDateToday = isToday(date);
              const dateShifts = shiftsToDisplay.filter(shift => {
                const dateString = date.getFullYear() + '-' +
                  String(date.getMonth() + 1).padStart(2, '0') + '-' +
                  String(date.getDate()).padStart(2, '0');
                return shift.date === dateString;
              });

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDay(date)}
                  className={`p-3 rounded-lg border text-center transition-all hover:shadow-sm ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="text-xs font-medium text-gray-600 mb-1">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index]}
                  </div>
                  <div className={`text-sm font-semibold mb-1 ${
                    isSelected ? 'text-blue-700' : isDateToday ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {date.getDate()}
                  </div>
                  {dateShifts.length > 0 && (
                    <Badge
                      variant={isSelected ? "default" : "outline"}
                      className="text-xs px-1.5 py-0.5"
                    >
                      {dateShifts.length}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
