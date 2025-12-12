import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { Button } from '../../../shared/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../shared/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/components/ui/select';
import { Label } from '../../../shared/components/ui/label';
import { Skeleton } from '../../../shared/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Users,
  Clock,
  X,
  Calendar,
  Filter,
  Search,
} from 'lucide-react';
import { Input } from '../../../shared/components/ui/input';
import { getFinalSchedule } from '../../services/scheduleService';

interface FinalScheduleAssignment {
  shift_id: number;
  employee_id: number;
  shift_title: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  employee_name: string;
  required_stations: string[];
}

interface FinalScheduleViewProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  isReadOnly?: boolean;
}

// Utility function to convert 24-hour time to 12-hour format
const formatTo12Hour = (time: string | null): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

const FinalScheduleView: React.FC<FinalScheduleViewProps> = ({
  isOpen,
  onClose,
  date,
  isReadOnly = false,
}) => {
  const [assignments, setAssignments] = useState<FinalScheduleAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Helper function to determine shift type based on start time
  const getShiftType = (time: string | null | undefined): 'opener' | 'mid' | 'closer' | 'graveyard' => {
    if (!time) return 'graveyard'; // Default for null/undefined times
    const hour = parseInt(time.split(':')[0], 10);
    if (hour >= 6 && hour < 12) return 'opener';
    if (hour >= 12 && hour < 18) return 'mid';
    if (hour >= 18 && hour < 24) return 'closer';
    return 'graveyard'; // 00:00 to 05:59
  };

  // Fetch final schedule data when component opens or date changes
  useEffect(() => {
    const fetchFinalSchedule = async () => {
      if (!isOpen || !date) return;

      setLoading(true);
      try {
        const data = await getFinalSchedule(date);
        setAssignments(data);
      } catch (error) {
        console.error('Failed to fetch final schedule:', error);
        toast.error('Failed to load final schedule data');
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFinalSchedule();
  }, [isOpen, date]);

  if (!isOpen) return null;

  // Filter assignments by type and search
  const filteredAssignments = assignments
    .filter(assignment => {
      const matchesType = typeFilter === 'all' || getShiftType(assignment.startTime) === typeFilter;
      const matchesSearch = searchTerm === '' ||
        assignment.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.shift_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.required_stations.some(station => 
          station.toLowerCase().includes(searchTerm.toLowerCase())
        );
      return matchesType && matchesSearch;
    })
    .sort((a, b) => {
      // Handle null startTime values
      if (!a.startTime && !b.startTime) return 0;
      if (!a.startTime) return 1;
      if (!b.startTime) return -1;
      return a.startTime.localeCompare(b.startTime);
    });

  const totalAssignments = assignments.length;
  const filteredCount = filteredAssignments.length;

  return (
    <div
      className="fixed inset-0 bg-background z-50 flex h-full text-sm font-sans text-foreground"
      role="dialog"
      aria-modal="true"
      aria-labelledby="final-schedule-view-title"
    >
      {/* Main Content Area */}
      <div className="w-full flex flex-col bg-background p-4 md:p-8 overflow-y-auto relative transition-all duration-300 shadow-lg">
        <header className="flex items-center justify-between mb-4 md:mb-8 border-b border-muted pb-4">
          <h2
            id="final-schedule-view-title"
            className="text-xl md:text-3xl font-semibold flex items-center gap-2 md:gap-3 text-blue-700"
          >
            <Calendar className="w-5 h-5 md:w-7 md:h-7" aria-hidden="true" />
            <span className="hidden sm:inline">Final Schedule - </span>
            <time dateTime={date} className="font-mono text-sm md:text-lg text-muted-foreground">
              {new Date(date).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </h2>
          <button
            onClick={onClose}
            aria-label="Close final schedule view"
            className="text-muted-foreground hover:text-foreground transition rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </header>

        <div className="space-y-4 md:space-y-6 flex-1 overflow-y-auto">
          {/* Filter and Stats Section */}
          <section className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-muted/30 rounded-lg border gap-4">
            <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto">
              {/* Type Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="type-filter" className="text-sm font-medium">
                  Filter by Type:
                </Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger id="type-filter" className="w-32">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="opener">Opener</SelectItem>
                    <SelectItem value="mid">Mid</SelectItem>
                    <SelectItem value="closer">Closer</SelectItem>
                    <SelectItem value="graveyard">Graveyard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border shadow-sm">
                <Users className="w-4 h-4 text-blue-600" aria-hidden="true" />
                <span className="text-sm font-medium">
                  {filteredCount} of {totalAssignments} shifts
                </span>
              </div>
            </div>

            {/* Search Bar - Right Side */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search employees, shifts, stations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </section>

          {/* Schedule Display */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-[150px]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAssignments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Final Schedule Found</h3>
                <p className="text-muted-foreground">
                  {typeFilter === 'all'
                    ? 'No final schedule has been saved for this date.'
                    : `No ${typeFilter} shifts found for this date.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block border rounded-lg overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-muted/50">
                      <TableHead className="font-semibold text-foreground">Employee</TableHead>
                      <TableHead className="font-semibold text-foreground">Required Stations</TableHead>
                      <TableHead className="font-semibold text-foreground">Time</TableHead>
                      <TableHead className="font-semibold text-foreground">Type</TableHead>
                      <TableHead className="font-semibold text-foreground">Shift Title</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssignments.map((assignment, index) => {
                      const shiftType = getShiftType(assignment.startTime);
                      const isEvenRow = index % 2 === 0;
                      return (
                        <TableRow
                          key={`${assignment.shift_id}-${assignment.employee_id}`}
                          className={`
                            ${isEvenRow ? 'bg-background' : 'bg-muted/20'}
                            hover:bg-muted/30 transition-colors duration-150
                          `}
                        >
                          <TableCell className="py-4">
                            <div>
                              <p className="font-medium">{assignment.employee_name}</p>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-wrap gap-1">
                              {assignment.required_stations && assignment.required_stations.length > 0 ? (
                                assignment.required_stations.map((station, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {station.replace(/\b\w/g, l => l.toUpperCase())}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-muted-foreground text-sm">None specified</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium flex items-center gap-2 py-4">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-mono">
                              {isReadOnly 
                                ? `${formatTo12Hour(assignment.startTime)} - ${formatTo12Hour(assignment.endTime)}`
                                : `${assignment.startTime} - ${assignment.endTime}`
                              }
                            </span>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge variant="outline" className="capitalize">
                              {shiftType}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge variant="outline" className="font-medium">
                              {assignment.shift_title}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {filteredAssignments.map((assignment) => {
                  const shiftType = getShiftType(assignment.startTime);
                  return (
                    <Card key={`${assignment.shift_id}-${assignment.employee_id}`} className="shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{assignment.employee_name}</CardTitle>
                          <Badge variant="outline" className="capitalize">
                            {shiftType}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span className="font-mono">
                            {isReadOnly 
                              ? `${formatTo12Hour(assignment.startTime)} - ${formatTo12Hour(assignment.endTime)}`
                              : `${assignment.startTime} - ${assignment.endTime}`
                            }
                          </span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Shift Title</p>
                          <p className="font-medium">{assignment.shift_title}</p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Required Stations</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {assignment.required_stations && assignment.required_stations.length > 0 ? (
                              assignment.required_stations.map((station, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {station.replace(/\b\w/g, l => l.toUpperCase())}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm">None specified</span>
                            )}
                          </div>
                        </div>

                        {!isReadOnly && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground">
                              Employee ID: {assignment.employee_id} | Shift ID: {assignment.shift_id}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinalScheduleView;
