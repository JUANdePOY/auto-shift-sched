import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Badge } from '../../shared/components/ui/badge';
import { CalendarDays, Clock, MapPin } from 'lucide-react';
import type { CrewShift } from '../types';

interface CrewUpcomingShiftsProps {
  shifts: CrewShift[];
  onWeekChange?: (direction: 'prev' | 'next') => void;
}

export function CrewUpcomingShifts({ shifts, onWeekChange }: CrewUpcomingShiftsProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Touch swipe handling for mobile navigation
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);

    const handleTouchEnd = () => {
      if (!touchStart || !touchEnd) return;
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > 50;
      const isRightSwipe = distance < -50;

      if (isLeftSwipe && onWeekChange) {
        onWeekChange('next');
      }
      if (isRightSwipe && onWeekChange) {
        onWeekChange('prev');
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart);
      container.addEventListener('touchmove', handleTouchMove);
      container.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [touchStart, touchEnd, onWeekChange]);

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

  const formatStation = (station: any) => {
    if (Array.isArray(station)) {
      return station.join(', ');
    }
    if (typeof station === 'string') {
      // Remove brackets and quotes if they exist
      return station.replace(/[\[\]"']/g, '').replace(/,/g, ', ');
    }
    return station || 'Not assigned';
  };

  const formatTo12Hour = (time: string): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const ShiftCard = ({ shift }: { shift: CrewShift }) => (
    <div className="p-6 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-3 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h4 className="text-lg font-bold text-slate-800">{shift.title}</h4>
            <Badge
              variant={
                shift.status === 'confirmed' ? 'default' :
                shift.status === 'pending' ? 'secondary' : 'destructive'
              }
              className={`text-sm px-3 py-1 font-medium ${
                shift.status === 'confirmed' 
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                  : shift.status === 'pending'
                    ? 'bg-amber-100 text-amber-700 border-amber-200'
                    : 'bg-red-100 text-red-700 border-red-200'
              }`}
            >
              {shift.status}
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <CalendarDays className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">{formatDate(shift.date)}</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <Clock className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">{formatTo12Hour(shift.startTime)} - {formatTo12Hour(shift.endTime)}</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <MapPin className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">{formatStation(shift.station)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Today's Shifts */}
      {todayShifts.length > 0 && (
        <Card className="shadow-md border border-slate-200 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-3 text-slate-800">
              <div className="p-2 bg-slate-100 rounded-lg">
                <CalendarDays className="w-6 h-6 text-slate-600" />
              </div>
              Today's Shifts
            </CardTitle>
            <CardDescription className="text-slate-600">
              Your scheduled shifts for today
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {todayShifts.map((shift, index) => (
              <ShiftCard key={`today-${shift.id}-${index}`} shift={shift} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tomorrow's Shifts */}
      {tomorrowShifts.length > 0 && (
        <Card className="shadow-md border border-slate-200 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-3 text-slate-800">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Clock className="w-6 h-6 text-emerald-600" />
              </div>
              Tomorrow's Shifts
            </CardTitle>
            <CardDescription className="text-slate-600">
              Your scheduled shifts for tomorrow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tomorrowShifts.map((shift, index) => (
              <ShiftCard key={`tomorrow-${shift.id}-${index}`} shift={shift} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Shifts */}
      {futureShifts.length > 0 && (
        <Card className="shadow-md border border-slate-200 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-3 text-slate-800">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CalendarDays className="w-6 h-6 text-blue-600" />
              </div>
              Upcoming Shifts
            </CardTitle>
            <CardDescription className="text-slate-600">
              Your next scheduled shifts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {futureShifts.map((shift, index) => (
              <ShiftCard key={`future-${shift.id}-${index}`} shift={shift} />
            ))}
            {shifts.filter(shift => shift.date > tomorrow).length > 5 && (
              <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm font-medium text-slate-600">
                  +{shifts.filter(shift => shift.date > tomorrow).length - 5} more shifts scheduled
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No shifts message */}
      {shifts.length === 0 && (
        <Card className="shadow-md border border-slate-200 bg-white">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No upcoming shifts</h3>
            <p className="text-slate-600 text-lg">
              You don't have any shifts scheduled at the moment.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
