import { Button } from '../../../shared/components/ui/button';
import { Calendar, RefreshCw, Plus, Download } from 'lucide-react';

interface ScheduleHeaderProps {
  onRefreshData: (weekStart?: string) => void;
  currentWeek: Date;
  formatDateToString: (date: Date) => string;
  onCreateSchedule: (date: string) => void;
  onCreateWeeklySchedule?: () => void;
  isWeeklyScheduleMode?: boolean;
  onBackToSchedule?: () => void;
  isReadOnly?: boolean;
  onExport?: () => void;
}

export function ScheduleHeader({
  onRefreshData,
  currentWeek,
  formatDateToString,
  onCreateSchedule,
  onCreateWeeklySchedule,
  isWeeklyScheduleMode = false,
  onBackToSchedule,
  isReadOnly = false,
  onExport
}: ScheduleHeaderProps) {
  return (
    <div className={`bg-gradient-to-br ${isWeeklyScheduleMode ? 'from-red-50 via-red-50 to-red-100' : 'from-slate-50 via-blue-50 to-indigo-50'} rounded-2xl p-4 sm:p-8 border border-slate-200 shadow-sm`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className={`p-2 sm:p-3 ${isWeeklyScheduleMode ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'} rounded-xl shadow-lg`}>
            <Calendar className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              {isWeeklyScheduleMode ? 'Create Weekly Schedule' : 'Schedule Management'}
            </h1>
            <p className="text-slate-600 mt-1 text-sm sm:text-lg">
              {isWeeklyScheduleMode ? 'Assign shifts for the week' : 'View and manage shifts for your team'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          {isWeeklyScheduleMode && onBackToSchedule && (
            <Button
              onClick={onBackToSchedule}
              variant="outline"
              className="bg-white hover:bg-gray-50 px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium text-sm sm:text-base"
            >
              Back to Schedule
            </Button>
          )}
          {onExport && !isWeeklyScheduleMode && !isReadOnly && (
            <Button
              onClick={onExport}
              variant="outline"
              className="bg-white hover:bg-gray-50 px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium text-sm sm:text-base"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Export Excel
            </Button>
          )}
          {!isReadOnly && (

            <Button
              onClick={onCreateWeeklySchedule || (() => onCreateSchedule(formatDateToString(currentWeek)))}
              className={`${isWeeklyScheduleMode ? 'bg-gradient-to-r from-red-600 to-red-600 hover:from-red-700 hover:to-red-700' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'} text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium text-sm sm:text-base`}
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="hidden sm:inline">{onCreateWeeklySchedule ? 'Create Weekly Schedule' : 'Create Schedule'}</span>
              <span className="sm:hidden">Create</span>
            </Button>
          )}
          <Button
            onClick={() => {
              const weekStart = formatDateToString(currentWeek);
              onRefreshData(weekStart);
            }}
            variant="outline"
            className="bg-white hover:bg-gray-50 px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium text-sm sm:text-base"
          >
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}
