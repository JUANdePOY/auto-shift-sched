import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Badge } from '../../shared/components/ui/badge';

import { Textarea } from '../../shared/components/ui/textarea';
import { Input } from '../../shared/components/ui/input';
import { Label } from '../../shared/components/ui/label';
import { CalendarDays, Clock, Save, AlertCircle, Coffee, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCrewData } from '../hooks/useCrewData';
import type { CrewAvailability } from '../types';

interface CrewAvailabilityPanelProps {
  employeeId: string;
}

export function CrewAvailabilityPanel({ employeeId }: CrewAvailabilityPanelProps) {
  const { availability, availabilityStatus, fetchAvailability, submitAvailability, updateAvailability } = useCrewData(employeeId);
  const [selectedWeek, setSelectedWeek] = useState<string>(() => {
    // Get next Monday using local date
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    const todayDate = new Date(todayStr + 'T00:00:00');
    const dayOfWeek = todayDate.getDay();
    const diff = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 7 : 8 - dayOfWeek);
    const nextMonday = new Date(todayDate);
    nextMonday.setDate(todayDate.getDate() + diff);
    const mondayYear = nextMonday.getFullYear();
    const mondayMonth = String(nextMonday.getMonth() + 1).padStart(2, '0');
    const mondayDay = String(nextMonday.getDate()).padStart(2, '0');
    return `${mondayYear}-${mondayMonth}-${mondayDay}`;
  });

  const [localAvailability, setLocalAvailability] = useState<CrewAvailability | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];


  const handleWeekChange = async (weekStart: string) => {
    setSelectedWeek(weekStart);
    try {
      await fetchAvailability(weekStart);
    } catch (err) {
      console.error('Failed to fetch availability for week:', err);
    }
  };

  const handleAvailabilityChange = (day: string, available: boolean, preferredTimes: string[], startTime?: string, endTime?: string, requestRestDay?: boolean, notes?: string) => {
    setLocalAvailability(prev => {
      const current = prev || availability || {
        id: '',
        weekStart: selectedWeek,
        preferences: {},
        submittedAt: ''
      };

      return {
        ...current,
        preferences: {
          ...current.preferences,
          [day]: { available, preferredTimes, startTime, endTime, requestRestDay: requestRestDay || false, notes }
        }
      };
    });
  };

  const handleSave = async () => {
    if (!localAvailability) return;

    // Validate that exactly 2 RRD days are selected
    const rrdCount = Object.values(localAvailability.preferences).filter(pref => pref.requestRestDay).length;
    if (rrdCount !== 2) {
      setError(`You must select exactly 2 Rest Request Days (RRD) per week. Currently selected: ${rrdCount}`);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (availability) {
        // For updates, ensure weekStart is included
        const updates = {
          ...localAvailability,
          weekStart: selectedWeek // Always include the current selected week
        };
        await updateAvailability(availability.id, updates);
      } else {
        await submitAvailability(localAvailability);
      }
      setLocalAvailability(null);
    } catch (err) {
      setError('Failed to save availability. Please try again.');
      console.error('Failed to save availability:', err);
    } finally {
      setSaving(false);
    }
  };

  const currentAvailability = localAvailability || availability;
  const isSubmitted = availability && availability.submittedAt;

  const getWeekOfMonth = (date: Date) => {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const firstMonday = new Date(firstDayOfMonth);
    const dayOfWeek = firstDayOfMonth.getDay();
    const daysToMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    firstMonday.setDate(firstDayOfMonth.getDate() + daysToMonday);
    
    const diffTime = date.getTime() - firstMonday.getTime();
    const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
    return Math.max(1, diffWeeks + 1);
  };

  const getNextWeeks = () => {
    const weeks = [];
    for (let i = 0; i < 4; i++) {
      const startDate = new Date(selectedWeek);
      startDate.setDate(startDate.getDate() + (i * 7));
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      
      const weekOfMonth = getWeekOfMonth(startDate);
      const monthName = startDate.toLocaleDateString('en-US', { month: 'long' });
      
      weeks.push({
        start: startDate.toISOString().split('T')[0],
        label: `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        weekNumber: weekOfMonth,
        monthName: monthName
      });
    }
    return weeks;
  };

  const getDateForDay = (dayName: string) => {
    const dayIndex = daysOfWeek.indexOf(dayName);
    const weekStart = new Date(selectedWeek);
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + dayIndex);
    return dayDate;
  };

  const goToPreviousWeek = () => {
    const current = new Date(selectedWeek);
    current.setDate(current.getDate() - 7);
    const newWeekStart = current.toISOString().split('T')[0];
    handleWeekChange(newWeekStart);
  };

  const goToNextWeek = () => {
    const current = new Date(selectedWeek);
    current.setDate(current.getDate() + 7);
    const newWeekStart = current.toISOString().split('T')[0];
    handleWeekChange(newWeekStart);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Status Badges */}
      {(availabilityStatus?.isLocked || isSubmitted) && (
        <div className="flex items-center justify-center gap-3">
          {availabilityStatus?.isLocked && (
            <Badge variant="destructive" className="flex items-center gap-2 px-3 py-1">
              <AlertCircle className="w-4 h-4" />
              Submissions Locked
            </Badge>
          )}
          {isSubmitted && (
            <Badge variant="default" className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 border-green-200">
              <Clock className="w-4 h-4" />
              Submitted {new Date(availability.submittedAt).toLocaleDateString()}
            </Badge>
          )}
        </div>
      )}

      {/* Week Selector */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CalendarDays className="w-6 h-6 text-blue-600" />
              </div>
              Week Selection
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                onClick={goToPreviousWeek} 
                variant="outline" 
                size="sm"
                className="h-10 w-10 p-0 border-2 hover:bg-gray-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button 
                onClick={goToNextWeek} 
                variant="outline" 
                size="sm"
                className="h-10 w-10 p-0 border-2 hover:bg-gray-50"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Current Week Display */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">Currently Selected Week</p>
              <p className="text-xl font-bold text-gray-900">
                {(() => {
                  const startDate = new Date(selectedWeek);
                  const endDate = new Date(startDate);
                  endDate.setDate(startDate.getDate() + 6);
                  return `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
                })()}
              </p>
            </div>
          </div>
          
          {/* Week Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Available Weeks</h3>
            <div className="grid gap-3">
              {getNextWeeks().map((week) => {
                const isSelected = selectedWeek === week.start;
                return (
                  <button
                    key={week.start}
                    onClick={() => handleWeekChange(week.start)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md transform hover:scale-[1.02] ${
                      isSelected 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-lg' 
                        : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-semibold text-lg ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                          Week {week.weekNumber} - {week.monthName}
                        </p>
                        <p className={`text-sm ${isSelected ? 'text-blue-100' : 'text-gray-600'}`}>
                          {week.label}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-3 h-3 bg-white rounded-full" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Availability Grid */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            Weekly Availability
          </CardTitle>
          <CardDescription className="text-base text-gray-600">
            Select the days and times you're available to work. <span className="font-semibold text-red-600">Note: Exactly 2 RRD (Rest Request Days) are required per week.</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {daysOfWeek.map((day) => {
            const dayAvailability = currentAvailability?.preferences[day];
            const isAvailable = dayAvailability?.available || false;
            const requestRestDay = dayAvailability?.requestRestDay || false;

            return (
              <div key={day} className={`space-y-4 p-6 border-2 rounded-xl transition-all duration-200 ${
                requestRestDay 
                  ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200' 
                  : isAvailable 
                    ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200' 
                    : 'bg-white border-gray-200 hover:border-gray-300'
              }`}>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg font-semibold capitalize text-gray-900">{day}</h3>
                      <p className="text-sm font-medium text-gray-600">
                        {getDateForDay(day).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                      <Button
                        variant={isAvailable ? 'default' : 'outline'}
                        size="sm"
                        disabled={requestRestDay}
                        onClick={() =>
                          handleAvailabilityChange(
                            day,
                            !isAvailable,
                            [],
                            dayAvailability?.startTime,
                            dayAvailability?.endTime,
                            requestRestDay,
                            dayAvailability?.notes
                          )
                        }
                        className={`w-full sm:w-auto flex items-center justify-center gap-1.5 font-medium ${
                          isAvailable ? 'bg-green-600 hover:bg-green-700' : 'border-2 hover:bg-gray-50'
                        } sm:h-10 sm:px-4`}
                      >
                        <Clock className="w-4 h-4" />
                        Available
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={requestRestDay}
                        onClick={() =>
                          handleAvailabilityChange(
                            day,
                            true,
                            [],
                            '00:00',
                            '23:59',
                            requestRestDay,
                            dayAvailability?.notes
                          )
                        }
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 font-medium border-2 hover:bg-blue-50 hover:border-blue-300 sm:h-10 sm:px-4"
                      >
                        <Clock className="w-4 h-4" />
                        Anytime
                      </Button>
                    </div>
                  </div>

                  <Button
                    variant={requestRestDay ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const newRequestRestDay = !requestRestDay;
                      handleAvailabilityChange(
                        day,
                        newRequestRestDay ? false : isAvailable,
                        [],
                        newRequestRestDay ? '' : dayAvailability?.startTime,
                        newRequestRestDay ? '' : dayAvailability?.endTime,
                        newRequestRestDay,
                        dayAvailability?.notes
                      );
                    }}
                    className={`w-full sm:w-auto flex items-center justify-center gap-2 font-medium self-start lg:self-center ${
                      requestRestDay 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300'
                    } sm:h-10 sm:px-4`}
                  >
                    <Coffee className="w-4 h-4" />
                    Rest Request Day
                  </Button>
                </div>

                {isAvailable && !requestRestDay && (
                  <div className="space-y-6 pt-4 border-t-2 border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor={`${day}-startTime`} className="text-sm font-semibold text-gray-700">
                          Start Time
                        </Label>
                        <Input
                          id={`${day}-startTime`}
                          type="time"
                          value={dayAvailability?.startTime || ''}
                          onChange={(e) =>
                            handleAvailabilityChange(
                              day,
                              true,
                              dayAvailability?.preferredTimes || [],
                              e.target.value,
                              dayAvailability?.endTime,
                              false,
                              dayAvailability?.notes
                            )
                          }
                          className="w-full h-12 text-base border-2 focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor={`${day}-endTime`} className="text-sm font-semibold text-gray-700">
                          End Time
                        </Label>
                        <Input
                          id={`${day}-endTime`}
                          type="time"
                          value={dayAvailability?.endTime || ''}
                          onChange={(e) =>
                            handleAvailabilityChange(
                              day,
                              true,
                              dayAvailability?.preferredTimes || [],
                              dayAvailability?.startTime,
                              e.target.value,
                              false,
                              dayAvailability?.notes
                            )
                          }
                          className="w-full h-12 text-base border-2 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-700">Notes (optional)</Label>
                      <Textarea
                        placeholder="Any special notes or preferences for this day..."
                        value={dayAvailability?.notes || ''}
                        onChange={(e) =>
                          handleAvailabilityChange(
                            day,
                            true,
                            dayAvailability?.preferredTimes || [],
                            dayAvailability?.startTime,
                            dayAvailability?.endTime,
                            false,
                            e.target.value
                          )
                        }
                        className="min-h-[80px] resize-none border-2 focus:border-blue-500 text-base"
                      />
                    </div>
                  </div>
                )}

                {requestRestDay && (
                  <div className="p-4 bg-gradient-to-r from-red-100 to-pink-100 border-2 border-red-300 rounded-lg">
                    <p className="text-base font-medium text-red-800 flex items-center gap-3">
                      <Coffee className="w-5 h-5" />
                      Rest Request Day - You will not be scheduled for work on this day.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-2 border-red-300 bg-gradient-to-r from-red-50 to-pink-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <p className="text-base font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-center pt-6">
        <Button
          onClick={handleSave}
          disabled={saving || !localAvailability || availabilityStatus?.isLocked}
          className={`min-w-[200px] h-14 text-lg font-semibold transition-all duration-200 ${
            availabilityStatus?.isLocked 
              ? 'bg-gray-400 hover:bg-gray-400' 
              : 'bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 shadow-lg hover:shadow-xl transform hover:scale-105'
          }`}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Saving...
            </>
          ) : availabilityStatus?.isLocked ? (
            <>
              <AlertCircle className="w-5 h-5 mr-3" />
              Submissions Locked
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-3" />
              {isSubmitted ? 'Update' : 'Submit'} Availability
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
