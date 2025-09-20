import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Badge } from '../../shared/components/ui/badge';
import { Input } from '../../shared/components/ui/input';
import { Label } from '../../shared/components/ui/label';
import { Switch } from '../../shared/components/ui/switch';
import { toast } from 'sonner';
import { Calendar, Save, AlertCircle } from 'lucide-react';
import { availabilityService } from '../services/availabilityService';

interface AvailabilityCalendarProps {
  employeeId: string;
  employeeName: string;
  onSubmit?: () => void;
}

interface DayAvailability {
  available: boolean;
  preferredStart?: string;
  preferredEnd?: string;
}

const daysOfWeek = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' }
];

const timeSlots = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
];

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  employeeId,
  employeeName,
  onSubmit
}) => {
  const [weekStart, setWeekStart] = useState<string>(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    return monday.toISOString().split('T')[0];
  });

  const [availability, setAvailability] = useState<Record<string, DayAvailability>>(() => {
    const defaultAvailability: Record<string, DayAvailability> = {};
    daysOfWeek.forEach(day => {
      defaultAvailability[day.key] = {
        available: false,
        preferredStart: '',
        preferredEnd: ''
      };
    });
    return defaultAvailability;
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<string | null>(null);

  useEffect(() => {
    loadAvailability();
  }, [employeeId, weekStart]);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      const data = await availabilityService.getAvailability(parseInt(employeeId), weekStart);
      setAvailability(data.availability as Record<string, DayAvailability>);
      setIsLocked(data.isLocked ?? false);
      setLastSubmission(data.submissionDate ?? null);
    } catch (error) {
      console.error('Error loading availability:', error);
      toast.error('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityChange = (day: string, field: keyof DayAvailability, value: string | boolean) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleSubmit = async () => {
    if (isLocked) {
      toast.error('Availability submissions are locked for this week');
      return;
    }

    setSubmitting(true);
    try {
      await availabilityService.submitAvailability(employeeId, weekStart, availability);
      toast.success('Availability submitted successfully!');
      setLastSubmission(new Date().toISOString());
      onSubmit?.();
    } catch (error) {
      console.error('Error submitting availability:', error);
      toast.error('Failed to submit availability');
    } finally {
      setSubmitting(false);
    }
  };

  const getWeekDates = () => {
    const dates = [];
    const startDate = new Date(weekStart);
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return dates;
  };

  const weekDates = getWeekDates();

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          Loading availability...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Availability Calendar
          </h2>
          <p className="text-muted-foreground">
            Set your availability for the week of {new Date(weekStart).toLocaleDateString()}
          </p>
        </div>

        {lastSubmission && (
          <Badge variant="secondary">
            Last submitted: {new Date(lastSubmission).toLocaleDateString()}
          </Badge>
        )}
      </div>

      {/* Week Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <Label htmlFor="weekStart">Week Starting (Monday)</Label>
              <Input
                id="weekStart"
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="mt-1"
                disabled={isLocked}
              />
            </div>
            <Button onClick={loadAvailability} variant="outline">
              Load Week
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Availability Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Availability</CardTitle>
          {isLocked && (
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">This week's availability is locked</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {daysOfWeek.map((day, index) => (
              <div key={day.key} className="space-y-3">
                <div className="text-center">
                  <h3 className="font-medium">{day.label}</h3>
                  <p className="text-sm text-muted-foreground">{weekDates[index]}</p>
                </div>

                <div className="space-y-3">
                  {/* Available Toggle */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`${day.key}-available`} className="text-sm">
                      Available
                    </Label>
                    <Switch
                      id={`${day.key}-available`}
                      checked={availability[day.key]?.available || false}
                      onCheckedChange={(checked) =>
                        handleAvailabilityChange(day.key, 'available', checked)
                      }
                      disabled={isLocked}
                    />
                  </div>

                  {/* Preferred Times */}
                  {availability[day.key]?.available && (
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor={`${day.key}-start`} className="text-xs">
                          Preferred Start
                        </Label>
                        <select
                          id={`${day.key}-start`}
                          value={availability[day.key]?.preferredStart || ''}
                          onChange={(e) =>
                            handleAvailabilityChange(day.key, 'preferredStart', e.target.value)
                          }
                          className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                          disabled={isLocked}
                        >
                          <option value="">Any time</option>
                          {timeSlots.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label htmlFor={`${day.key}-end`} className="text-xs">
                          Preferred End
                        </Label>
                        <select
                          id={`${day.key}-end`}
                          value={availability[day.key]?.preferredEnd || ''}
                          onChange={(e) =>
                            handleAvailabilityChange(day.key, 'preferredEnd', e.target.value)
                          }
                          className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                          disabled={isLocked}
                        >
                          <option value="">Any time</option>
                          {timeSlots.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={isLocked || submitting}
          className="min-w-32"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Submitting...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Submit Availability
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
