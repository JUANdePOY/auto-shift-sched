import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Badge } from '../../shared/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../shared/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/components/ui/tabs';
import { 
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Zap,
  RefreshCw
} from 'lucide-react';
import type { Shift, Employee, ScheduleConflict } from '../../shared/types';
import { generateAutomatedSchedule, assignEmployeeToShift } from '../services/scheduleService';

interface ScheduleViewProps {
  shifts: Shift[];
  employees: Employee[];
  conflicts: ScheduleConflict[];
  onEditShift: (shift: Shift) => void;
  onCreateShift: () => void;
  onAssignEmployee: (shiftId: string, employeeId: string) => void;
  onUnassignEmployee: (shiftId: string, employeeId: string) => void;
  onRefreshData: () => void;
}

export function ScheduleView({
  shifts,
  employees,
  conflicts,
  onEditShift,
  onCreateShift,
  onAssignEmployee,
  onUnassignEmployee,
  onRefreshData
}: ScheduleViewProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date('2025-01-20'));
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);

  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
  ];

  const getWeekDates = (startDate: Date) => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const getShiftsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return shifts.filter(shift => shift.date === dateString);
  };

  const getShiftConflicts = (shiftId: string) => {
    return conflicts.filter(conflict => conflict.shiftId === shiftId);
  };

  const getEmployeeName = (employeeId: string) => {
    return employees.find(emp => emp.id === employeeId)?.name || 'Unknown';
  };

  const departments = [...new Set(shifts.map(shift => shift.department))];

  const filteredShifts = selectedDepartment === 'all' 
    ? shifts 
    : shifts.filter(shift => shift.department === selectedDepartment);

  const weekDates = getWeekDates(currentWeek);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Schedule View
          </h1>
          <p className="text-muted-foreground">
            Manage shifts and assignments
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>
                  {dept.charAt(0).toUpperCase() + dept.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={onCreateShift}>
            <Plus className="w-4 h-4 mr-2" />
            Create Shift
          </Button>
          <Button onClick={onRefreshData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
          <Button 
            onClick={async () => {
              setIsGeneratingSchedule(true);
              try {
                const startDate = weekDates[0].toISOString().split('T')[0];
                const endDate = weekDates[6].toISOString().split('T')[0];
                const schedule = await generateAutomatedSchedule(startDate, endDate);
                
                // Assign employees to shifts based on the generated schedule
                for (const assignment of schedule.assignments) {
                  await assignEmployeeToShift(assignment.shiftId, assignment.employeeId);
                }
                
                // Show detailed results
                const message = `Schedule generated successfully!\n\n` +
                  `- Total shifts: ${schedule.totalShifts}\n` +
                  `- Assigned shifts: ${schedule.assignedShifts}\n` +
                  `- Coverage rate: ${schedule.coverageRate}%\n` +
                  `- Conflicts: ${schedule.conflicts.length}`;
                
                alert(message);
                
                // Refresh data to show updated assignments
                onRefreshData();
              } catch (error) {
                console.error('Error generating schedule:', error);
                alert('Failed to generate schedule. Please try again.');
              } finally {
                setIsGeneratingSchedule(false);
              }
            }} 
            variant="secondary"
            disabled={isGeneratingSchedule}
          >
            {isGeneratingSchedule ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate Schedule
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
        <Button 
          variant="ghost" 
          onClick={() => {
            const newWeek = new Date(currentWeek);
            newWeek.setDate(newWeek.getDate() - 7);
            setCurrentWeek(newWeek);
          }}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous Week
        </Button>
        
        <div className="text-center">
          <h3>Week of {currentWeek.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h3>
          <p className="text-sm text-muted-foreground">
            {weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}
          </p>
        </div>
        
        <Button 
          variant="ghost" 
          onClick={() => {
            const newWeek = new Date(currentWeek);
            newWeek.setDate(newWeek.getDate() + 7);
            setCurrentWeek(newWeek);
          }}
        >
          Next Week
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* View Mode Toggle */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'week' | 'day')}>
        <TabsList>
          <TabsTrigger value="week">Week View</TabsTrigger>
          <TabsTrigger value="day">Day View</TabsTrigger>
        </TabsList>

        <TabsContent value="week" className="space-y-4">
          <WeekView 
            weekDates={weekDates}
            shifts={filteredShifts}
            employees={employees}
            conflicts={conflicts}
            onShiftClick={setSelectedShift}
            getShiftsForDate={getShiftsForDate}
            getShiftConflicts={getShiftConflicts}
            getEmployeeName={getEmployeeName}
          />
        </TabsContent>

        <TabsContent value="day" className="space-y-4">
          <DayView 
            date={weekDates[0]}
            shifts={getShiftsForDate(weekDates[0]).filter(shift => 
              selectedDepartment === 'all' || shift.department === selectedDepartment
            )}
            employees={employees}
            conflicts={conflicts}
            timeSlots={timeSlots}
            onShiftClick={setSelectedShift}
            getShiftConflicts={getShiftConflicts}
            getEmployeeName={getEmployeeName}
          />
        </TabsContent>
      </Tabs>

      {/* Shift Detail Dialog */}
      <Dialog open={!!selectedShift} onOpenChange={() => setSelectedShift(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedShift?.title}</DialogTitle>
            <DialogDescription>
              {selectedShift?.date} • {selectedShift?.startTime} - {selectedShift?.endTime}
            </DialogDescription>
          </DialogHeader>
          
          {selectedShift && (
            <ShiftDetail 
              shift={selectedShift}
              employees={employees}
              conflicts={getShiftConflicts(selectedShift.id)}
              onAssignEmployee={onAssignEmployee}
              onUnassignEmployee={onUnassignEmployee}
              onEditShift={() => {
                onEditShift(selectedShift);
                setSelectedShift(null);
              }}
              getEmployeeName={getEmployeeName}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface WeekViewProps {
  weekDates: Date[];
  shifts: Shift[];
  employees: Employee[];
  conflicts: ScheduleConflict[];
  onShiftClick: (shift: Shift) => void;
  getShiftsForDate: (date: Date) => Shift[];
  getShiftConflicts: (shiftId: string) => ScheduleConflict[];
  getEmployeeName: (employeeId: string) => string;
}

function WeekView({ 
  weekDates,  
  onShiftClick, 
  getShiftsForDate, 
  getShiftConflicts,
  getEmployeeName 
}: WeekViewProps) {
  return (
    <div className="grid grid-cols-7 gap-4">
      {weekDates.map((date, index) => {
        const dayShifts = getShiftsForDate(date);
        const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index];
        
        return (
          <Card key={date.toISOString()} className="min-h-96">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                {dayName}
              </CardTitle>
              <CardDescription className="text-xs">
                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {dayShifts.map((shift) => {
                const shiftConflicts = getShiftConflicts(shift.id);
                const hasConflicts = shiftConflicts.length > 0;
                
                return (
                  <div
                    key={shift.id}
                    className={`p-2 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                      hasConflicts ? 'border-red-200 bg-red-50' : 'border-border'
                    }`}
                    onClick={() => onShiftClick(shift)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs truncate">{shift.title}</p>
                      {hasConflicts && (
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <Clock className="w-3 h-3" />
                      {shift.startTime}-{shift.endTime}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant={shift.priority === 'high' ? 'destructive' : 
                                shift.priority === 'medium' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {shift.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {shift.assignedEmployees.length}/{shift.requiredEmployees}
                      </span>
                    </div>
                    
                    {shift.assignedEmployees.length > 0 && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {shift.assignedEmployees.slice(0, 2).map(empId => 
                          getEmployeeName(empId).split(' ')[0]
                        ).join(', ')}
                        {shift.assignedEmployees.length > 2 && ` +${shift.assignedEmployees.length - 2}`}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {dayShifts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No shifts</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

interface DayViewProps {
  date: Date;
  shifts: Shift[];
  employees: Employee[];
  conflicts: ScheduleConflict[];
  timeSlots: string[];
  onShiftClick: (shift: Shift) => void;
  getShiftConflicts: (shiftId: string) => ScheduleConflict[];
  getEmployeeName: (employeeId: string) => string;
}

function DayView({ 
  date, 
  shifts, 
  timeSlots, 
  onShiftClick, 
  getShiftConflicts,
}: DayViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {timeSlots.map((time) => {
            const timeShifts = shifts.filter(shift => 
              shift.startTime <= time && shift.endTime > time
            );
            
            return (
              <div key={time} className="flex items-center gap-4 py-2 border-b">
                <div className="w-16 text-sm text-muted-foreground">
                  {time}
                </div>
                <div className="flex-1 flex gap-2">
                  {timeShifts.map((shift) => {
                    const shiftConflicts = getShiftConflicts(shift.id);
                    const hasConflicts = shiftConflicts.length > 0;
                    
                    return (
                      <div
                        key={shift.id}
                        className={`p-2 rounded border cursor-pointer flex-1 ${
                          hasConflicts ? 'border-red-200 bg-red-50' : 'border-border bg-muted/30'
                        }`}
                        onClick={() => onShiftClick(shift)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{shift.title}</span>
                          {hasConflicts && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {shift.assignedEmployees.length}/{shift.requiredEmployees} assigned
                        </p>
                      </div>
                    );
                  })}
                  {timeShifts.length === 0 && (
                    <div className="flex-1 py-4"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface ShiftDetailProps {
  shift: Shift;
  employees: Employee[];
  conflicts: ScheduleConflict[];
  onAssignEmployee: (shiftId: string, employeeId: string) => void;
  onUnassignEmployee: (shiftId: string, employeeId: string) => void;
  onEditShift: () => void;
  getEmployeeName: (employeeId: string) => string;
}

function ShiftDetail({ 
  shift, 
  employees, 
  conflicts, 
  onAssignEmployee, 
  onUnassignEmployee,
  onEditShift,
}: ShiftDetailProps) {
  const availableEmployees = employees.filter(emp => 
    !shift.assignedEmployees.includes(emp.id) &&
    shift.requiredStation.some(station => emp.station?.includes(station))
  );

  return (
    <div className="space-y-6">
      {/* Shift Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Time</p>
          <p>{shift.startTime} - {shift.endTime}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Department</p>
          <p className="capitalize">{shift.department}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Priority</p>
          <Badge variant={shift.priority === 'high' ? 'destructive' : 
                         shift.priority === 'medium' ? 'default' : 'secondary'}>
            {shift.priority}
          </Badge>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Required Skills</p>
          <div className="flex gap-1 flex-wrap">
            {shift.requiredStation.map(station => (
              <Badge key={station} variant="outline" className="text-xs">
                {station.replace('_', ' ')}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div>
          <h4 className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Conflicts
          </h4>
          <div className="space-y-2">
            {conflicts.map((conflict, index) => (
              <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                {conflict.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assigned Employees */}
      <div>
        <h4 className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4" />
          Assigned Employees ({shift.assignedEmployees.length}/{shift.requiredEmployees})
        </h4>
        <div className="space-y-2">
          {shift.assignedEmployees.map(empId => {
            const employee = employees.find(emp => emp.id === empId);
            return (
              <div key={empId} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div>
                  <p className="text-sm">{employee?.name}</p>
                  <p className="text-xs text-muted-foreground">{employee?.role}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onUnassignEmployee(shift.id, empId)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Available Employees */}
      {availableEmployees.length > 0 && (
        <div>
          <h4>Available Employees</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {availableEmployees.slice(0, 5).map(employee => (
              <div key={employee.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <div>
                  <p className="text-sm">{employee.name}</p>
                  <p className="text-xs text-muted-foreground">{employee.department}</p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => onAssignEmployee(shift.id, employee.id)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Assign
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onEditShift}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Shift
        </Button>
      </div>
    </div>
  );
}