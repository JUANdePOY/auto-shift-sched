import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Label } from '../../shared/components/ui/label';
import { Badge } from '../../shared/components/ui/badge';
import { toast } from 'sonner';
import { availabilityService } from '../services/availabilityService';
import type { AdminAvailabilitySubmission, AvailabilityStatus } from '../types/availability';

export const AdminAvailabilityGrid: React.FC = () => {
  const [weekStart, setWeekStart] = useState<string>('');
  const [submissions, setSubmissions] = useState<AdminAvailabilitySubmission[]>([]);
  const [status, setStatus] = useState<AvailabilityStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Get current week start (Monday)
  const getCurrentWeekStart = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, '0');
    const day = String(monday.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const currentWeek = getCurrentWeekStart();
    setWeekStart(currentWeek);
    loadData(currentWeek);
  }, []);

  const loadData = async (week: string) => {
    try {
      setLoading(true);
      const [submissionsData, statusData] = await Promise.all([
        availabilityService.getWeeklySubmissions(week),
        availabilityService.getAvailabilityStatus(week)
      ]);
      setSubmissions(submissionsData);
      setStatus(statusData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load availability data');
    } finally {
      setLoading(false);
    }
  };

  const handleWeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setWeekStart(value);
  };

  const handleLoadData = () => {
    if (weekStart) {
      loadData(weekStart);
    }
  };

  const handleLockSubmissions = async () => {
    try {
      await availabilityService.lockAvailability(weekStart);
      toast.success('Availability submissions locked successfully');
      loadData(weekStart);
    } catch (error) {
      console.error('Error locking submissions:', error);
      toast.error('Failed to lock availability submissions');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getDayStatus = (dayAvailability: any) => {
    if (!dayAvailability || !dayAvailability.available) {
      return { text: '❌', variant: 'destructive' as const, tooltip: 'Unavailable' };
    }

    // Check if it's a rest request day
    if (dayAvailability.requestRestDay) {
      return { text: '☕', variant: 'secondary' as const, tooltip: 'Rest Request Day' };
    }

    // Display exact start and end times - support both new and old formats
    let start = dayAvailability.startTime || dayAvailability.preferredStart || 'Not set';
    let end = dayAvailability.endTime || dayAvailability.preferredEnd || 'Not set';

    // Handle legacy "any" values from old data format
    if (start === 'any' && end === 'any') {
      start = '00:00';
      end = '23:59';
    }

    return {
      text: `✅ ${start} - ${end}`,
      variant: 'default' as const,
      tooltip: `${start} - ${end}`
    };
  };

  if (loading) {
    return <div className="p-8 text-center">Loading availability data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Availability Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label htmlFor="weekStart">Week Starting (Monday)</Label>
              <Input
                id="weekStart"
                type="date"
                value={weekStart}
                onChange={handleWeekChange}
                className="mt-1"
              />
            </div>
            
            <Button onClick={handleLoadData} className="h-10">
              Load Data
            </Button>
            
            <Button 
              onClick={handleLockSubmissions} 
              variant="destructive"
              disabled={!status || status.locked}
              className="h-10"
            >
              {status?.locked ? 'Already Locked' : 'Lock Submissions'}
            </Button>
            
            {status && (
              <div className="space-y-1 text-sm">
                <div><strong>Employees:</strong> {status.totalEmployees}</div>
                <div><strong>Submissions:</strong> {status.submissions}</div>
                <div><strong>Rate:</strong> {status.submissionRate}%</div>
                <div>
                  <strong>Status:</strong>{' '}
                  <Badge variant={status.locked ? 'destructive' : 'default'}>
                    {status.locked ? 'Locked' : 'Open'}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Availability Grid */}
      {submissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Availability for {weekStart}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Employee</th>
                    <th className="text-left p-3 font-semibold">Department</th>
                    <th className="text-left p-3 font-semibold">Station</th>
                    {dayNames.map(day => (
                      <th key={day} className="text-center p-3 font-semibold">{day}</th>
                    ))}
                    <th className="text-left p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr key={submission.employeeId} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{submission.employeeName}</td>
                      <td className="p-3 text-sm text-muted-foreground">{submission.department}</td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {Array.isArray(submission.station) ? submission.station.join(', ') : submission.station}
                      </td>
                      
                      {daysOfWeek.map(day => {
                        const dayAvail = submission.availability[day];
                        const status = getDayStatus(dayAvail);
                        return (
                          <td key={day} className="p-3 text-center" title={status.tooltip}>
                            <span className={status.variant === 'destructive' ? 'text-destructive' : 'text-green-600'}>
                              {status.text}
                            </span>
                          </td>
                        );
                      })}
                      
                      <td className="p-3">
                        <Badge variant={submission.isLocked ? 'destructive' : 'default'}>
                          {submission.isLocked ? 'Locked' : 'Submitted'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {submissions.length === 0 && weekStart && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No availability submissions found for {weekStart}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
