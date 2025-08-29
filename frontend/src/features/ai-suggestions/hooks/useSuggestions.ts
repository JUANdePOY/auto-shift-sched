import { toast } from 'sonner';
import type { AISuggestion, WeeklySchedule } from '../../shared/types';

export function useSuggestions() {
  const handleApplySuggestion = (
    suggestion: AISuggestion,
    schedule: WeeklySchedule | null,
    updateSchedule: (shiftId: string, employeeId: string, assign: boolean) => void,
    updateEmployeeHours: (employeeId: string, hoursChange: number) => void
  ) => {
    if (!schedule) return;

    // Apply the suggestion action
    if (suggestion.action.type === 'assign') {
      updateSchedule(suggestion.action.shiftId, suggestion.action.employeeId, true);
      updateEmployeeHours(suggestion.action.employeeId, 8);
    } else if (suggestion.action.type === 'unassign') {
      updateSchedule(suggestion.action.shiftId, suggestion.action.employeeId, false);
      updateEmployeeHours(suggestion.action.employeeId, -8);
    }

    toast.success(`Applied suggestion: ${suggestion.title}`, {
      description: `Schedule updated successfully. Efficiency improved by ${suggestion.impact.efficiency}%.`
    });
  };

  return {
    handleApplySuggestion
  };
}
