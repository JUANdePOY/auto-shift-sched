import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { Button } from '../../../shared/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../shared/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../shared/components/ui/table';
import { Calendar, ChevronLeft, ChevronRight, AlertTriangle, Clock, Check, X } from 'lucide-react';
import type { Shift, ScheduleConflict } from '../../../shared/types';

interface WeeklyCardViewProps {
  weekDates: Date[];
  shifts: (Shift & { assignedEmployeeNames?: string[]; assignedEmployeeStations?: string[][] })[];
  getShiftConflicts: (shiftId: string) => ScheduleConflict[];
  navigateWeek: (direction: 'prev' | 'next') => void;
  onShiftClick?: (shift: Shift) => void;
}

export function WeeklyCardView({
  weekDates,
  shifts,
  getShiftConflicts,
  navigateWeek,
  onShiftClick
}: WeeklyCardViewProps) {
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [stationFilter, setStationFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  return (
    <div className="flex justify-center items-center mt-10">
      <div className="space-y-10">
      {/* Top row: 4 cards */}
      <div className="grid grid-cols sm:grid-cols-4 gap-10 z-0">
        {weekDates.slice(0, 4).map((date) => {
          const dateString = date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0');
          const dayShifts = shifts.filter(shift => shift.date === dateString);
          const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][weekDates.indexOf(date)];

          return (
            <Card
              key={date.toISOString()}
              className={`w-65 h-80 cursor-pointer transition-all hover:shadow-lg hover:scale-100 relative ${hoveredDay === date ? 'z-[2]' : 'z-0'}`}
              onMouseEnter={() => setHoveredDay(date)}
              onMouseLeave={() => setHoveredDay(null)}
              onClick={() => {
                setSelectedDay(date);
                setIsModalOpen(true);
              }}
            >
                <CardHeader className="pb-1 h-12">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xs font-semibold">
                        {dayName}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </CardDescription>
                    </div>
                    {dayShifts.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {dayShifts.length}
                      </Badge>
                    )}
                </div>
              </CardHeader>
              <CardContent className="p-4 flex flex-col justify-center">
                {dayShifts.length > 0 ? (
                  <div className="space-y-2">
                    {/* Day Summary */}
                    <div className="grid grid-cols-3 gap-1 text-center">
                      <div>
                        <p className="text-sm font-bold text-blue-600">
                          {new Set(dayShifts.flatMap(shift => shift.assignedEmployees)).size}
                        </p>
                        <p className="text-xs text-muted-foreground">Employees</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-green-600">
                          {dayShifts.reduce((total, shift) => {
                            const start = new Date(`2000-01-01T${shift.startTime}`);
                            const end = new Date(`2000-01-01T${shift.endTime}`);
                            return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                          }, 0).toFixed(1)}h
                        </p>
                        <p className="text-xs text-muted-foreground">Hours</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-red-600">
                          {dayShifts.some(shift => getShiftConflicts(shift.id).length > 0) ? '!' : '✓'}
                        </p>
                        <p className="text-xs text-muted-foreground">Conflicts</p>
                      </div>
                    </div>

                    {/* Quick shift count */}
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        {dayShifts.length} shift{dayShifts.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Calendar className="w-6 h-6 mx-auto mb-1 opacity-30" />
                    <p className="text-xs">No shifts</p>
                  </div>
                )}
                </CardContent>

              {/* Hover expansion */}
              {hoveredDay === date && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border rounded-lg shadow-2xl z-[3] p-6 h-[350px] overflow-y-auto w-[300px] transition-all duration-7000 ease-in-out"
                     onMouseEnter={() => setHoveredDay(date)}
                     onMouseLeave={() => setHoveredDay(null)}>
                  <h4 className="font-bold text-4xl mb-20 text-center">
                    {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h4>

                  {/* Day Summary */}
                  {dayShifts.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-blue-600">
                          {new Set(dayShifts.flatMap(shift => shift.assignedEmployees)).size}
                        </p>
                        <p className="text-base text-muted-foreground">Employees</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-green-600">
                          {dayShifts.reduce((total, shift) => {
                            const start = new Date(`2000-01-01T${shift.startTime}`);
                            const end = new Date(`2000-01-01T${shift.endTime}`);
                            return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                          }, 0).toFixed(1)}h
                        </p>
                        <p className="text-base text-muted-foreground">Total Hours</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-red-600">
                          {dayShifts.some(shift => getShiftConflicts(shift.id).length > 0) ? '!' : '✓'}
                        </p>
                        <p className="text-base text-muted-foreground">Conflicts</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-lg">No shifts scheduled</p>
                    </div>
                  )}
                </div>
              )}
              </Card>
          );
        })}
      </div>

      {/* Bottom row: navigation + 3 cards + navigation */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateWeek('prev')}
          className="flex-shrink-0 px-2"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 flex-3">
          {weekDates.slice(4, 7).map((date) => {
            const dateString = date.getFullYear() + '-' +
              String(date.getMonth() + 1).padStart(2, '0') + '-' +
              String(date.getDate()).padStart(2, '0');
            const dayShifts = shifts.filter(shift => shift.date === dateString);
            const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][weekDates.indexOf(date)];

            return (
              <Card
                key={date.toISOString()}
              className={`h-50 cursor-pointer transition-all hover:shadow-lg hover:scale-150 relative ${hoveredDay === date ? 'z-[3]' : 'z-0'}`}
                onMouseEnter={() => setHoveredDay(date)}
                onMouseLeave={() => setHoveredDay(null)}
                onClick={() => {
                  setSelectedDay(date);
                  setIsModalOpen(true);
                }}
              >
                <CardHeader className="pb-1 h-12">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xs font-semibold">
                        {dayName}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </CardDescription>
                    </div>
                    {dayShifts.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {dayShifts.length}
                      </Badge>
                    )}
                </div>
              </CardHeader>
              <CardContent className="p-4 flex flex-col justify-center">
                {dayShifts.length > 0 ? (
                  <div className="space-y-2">
                    {/* Day Summary */}
                    <div className="grid grid-cols-3 gap-1 text-center">
                      <div>
                        <p className="text-sm font-bold text-blue-600">
                          {new Set(dayShifts.flatMap(shift => shift.assignedEmployees)).size}
                        </p>
                        <p className="text-xs text-muted-foreground">Employees</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-green-600">
                          {dayShifts.reduce((total, shift) => {
                            const start = new Date(`2000-01-01T${shift.startTime}`);
                            const end = new Date(`2000-01-01T${shift.endTime}`);
                            return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                          }, 0).toFixed(1)}h
                        </p>
                        <p className="text-xs text-muted-foreground">Hours</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-red-600">
                          {dayShifts.some(shift => getShiftConflicts(shift.id).length > 0) ? '!' : '✓'}
                        </p>
                        <p className="text-xs text-muted-foreground">Conflicts</p>
                      </div>
                    </div>

                    {/* Quick shift count */}
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        {dayShifts.length} shift{dayShifts.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Calendar className="w-6 h-6 mx-auto mb-1 opacity-30" />
                    <p className="text-xs">No shifts</p>
                  </div>
                )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateWeek('next')}
          className="flex-shrink-0 px-2"
        >
          <ChevronRight className="w-4` h-4" />
        </Button>
      </div>

      {/* Day Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-screen max-h-[90vh] overflow-y-auto" style={{ width: '50vw', maxWidth: 'none' }}>
          <DialogHeader>
            <DialogTitle>
              {selectedDay?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </DialogTitle>
            <DialogDescription>
              Detailed view of shifts for this day
            </DialogDescription>
          </DialogHeader>

          {selectedDay && (
            <div className="space-y-4">
              {(() => {
                const dateString = selectedDay.getFullYear() + '-' +
                  String(selectedDay.getMonth() + 1).padStart(2, '0') + '-' +
                  String(selectedDay.getDate()).padStart(2, '0');
                const dayShifts = shifts.filter(shift => shift.date === dateString);

                if (dayShifts.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>No shifts scheduled for this day</p>
                    </div>
                  );
                }

                // Get unique options for filters
                const departmentOptions = Array.from(new Set(dayShifts.map(shift => shift.department).filter(Boolean)));
                const stationOptions = Array.from(new Set(dayShifts.flatMap(shift => shift.requiredStation || [])));
                const typeOptions = Array.from(new Set(dayShifts.map(shift => shift.title).filter(Boolean)));

                const filteredShifts = dayShifts.filter(shift => {
                  const matchesDepartment = departmentFilter === 'all' || shift.department === departmentFilter;
                  const matchesStation = stationFilter === 'all' || shift.requiredStation?.includes(stationFilter);
                  const matchesType = typeFilter === 'all' || shift.title === typeFilter;
                  return matchesDepartment && matchesStation && matchesType;
                });

                return (
                  <>
                    {/* Day Summary */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {new Set(dayShifts.flatMap(shift => shift.assignedEmployees)).size}
                        </p>
                        <p className="text-sm text-muted-foreground">Employees</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {dayShifts.reduce((total, shift) => {
                            const start = new Date(`2000-01-01T${shift.startTime}`);
                            const end = new Date(`2000-01-01T${shift.endTime}`);
                            return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                          }, 0).toFixed(1)}h
                        </p>
                        <p className="text-sm text-muted-foreground">Total Hours</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">
                          {dayShifts.some(shift => getShiftConflicts(shift.id).length > 0) ? '!' : '✓'}
                        </p>
                        <p className="text-sm text-muted-foreground">Conflicts</p>
                      </div>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-4 mb-4">
                      <div className="flex-1 space-y-1">
                        <label className="text-sm font-medium">Department</label>
                        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="All departments" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All departments</SelectItem>
                            {departmentOptions.map((dept) => (
                              <SelectItem key={dept} value={dept}>
                                {dept}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-sm font-medium">Station</label>
                        <Select value={stationFilter} onValueChange={setStationFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="All stations" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All stations</SelectItem>
                            {stationOptions.map((station) => (
                              <SelectItem key={station} value={station}>
                                {station}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-sm font-medium">Type</label>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="All types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All types</SelectItem>
                            {typeOptions.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Shifts Table */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Station(s)</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Assigned Employee</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredShifts.map((shift) => {
                          const shiftConflicts = getShiftConflicts(shift.id);
                          const hasConflicts = shiftConflicts.length > 0;
                          const isAssigned = shift.assignedEmployees && shift.assignedEmployees.length > 0;

                          return (
                            <TableRow
                              key={shift.id}
                              className={`cursor-pointer ${hasConflicts ? 'border-red-200' : ''}`}
                              onClick={() => onShiftClick?.(shift)}
                            >
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {shift.requiredStation?.map((station: string, index: number) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {station}
                                    </Badge>
                                  )) || <span className="text-muted-foreground">N/A</span>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{shift.startTime} - {shift.endTime}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-xs">
                                  {shift.title || 'Regular'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {isAssigned ? (
                                  <div className="space-y-1">
                                    {shift.assignedEmployeeNames?.map((name, index) => (
                                      <div key={index} className="text-sm">
                                        {name}
                                        {shift.assignedEmployeeStations?.[index] && (
                                          <div className="text-xs text-muted-foreground">
                                            {shift.assignedEmployeeStations[index].join(', ')}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">Unassigned</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {hasConflicts ? (
                                    <Badge variant="destructive" className="text-xs">
                                      <AlertTriangle className="w-3 h-3 mr-1" />
                                      Conflict
                                    </Badge>
                                  ) : isAssigned ? (
                                    <Badge variant="default" className="text-xs">
                                      <Check className="w-3 h-3 mr-1" />
                                      Assigned
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs">
                                      <X className="w-3 h-3 mr-1" />
                                      Unassigned
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
      
    </div>
  );
}
