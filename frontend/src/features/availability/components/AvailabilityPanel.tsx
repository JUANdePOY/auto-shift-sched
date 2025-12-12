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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/components/ui/tabs';
import { RefreshCw, Lock, CheckCircle, XCircle, ChevronLeft, ChevronRight, Clock, AlertCircle } from 'lucide-react';
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

const formatTimeToAMPM = (time: string) => {
  if (!time) return time;
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editAvailability, setEditAvailability] = useState<Record<string, { type: 'not_available' | 'anytime' | 'specific'; preferredStart?: string; preferredEnd?: string }>>({});
  const [activeEditTab, setActiveEditTab] = useState<string>('monday');
  const [isSaving, setIsSaving] = useState(false);

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

  const handleEdit = (submission: AdminAvailabilitySubmission) => {
    setEditingSubmission(submission);

    const initialEditAvailability: Record<string, { type: 'not_available' | 'anytime' | 'specific'; preferredStart?: string; preferredEnd?: string }> = {};

    daysOfWeek.forEach((dayKey) => {
      const dayAvail = submission.availability[dayKey];
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

      initialEditAvailability[dayKey] = {
        type,
        preferredStart: dayAvail?.preferredStart || '',
        preferredEnd: dayAvail?.preferredEnd || ''
      };
    });

    setEditAvailability(initialEditAvailability);
    setActiveEditTab('monday');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSubmission) return;

    const availability: Record<string, { available: boolean; preferredStart?: string; preferredEnd?: string }> = {};
    Object.entries(editAvailability).forEach(([dayKey, dayAvail]) => {
      const available = dayAvail.type !== 'not_available';
      availability[dayKey] = {
        available,
        ...(available && dayAvail.type === 'specific' && {
          preferredStart: dayAvail.preferredStart && dayAvail.preferredStart.trim() ? dayAvail.preferredStart : undefined,
          preferredEnd: dayAvail.preferredEnd && dayAvail.preferredEnd.trim() ? dayAvail.preferredEnd : undefined
        })
      };
    });

    setIsSaving(true);
    try {
      await availabilityService.adminSubmitAvailability(editingSubmission.employeeId, weekStart, availability);
      toast.success('Availability updated successfully for all days');
      loadAllSubmissions();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update availability');
    } finally {
      setIsSaving(false);
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
                  <React.Fragment key={submission.employeeId}>
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
                      const start = dayAvail?.startTime || (dayAvail?.preferredStart && dayAvail.preferredStart.trim() ? dayAvail.preferredStart : undefined);
                      const end = dayAvail?.endTime || (dayAvail?.preferredEnd && dayAvail.preferredEnd.trim() ? dayAvail.preferredEnd : undefined);
                      const timeDisplay = start && end ? `${formatTimeToAMPM(start)} - ${formatTimeToAMPM(end)}` : start ? `${formatTimeToAMPM(start)} onwards` : end ? `until ${formatTimeToAMPM(end)}` : 'Anytime';
                      const cellClass = isAvailable
                        ? 'bg-green-100 border-green-300 hover:bg-green-200'
                        : 'bg-destructive/10 border-destructive/30 hover:bg-destructive/20';
                      return (
                        <div
                          key={day}
                          className={`p-1 border text-center cursor-pointer transition-colors ${cellClass}`}
                          onClick={() => handleEdit(submission)}
                          title={isAvailable ? timeDisplay : 'Unavailable - Click to edit'}
                        >
                          {isAvailable ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                              <span className="text-xs text-green-700 leading-tight whitespace-nowrap">{timeDisplay}</span>
                            </div>
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

      {isEditModalOpen && editingSubmission && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Edit Weekly Availability
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {editingSubmission.employeeName} • {editingSubmission.department}
              </p>
            </DialogHeader>

            <div className="space-y-4">
              {/* Info Box */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  Edit availability for all days of the week. Your changes will be saved when you click Save.
                </p>
              </div>

              {/* Tabs for each day */}
              <Tabs value={activeEditTab} onValueChange={setActiveEditTab} className="w-full">
                <TabsList className="grid grid-cols-7 w-full h-auto gap-1 p-1 bg-muted">
                  {daysOfWeek.map((day) => (
                    <TabsTrigger 
                      key={day} 
                      value={day}
                      className="text-xs px-2 py-1.5 data-[state=active]:bg-white"
                    >
                      {day.slice(0, 3).toUpperCase()}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Day Content */}
                {daysOfWeek.map((dayKey) => {
                  const dayAvail = editAvailability[dayKey];
                  const dayIndex = daysOfWeek.indexOf(dayKey);
            
                  return (
                    <TabsContent key={dayKey} value={dayKey} className="space-y-4 mt-4">
                      <h3 className="font-semibold text-lg">{dayNames[dayIndex]}</h3>
                
                      {/* Availability Type Options */}
                      <RadioGroup 
                        value={dayAvail.type} 
                        onValueChange={(value) => setEditAvailability(prev => ({
                          ...prev,
                          [dayKey]: { ...prev[dayKey], type: value as 'not_available' | 'anytime' | 'specific' }
                        }))}
                        className="space-y-3"
                      >
                        {/* Not Available */}
                        <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                          <RadioGroupItem value="not_available" id={`${dayKey}-not_available`} className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor={`${dayKey}-not_available`} className="cursor-pointer font-medium">
                              Not Available
                            </Label>
                            <p className="text-sm text-muted-foreground">Employee will not work on this day</p>
                          </div>
                        </div>

                        {/* Anytime */}
                        <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                          <RadioGroupItem value="anytime" id={`${dayKey}-anytime`} className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor={`${dayKey}-anytime`} className="cursor-pointer font-medium">
                              Available Anytime
                            </Label>
                            <p className="text-sm text-muted-foreground">Flexible hours throughout the day</p>
                          </div>
                        </div>

                        {/* Specific Times */}
                        <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                          <RadioGroupItem value="specific" id={`${dayKey}-specific`} className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor={`${dayKey}-specific`} className="cursor-pointer font-medium block mb-2">
                              Specific Times
                            </Label>
                            {dayAvail.type === 'specific' && (
                              <div className="grid grid-cols-2 gap-3 ml-6">
                                <div>
                                  <Label htmlFor={`${dayKey}-start`} className="text-xs text-muted-foreground block mb-1.5">
                                    Start Time
                                  </Label>
                                  <Input
                                    id={`${dayKey}-start`}
                                    type="time"
                                    value={dayAvail.preferredStart || ''}
                                    onChange={(e) => setEditAvailability(prev => ({
                                      ...prev,
                                      [dayKey]: { ...prev[dayKey], preferredStart: e.target.value || '' }
                                    }))}
                                    className="h-9 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`${dayKey}-end`} className="text-xs text-muted-foreground block mb-1.5">
                                    End Time
                                  </Label>
                                  <Input
                                    id={`${dayKey}-end`}
                                    type="time"
                                    value={dayAvail.preferredEnd || ''}
                                    onChange={(e) => setEditAvailability(prev => ({
                                      ...prev,
                                      [dayKey]: { ...prev[dayKey], preferredEnd: e.target.value || '' }
                                    }))}
                                    className="h-9 text-sm"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </RadioGroup>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>Save All Changes</>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
};

export default AvailabilityPanel;
