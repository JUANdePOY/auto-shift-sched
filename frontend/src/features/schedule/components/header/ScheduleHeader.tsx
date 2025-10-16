import { Button } from '../../../shared/components/ui/button';
import { Calendar, RefreshCw, Plus } from 'lucide-react';

interface ScheduleHeaderProps {
  onRefreshData: (weekStart?: string) => void;
  currentWeek: Date;
  formatDateToString: (date: Date) => string;
  onCreateSchedule: (date: string) => void;
  onCreateWeeklySchedule?: () => void;
  isWeeklyScheduleMode?: boolean;
  onBackToSchedule?: () => void;
}

export function ScheduleHeader({
  onRefreshData,
  currentWeek,
  formatDateToString,
  onCreateSchedule,
  onCreateWeeklySchedule,
  isWeeklyScheduleMode = false,
  onBackToSchedule
}: ScheduleHeaderProps) {
  return (
    <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 rounded-lg border ${isWeeklyScheduleMode ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-200' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'}`}>
      <div className="space-y-1">
        <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
          <div className={`p-2 rounded-lg ${isWeeklyScheduleMode ? 'bg-red-600' : 'bg-blue-600'}`}>
            <Calendar className="w-6 h-6 text-white" />
          </div>
          {isWeeklyScheduleMode ? 'Create Weekly Schedule' : 'Schedule View'}
        </h1>
        <p className="text-gray-600 text-sm">
          {isWeeklyScheduleMode ? 'Assign shifts for the week' : 'View shifts and assignments for your team'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {isWeeklyScheduleMode && onBackToSchedule && (
          <Button
            onClick={onBackToSchedule}
            variant="outline"
            className="h-10 px-4 bg-white border-gray-200 shadow-sm hover:bg-gray-50"
          >
            Back to Schedule
          </Button>
        )}
        <Button
          onClick={onCreateWeeklySchedule || (() => onCreateSchedule(formatDateToString(currentWeek)))}
          className={`h-10 px-4 text-white shadow-sm ${isWeeklyScheduleMode ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          <Plus className="w-4 h-4 mr-2" />
          {onCreateWeeklySchedule ? 'Create Weekly Schedule' : 'Create Schedule'}
        </Button>

        <Button
          onClick={() => {
            const weekStart = formatDateToString(currentWeek);
            onRefreshData(weekStart);
          }}
          variant="outline"
          className="h-10 px-4 bg-white border-gray-200 shadow-sm hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
    </div>
  );
}
