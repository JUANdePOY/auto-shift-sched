import { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../shared/components/ui/dialog';
import type { Shift, Employee, ScheduleConflict } from '../../shared/types';
import { WeeklyCardView } from './views/WeeklyCardView';
import { TemporaryWeeklyScheduleView } from './views/TemporaryWeeklyScheduleView';
import { ShiftDetail } from './ShiftDetail';
import { ScheduleHeader } from './header/ScheduleHeader';
import ShiftAssignmentPanel from './ShiftAssignmentPanel';
import {
  getStartOfWeek,
  getWeekDates
} from './utils/scheduleUtils';


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
  onRefreshData: (weekStart?: string) => void;
  onSaveFinalSchedule?: (date: string, assignments: Array<{ shiftId: string; employeeId: string }>, notes?: string) => Promise<void>;
  isCreateMode?: boolean;
  onBackToSchedule?: () => void;
}

export function ScheduleView({
  employees,
  conflicts,
  finalSchedule,
  onRefreshData,
  onSaveFinalSchedule,
  isCreateMode = false,
  onBackToSchedule
}: ScheduleViewProps) {
  const [currentWeek, setCurrentWeek] = useState(getStartOfWeek(new Date()));
  const lastCalledWeekRef = useRef<string | null>(null);

  // Fetch schedule when week changes
  useEffect(() => {
    const weekStart = currentWeek.getFullYear() + '-' +
      String(currentWeek.getMonth() + 1).padStart(2, '0') + '-' +
      String(currentWeek.getDate()).padStart(2, '0');
    if (lastCalledWeekRef.current === weekStart) return;
    lastCalledWeekRef.current = weekStart;
    onRefreshData(weekStart); // This will call fetchSchedule with the new week
  }, [currentWeek]);

  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isAssignmentPanelOpen, setIsAssignmentPanelOpen] = useState(false);
  const [selectedDateForAssignment, setSelectedDateForAssignment] = useState<string>('');
  const [isWeeklyScheduleMode, setIsWeeklyScheduleMode] = useState(isCreateMode);



  const getShiftConflicts = (shiftId: string) => {
    return conflicts.filter(conflict => conflict.shiftId === shiftId);
  };

  // Only display data from final_schedule table - no fallback to regular shifts
  const shiftsToDisplay: Shift[] = useMemo(() => {
    if (!finalSchedule || finalSchedule.length === 0) {
      return [];
    }

    const groupedByShift: Record<string, GroupedShift> = {};

    finalSchedule.forEach(assignment => {
      if (!groupedByShift[assignment.shift_id]) {
        groupedByShift[assignment.shift_id] = {
          id: assignment.shift_id.toString(),
          title: assignment.shift_title,
          date: assignment.date, // This is date_schedule from final_schedule table
          startTime: assignment.startTime,
          endTime: assignment.endTime,
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
      groupedByShift[assignment.shift_id].assignedEmployees.push(assignment.employee_id.toString());
      groupedByShift[assignment.shift_id].assignedEmployeeNames.push(assignment.employee_name);
      groupedByShift[assignment.shift_id].assignedEmployeeStations.push(Array.isArray(assignment.required_stations) ? assignment.required_stations : []);
    });

    return Object.values(groupedByShift);
  }, [finalSchedule]);

  const weekDates = useMemo(() => getWeekDates(currentWeek), [currentWeek]);

  // Helper function to format Date to 'YYYY-MM-DD'
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
      // The actual save logic is handled by the TemporaryWeeklyScheduleView component
      // which uses the TemporaryScheduleContext. Here we just need to close the mode
      // and refresh data after the save is complete.
      console.log('Weekly schedule save initiated');
      // The context handles the actual saving, so we just close the mode
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
    // Save to temporary schedule context instead of directly to database
    console.log('Saving final schedule to temporary context:', date, assignments);
    // The actual saving logic will be handled by the TemporaryScheduleContext
    onRefreshData(); // Refresh data after saving
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
      />

      <div className="flex justify-center items-center min-h-[400px]">
        {isWeeklyScheduleMode ? (
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
          />
        )}
      </div>

      {/* Shift Detail Dialog */}
      <Dialog open={!!selectedShift} onOpenChange={() => setSelectedShift(null)}>
        <DialogContent className="w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedShift?.title}</DialogTitle>
            <DialogDescription>
              {selectedShift?.date} • {selectedShift?.startTime} - {selectedShift?.endTime}
            </DialogDescription>
          </DialogHeader>

          {selectedShift && (
            <ShiftDetail
              shifts={[selectedShift]}
              employees={employees}
              conflicts={getShiftConflicts(selectedShift.id)}
              date={selectedShift.date}
            />
          )}
        </DialogContent>
      </Dialog>

      <ShiftAssignmentPanel
        isOpen={isAssignmentPanelOpen}
        onClose={() => setIsAssignmentPanelOpen(false)}
        date={selectedDateForAssignment}
        employees={employees}
        onSaveFinalSchedule={handleSaveFinalSchedule}
      />
    </div>
  );
}
