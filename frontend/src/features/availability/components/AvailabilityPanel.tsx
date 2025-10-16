import React, { useState, useEffect } from 'react';
import { availabilityService } from '../services/availabilityService';
import { getAllDepartments } from '../../employees/services/departmentService';
import { Card, CardContent, CardHeader } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Label } from '../../shared/components/ui/label';
import { Badge } from '../../shared/components/ui/badge';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/components/ui/select';
import { RadioGroup, RadioGroupItem } from '../../shared/components/ui/radio-group';
import { RefreshCw, Lock, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import type { AdminAvailabilitySubmission, AvailabilityStatus } from '../types/availability';
import type { Department } from '../../shared/types';


import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../shared/components/ui/dialog';


interface AvailabilityPanelProps {
  initialWeekStart?: string;
}

const getCurrentDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMondayOfWeek = (dateString: string) => {
  const date = new Date(dateString);
  const dayOfWeek = date.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const day = String(monday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCurrentWeekStart = () => {
  return getMondayOfWeek(getCurrentDate());
};

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const AvailabilityPanel: React.FC<AvailabilityPanelProps> = ({ initialWeekStart }) => {
  const [weekStart, setWeekStart] = useState<string>(getMondayOfWeek(initialWeekStart || getCurrentWeekStart()));
  const [allSubmissions, setAllSubmissions] = useState<AdminAvailabilitySubmission[]>([]);
  const [status, setStatus] = useState<AvailabilityStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New state for improvements
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [departments, setDepartments] = useState<Department[]>([]);

  const [editingSubmission, setEditingSubmission] = useState<AdminAvailabilitySubmission | null>(null);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editAvailability, setEditAvailability] = useState<Record<string, { type: 'not_available' | 'anytime' | 'specific'; preferredStart?: string; preferredEnd?: string }>>({});

  useEffect(() => {
    loadAllSubmissions();
    loadStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const deps = await getAllDepartments();
        setDepartments(deps);
      } catch (error) {
        console.error('Error loading departments:', error);
      }
    };
    loadDepartments();
  }, []);

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
    const selectedDate = e.target.value;
    const mondayOfWeek = getMondayOfWeek(selectedDate);
    setWeekStart(mondayOfWeek);
  };

  const goToPreviousWeek = () => {
    const current = new Date(weekStart);
    current.setDate(current.getDate() - 7);
    const newWeekStart = getMondayOfWeek(current.toISOString().split('T')[0]);
    setWeekStart(newWeekStart);
  };

  const goToNextWeek = () => {
    const current = new Date(weekStart);
    current.setDate(current.getDate() + 7);
    const newWeekStart = getMondayOfWeek(current.toISOString().split('T')[0]);
    setWeekStart(newWeekStart);
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

  const handleEdit = (submission: AdminAvailabilitySubmission, day: string) => {
    setEditingSubmission(submission);
    setEditingDay(day);
    const dayAvail = submission.availability[day];
    const isAvailable = dayAvail?.available || false;
    const hasTimes = dayAvail?.preferredStart || dayAvail?.preferredEnd;
    let type: 'not_available' | 'anytime' | 'specific';
    if (!isAvailable) {
      type = 'not_available';
    } else if (!hasTimes) {
      type = 'anytime';
    } else {
      type = 'specific';
    }
    setEditAvailability({
      [day]: {
        type,
        preferredStart: dayAvail?.preferredStart || '',
        preferredEnd: dayAvail?.preferredEnd || ''
      }
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSubmission || !editingDay) return;
    const dayAvail = editAvailability[editingDay];
    const available = dayAvail.type !== 'not_available';
    const availability: Record<string, { available: boolean; preferredStart?: string; preferredEnd?: string }> = {
      [editingDay]: {
        available,
        ...(available && dayAvail.type === 'specific' && {
          preferredStart: dayAvail.preferredStart || undefined,
          preferredEnd: dayAvail.preferredEnd || undefined
        })
      }
    };
    try {
      await availabilityService.adminSubmitAvailability(editingSubmission.employeeId, weekStart, availability);
      toast.success('Availability updated successfully');
      loadAllSubmissions();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update availability');
    }
  };

  // Filter submissions based on selected filters
  const filteredSubmissions = allSubmissions.filter(submission => {
    const matchesDepartment = selectedDepartment === 'all' || submission.department === selectedDepartment;
    const matchesStatus = selectedStatus === 'all' ||
      (selectedStatus === 'submitted' && submission.status === 'submitted') ||
      (selectedStatus === 'not_submitted' && submission.status === 'not_submitted') ||
      (selectedStatus === 'locked' && submission.status === 'locked');
    return matchesDepartment && matchesStatus;
  });

  if (loading) return <div className="p-4 text-center">Loading availability...</div>;
  if (error) return <div className="p-4 text-center text-destructive">Error: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Availability Calendar */}
      <Card>
        <CardHeader className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-4">
            <Button
              onClick={() => { loadAllSubmissions(); loadStatus(); }}
              variant="outline"
              size="default"
              className="gap-2 shadow-sm hover:shadow-md transition-shadow"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </Button>
            <Button
              onClick={handleLockSubmissions}
              variant={status?.locked ? "secondary" : "destructive"}
              size="default"
              disabled={status?.locked}
              className="gap-2 shadow-sm hover:shadow-md transition-shadow"
            >
              <Lock className="w-4 h-4" />
              {status?.locked ? 'Locked' : 'Lock Submissions'}
            </Button>
          </div>
          <div className="flex justify-center items-center gap-2">
            <Button onClick={goToPreviousWeek} variant="outline" size="sm">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Label htmlFor="weekStart" className="text-sm font-medium">
              Week:
            </Label>
            <Input
              id="weekStart"
              type="date"
              value={weekStart}
              onChange={handleWeekChange}
              className="w-36"
            />
            <Button onClick={goToNextWeek} variant="outline" size="sm">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Dept:</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Status:</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="not_submitted">Not Submitted</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredSubmissions.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="grid grid-cols-[min-content_min-content_repeat(7,1fr)] gap-1 min-w-max">
                {/* Day Headers */}
                <div className="font-semibold text-center p-2 bg-muted"></div> {/* Empty corner */}
                <div className="font-semibold text-center p-2 bg-muted border border-border">Status</div>
                {dayNames.map((day) => (
                  <div key={day} className="font-semibold text-center p-2 bg-muted border border-border">
                    {day}
                  </div>
                ))}

                {/* Employee Rows */}
                {filteredSubmissions.map((submission) => (
                  <React.Fragment key={submission.id}>
                    <div className="p-2 font-medium border border-border bg-muted/50 whitespace-nowrap">
                      {submission.employeeName}
                      <div className="text-xs text-muted-foreground">
                        {submission.department}
                      </div>
                    </div>
                    <div className="p-2 border border-border bg-muted/50 flex items-center justify-center">
                      <Badge variant={submission.status === 'locked' ? 'destructive' : submission.status === 'not_submitted' ? 'secondary' : 'default'}>
                        {submission.status === 'locked' ? 'Locked' : submission.status === 'not_submitted' ? 'Not Submitted' : 'Submitted'}
                      </Badge>
                    </div>
                    {daysOfWeek.map((day) => {
                      const dayAvail = submission.availability[day];
                      const isAvailable = dayAvail?.available || false;
                      const start = dayAvail?.preferredStart || 'Any';
                      const end = dayAvail?.preferredEnd || 'Any';
                      const cellClass = isAvailable
                        ? 'bg-green-100 border-green-300 hover:bg-green-200'
                        : 'bg-destructive/10 border-destructive/30 hover:bg-destructive/20';
                      return (
                        <div
                          key={day}
                          className={`p-1 border text-center cursor-pointer ${cellClass}`}
                          onClick={() => handleEdit(submission, day)}
                          title={isAvailable ? `${start} - ${end}` : 'Unavailable'}
                        >
                          {isAvailable ? (
                            <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="w-4 h-4 text-destructive mx-auto" />
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No submissions match the current filters for {weekStart}
            </div>
          )}
        </CardContent>
      </Card>

      {isEditModalOpen && editingSubmission && editingDay && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Availability for {editingSubmission.employeeName} - {dayNames[daysOfWeek.indexOf(editingDay)]}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {(() => {
                const dayAvail = editAvailability[editingDay];
                return (
                  <div className="space-y-2">
                    <div className="space-y-3">
                      <Label>{dayNames[daysOfWeek.indexOf(editingDay)]}</Label>
                      <RadioGroup value={dayAvail.type} onValueChange={(value) => setEditAvailability(prev => ({
                        ...prev,
                        [editingDay]: { ...prev[editingDay], type: value as 'not_available' | 'anytime' | 'specific' }
                      }))}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="not_available" id={`${editingDay}-not_available`} />
                          <Label htmlFor={`${editingDay}-not_available`}>Not Available</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="anytime" id={`${editingDay}-anytime`} />
                          <Label htmlFor={`${editingDay}-anytime`}>Available Anytime</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="specific" id={`${editingDay}-specific`} />
                          <Label htmlFor={`${editingDay}-specific`}>Specific Time</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    {dayAvail.type === 'specific' && (
                      <div className="ml-6 space-y-2">
                        <div>
                          <Label htmlFor={`${editingDay}-start`}>Preferred Start Time</Label>
                          <Input
                            id={`${editingDay}-start`}
                            type="time"
                            value={dayAvail.preferredStart || ''}
                            onChange={(e) => setEditAvailability(prev => ({
                              ...prev,
                              [editingDay]: { ...prev[editingDay], preferredStart: e.target.value || undefined }
                            }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`${editingDay}-end`}>Preferred End Time</Label>
                          <Input
                            id={`${editingDay}-end`}
                            type="time"
                            value={dayAvail.preferredEnd || ''}
                            onChange={(e) => setEditAvailability(prev => ({
                              ...prev,
                              [editingDay]: { ...prev[editingDay], preferredEnd: e.target.value || undefined }
                            }))}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveEdit}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
};

export default AvailabilityPanel;
