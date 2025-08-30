import React, { useState, useEffect } from 'react';
import { availabilityService } from '../services/availabilityService';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Label } from '../../shared/components/ui/label';
import { Badge } from '../../shared/components/ui/badge';
import { toast } from 'sonner';
import type { AdminAvailabilitySubmission, AvailabilityStatus } from '../types/availability';

interface AvailabilityPanelProps {
  initialWeekStart?: string;
}

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

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const AvailabilityPanel: React.FC<AvailabilityPanelProps> = ({ initialWeekStart }) => {
  const [weekStart, setWeekStart] = useState<string>(initialWeekStart || getCurrentWeekStart());
  const [allSubmissions, setAllSubmissions] = useState<AdminAvailabilitySubmission[]>([]);
  const [status, setStatus] = useState<AvailabilityStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAllSubmissions();
    loadStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  const loadAllSubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const submissions = await availabilityService.getWeeklySubmissions(weekStart);
      setAllSubmissions(submissions);
    } catch (error) {
      console.error('Error loading submissions:', error);
      setError('Failed to load availability submissions');
      toast.error('Failed to load availability submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleWeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWeekStart(e.target.value);
  };

  const loadStatus = async () => {
    try {
      const statusData = await availabilityService.getAvailabilityStatus(weekStart);
      setStatus(statusData);
    } catch (error) {
      console.error('Error loading status:', error);
    }
  };

  const handleLockSubmissions = async () => {
    try {
      await availabilityService.lockAvailability(weekStart);
      toast.success('Availability submissions locked successfully');
      loadStatus();
      loadAllSubmissions();
    } catch (error) {
      console.error('Error locking submissions:', error);
      toast.error('Failed to lock availability submissions');
    }
  };

  const getDayStatus = (dayAvailability: { available?: boolean; preferredStart?: string; preferredEnd?: string }) => {
    if (!dayAvailability || !dayAvailability.available) {
      return { text: 'Unavailable', variant: 'destructive' as const };
    }
    
    const start = dayAvailability.preferredStart || 'Any';
    const end = dayAvailability.preferredEnd || 'Any';
    return { text: `${start} - ${end}`, variant: 'default' as const };
  };

  if (loading) return <div className="p-4 text-center">Loading availability...</div>;
  if (error) return <div className="p-4 text-center text-destructive">Error: {error}</div>;

  return (
    <div className="space-y-6">
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

        <Button onClick={() => { loadAllSubmissions(); loadStatus(); }} className="h-10">
          Load Data
        </Button>

        <Button 
          onClick={handleLockSubmissions} 
          variant="destructive"
          disabled={status?.locked}
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

      {/* Availability Grid */}
      {allSubmissions.length > 0 && (
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
                  {allSubmissions.map((submission) => (
                    <tr key={submission.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{submission.employeeName}</td>
                      <td className="p-3 text-sm text-muted-foreground">{submission.department}</td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {Array.isArray(submission.station) ? submission.station.join(', ') : submission.station}
                      </td>
                      
                      {daysOfWeek.map(day => {
                        const dayAvail = submission.availability[day];
                        const status = getDayStatus(dayAvail || { available: false });
                        return (
                          <td key={day} className="p-3 text-center text-sm">
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

      {allSubmissions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No availability submissions found for {weekStart}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AvailabilityPanel;
