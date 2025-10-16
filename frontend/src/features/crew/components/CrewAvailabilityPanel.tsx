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
    // Get next Monday
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + diff);
    return nextMonday.toISOString().split('T')[0];
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
        await updateAvailability(availability.id, localAvailability);
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

  const getNextWeeks = () => {
    const weeks = [];
    for (let i = 0; i < 4; i++) {
      const date = new Date(selectedWeek);
      date.setDate(date.getDate() + (i * 7));
      weeks.push({
        start: date.toISOString().split('T')[0],
        label: `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      });
    }
    return weeks;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>My Availability</h2>
          <p className="text-muted-foreground">
            Submit your availability for upcoming weeks
          </p>
        </div>
        <div className="flex items-center gap-2">
          {availabilityStatus?.isLocked && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Locked
            </Badge>
          )}
          {isSubmitted && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Submitted {new Date(availability.submittedAt).toLocaleDateString()}
            </Badge>
          )}
        </div>
      </div>

      {/* Week Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Button onClick={goToPreviousWeek} variant="outline" size="sm">
              <ChevronLeft className="w-4 h-4" />
              Previous Week
            </Button>
            <div className="text-center">
              <p className="text-sm font-medium">
                Current: Week of {new Date(selectedWeek).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <Button onClick={goToNextWeek} variant="outline" size="sm">
              Next Week
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {getNextWeeks().map((week) => (
              <Button
                key={week.start}
                variant={selectedWeek === week.start ? 'default' : 'outline'}
                onClick={() => handleWeekChange(week.start)}
                className="justify-start"
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                {week.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Availability Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Availability</CardTitle>
          <CardDescription>
            Check the days and times you're available to work. Note: 2 RRD (Rest Request Days) are required per week.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {daysOfWeek.map((day) => {
            const dayAvailability = currentAvailability?.preferences[day];
            const isAvailable = dayAvailability?.available || false;
            const requestRestDay = dayAvailability?.requestRestDay || false;

            return (
              <div key={day} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
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
                      className="flex items-center gap-1"
                    >
                      <Clock className="w-3 h-3" />
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
                      className="flex items-center gap-1"
                    >
                      <Clock className="w-3 h-3" />
                      Anytime
                    </Button>
                    <label
                      htmlFor={`${day}-available`}
                      className="text-sm font-medium capitalize cursor-pointer"
                    >
                      {day}
                    </label>
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
                    className="flex items-center gap-1"
                  >
                    <Coffee className="w-3 h-3" />
                    RRD
                  </Button>
                </div>

                {isAvailable && !requestRestDay && (
                  <div className="ml-6 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`${day}-startTime`} className="text-sm text-muted-foreground">
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
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${day}-endTime`} className="text-sm text-muted-foreground">
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
                        />
                      </div>
                    </div>



                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Notes (optional):</p>
                      <Textarea
                        placeholder="Any special notes for this day..."
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
                        className="min-h-[60px]"
                      />
                    </div>
                  </div>
                )}

                {requestRestDay && (
                  <div className="ml-6 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700 flex items-center gap-2">
                      <Coffee className="w-4 h-4" />
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
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving || !localAvailability || availabilityStatus?.isLocked}
          className="min-w-[120px]"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : availabilityStatus?.isLocked ? (
            <>
              <AlertCircle className="w-4 h-4 mr-2" />
              Locked
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {isSubmitted ? 'Update' : 'Submit'} Availability
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
