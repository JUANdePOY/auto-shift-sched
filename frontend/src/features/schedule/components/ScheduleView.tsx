import { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../shared/components/ui/dialog';
import type { Shift, Employee, ScheduleConflict, WeeklySchedule } from '../../shared/types';
import { WeeklyCardView } from './views/WeeklyCardView';
import { TemporaryWeeklyScheduleView } from './views/TemporaryWeeklyScheduleView';
import { ShiftDetail } from './ShiftDetail';
import { ScheduleHeader } from './header/ScheduleHeader';
import { WeeklyScheduleSummary } from './WeeklyScheduleSummary';
import ShiftAssignmentPanel from './ShiftAssignmentPanel';
import ErrorBoundary from '../../shared/components/ErrorBoundary';
import { exportScheduleToExcel } from '../utils/exportUtils';
import {
  getStartOfWeek,
  getWeekDates
} from './utils/scheduleUtils';

// Utility function to convert 24-hour time to 12-hour format
const formatTo12Hour = (time: string): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

interface FinalScheduleAssignment {
  shift_id: number;
  employee_id: number;
  shift_title: string;
  date: string;
  startTime: string;
  endTime: string;
  employee_name: string;
  department?: string;
  required_stations: string[];
}

interface GroupedShift extends Shift {
  assignedEmployeeNames: string[];
  assignedEmployeeStations: string[][];
}

interface ScheduleViewProps {
  employees: Employee[];
  conflicts: ScheduleConflict[];
  finalSchedule?: FinalScheduleAssignment[] | null;
  schedule?: WeeklySchedule | null;
  onRefreshData: (weekStart?: string) => void;
  onSaveFinalSchedule?: (date: string, assignments: Array<{ shiftId: string; employeeId: string }>, notes?: string) => Promise<void>;
  isCreateMode?: boolean;
  onBackToSchedule?: () => void;
  isReadOnly?: boolean;
}

export function ScheduleView({
  employees,
  conflicts,
  finalSchedule,
  schedule,
  onRefreshData,
  isCreateMode = false,
  onBackToSchedule,
  isReadOnly = false
}: ScheduleViewProps) {
  const [currentWeek, setCurrentWeek] = useState(getStartOfWeek(new Date()));
  const lastCalledWeekRef = useRef<string | null>(null);

  // Keyboard navigation for week
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        const newWeek = new Date(currentWeek);
        newWeek.setDate(newWeek.getDate() - 7);
        setCurrentWeek(newWeek);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        const newWeek = new Date(currentWeek);
        newWeek.setDate(newWeek.getDate() + 7);
        setCurrentWeek(newWeek);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentWeek]);

  // Fetch schedule when week changes
  useEffect(() => {
    const weekStart = currentWeek.getFullYear() + '-' +
      String(currentWeek.getMonth() + 1).padStart(2, '0') + '-' +
      String(currentWeek.getDate()).padStart(2, '0');
    if (lastCalledWeekRef.current === weekStart) return;
    lastCalledWeekRef.current = weekStart;
    onRefreshData(weekStart);
  }, [currentWeek]);

  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isAssignmentPanelOpen, setIsAssignmentPanelOpen] = useState(false);
  const [selectedDateForAssignment, setSelectedDateForAssignment] = useState<string>('');
  const [isWeeklyScheduleMode, setIsWeeklyScheduleMode] = useState(isCreateMode);

  const getShiftConflicts = (shiftId: string) => {
    return conflicts.filter(conflict => conflict.shiftId === shiftId);
  };

  // Display data from final_schedule table only
  const shiftsToDisplay: Shift[] = useMemo(() => {
    if (finalSchedule && finalSchedule.length > 0) {
      const groupedByShift: Record<string, GroupedShift> = {};

      finalSchedule.forEach(assignment => {
        const shiftKey = `${assignment.shift_id}-${assignment.date}`;
        if (!groupedByShift[shiftKey]) {
          groupedByShift[shiftKey] = {
            id: assignment.shift_id.toString(),
            title: assignment.shift_title,
            date: assignment.date,
            startTime: isReadOnly ? formatTo12Hour(assignment.startTime) : assignment.startTime,
            endTime: isReadOnly ? formatTo12Hour(assignment.endTime) : assignment.endTime,
            assignedEmployees: [],
            assignedEmployeeNames: [],
            assignedEmployeeStations: [],
            requiredEmployees: 1,
            priority: 'medium' as const,
            department: assignment.department || '',
            requiredStation: Array.isArray(assignment.required_stations) ? assignment.required_stations : [],
            isCompleted: false,
          };
        }
        groupedByShift[shiftKey].assignedEmployees.push(assignment.employee_id.toString());
        groupedByShift[shiftKey].assignedEmployeeNames.push(assignment.employee_name);
        groupedByShift[shiftKey].assignedEmployeeStations.push(Array.isArray(assignment.required_stations) ? assignment.required_stations : []);
      });

      return Object.values(groupedByShift);
    }

    return [];
  }, [finalSchedule, isReadOnly]);

  const weekDates = useMemo(() => getWeekDates(currentWeek), [currentWeek]);

  const formatDateToString = (date: Date) => {
    return date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');
  };

  const handleCreateSchedule = (date: string) => {
    setSelectedDateForAssignment(date);
    setIsAssignmentPanelOpen(true);
  };

  const handleCreateWeeklySchedule = () => {
    setIsWeeklyScheduleMode(true);
  };

  const handleDayClick = (date: string) => {
    setSelectedDateForAssignment(date);
    setIsAssignmentPanelOpen(true);
  };

  const handleSaveWeeklySchedule = async () => {
    try {
      console.log('Weekly schedule save initiated');
      setIsWeeklyScheduleMode(false);
      onRefreshData();
    } catch (error) {
      console.error('Failed to save weekly schedule:', error);
    }
  };

  const handleBackToSchedule = () => {
    if (onBackToSchedule) {
      onBackToSchedule();
    } else {
      setIsWeeklyScheduleMode(false);
    }
  };

  const handleSaveFinalSchedule = async (date: string, assignments: Array<{ shiftId: string; employeeId: string }>) => {
    console.log('Saving final schedule to temporary context:', date, assignments);
    onRefreshData();
  };

  const handleExport = () => {
    if (isReadOnly) return;
    exportScheduleToExcel(shiftsToDisplay, currentWeek);
  };

  return (
    <div className="space-y-3">
      <ScheduleHeader
        onRefreshData={onRefreshData}
        currentWeek={currentWeek}
        formatDateToString={formatDateToString}
        onCreateSchedule={handleCreateSchedule}
        onCreateWeeklySchedule={handleCreateWeeklySchedule}
        isWeeklyScheduleMode={isWeeklyScheduleMode}
        onBackToSchedule={handleBackToSchedule}
        isReadOnly={isReadOnly}
        onExport={handleExport}
      />

      <div className="flex justify-center items-center min-h-[400px]">
        {isWeeklyScheduleMode ? (
          <div className="space-y-6">
            <TemporaryWeeklyScheduleView
              weekDates={weekDates}
              navigateWeek={(direction: 'prev' | 'next') => {
                const newWeek = new Date(currentWeek);
                newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
                setCurrentWeek(newWeek);
              }}
              onDayClick={handleDayClick}
              onSaveWeeklySchedule={handleSaveWeeklySchedule}
            />
          </div>
        ) : (
          <WeeklyCardView
            weekDates={weekDates}
            shifts={shiftsToDisplay}
            onShiftClick={setSelectedShift}
            getShiftConflicts={getShiftConflicts}
            navigateWeek={(direction: 'prev' | 'next') => {
              const newWeek = new Date(currentWeek);
              newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
              setCurrentWeek(newWeek);
            }}
            finalSchedule={finalSchedule}
            isReadOnly={isReadOnly}
          />
        )}
      </div>

      {/* Shift Detail Dialog */}
      {selectedShift && (
        <Dialog open={!!selectedShift} onOpenChange={() => setSelectedShift(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Shift Details</DialogTitle>
              <DialogDescription>
                View and manage shift information
              </DialogDescription>
            </DialogHeader>
<ShiftDetail
               shift={selectedShift}
               employees={employees}
               conflicts={conflicts}
               onClose={() => setSelectedShift(null)}
             />
          </DialogContent>
        </Dialog>
      )}

      {/* Assignment Panel */}
      {isAssignmentPanelOpen && (
        <ShiftAssignmentPanel
          isOpen={isAssignmentPanelOpen}
          onClose={() => setIsAssignmentPanelOpen(false)}
          date={selectedDateForAssignment}
          employees={employees}
          onSaveFinalSchedule={handleSaveFinalSchedule}
        />
      )}
    </div>
  );
}