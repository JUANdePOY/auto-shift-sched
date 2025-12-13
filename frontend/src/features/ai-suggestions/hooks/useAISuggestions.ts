import { useState, useMemo, useEffect } from 'react';
import type { AISuggestion, Employee } from '../../shared/types';
import { getAvailableEmployeesForShift } from '../utils/suggestionUtils';
import { getEmployeeSuggestions } from '../../schedule/services/scheduleService';

interface UseAISuggestionsProps {
  shiftId?: string;
  availableEmployees?: Employee[];
  requiredStations?: string[];
  shiftDate?: string;
  shiftTime?: string;
  shiftEndTime?: string;
  employeeCurrentHours?: Record<string, number>;
  finalSchedule?: any[];
  assignedEmployeeIds?: string[];
}

export function useAISuggestions({
  shiftId,
  availableEmployees = [],
  requiredStations = [],
  shiftDate,
  shiftTime,
  shiftEndTime,
  employeeCurrentHours = {},
  finalSchedule = [],
  assignedEmployeeIds = []
}: UseAISuggestionsProps) {
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());
  const [shiftSuggestions, setShiftSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Memoize available employees for the shift
  const availableForShift = useMemo(() => {
    return getAvailableEmployeesForShift(
      availableEmployees,
      shiftDate,
      shiftTime,
      shiftEndTime
    );
  }, [availableEmployees, shiftDate, shiftTime, shiftEndTime]);

  // Generate suggestions using backend API when shiftId and shiftDate are available
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!shiftId || !shiftDate) {
        setShiftSuggestions([]);
        return;
      }
      setIsLoading(true);
      try {
        // Use backend API to get employee suggestions
        const backendSuggestions = await getEmployeeSuggestions(shiftId, shiftDate);

        // Convert backend response to AISuggestion format
        const suggestions: AISuggestion[] = backendSuggestions.map((suggestion, index) => ({
          id: `backend-suggestion-${shiftId}-${index}`,
          type: 'assignment',
          title: index === 0 ? `Best Match: ${suggestion.employee.name}` : `Alternative: ${suggestion.employee.name}`,
          description: `${suggestion.employee.name} - ${suggestion.reasons.join(', ')}`,
          confidence: suggestion.score,
          reasons: suggestion.reasons,
          action: {
            type: 'assign',
            shiftId: shiftId,
            employeeId: suggestion.employee.id.toString()
          }
        }));

        setShiftSuggestions(suggestions);
      } catch (error) {
        console.error('Failed to fetch AI suggestions:', error);
        setShiftSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [shiftId, shiftDate]);

  const handleApplySuggestion = (suggestion: AISuggestion) => {
    setAppliedSuggestions(prev => new Set([...prev, suggestion.id]));
  };

  const handleQuickAssign = (employeeId: string) => {
    if (shiftId) {
      const employee = availableEmployees.find(emp => emp.id === employeeId);
      if (employee) {
        const quickSuggestion: AISuggestion = {
          id: `quick-assign-${shiftId}-${employeeId}`,
          type: 'assignment',
          title: `Quick Assign: ${employee.name}`,
          description: `Direct assignment of ${employee.name} to this shift.`,
          confidence: 90,
          action: {
            type: 'assign',
            shiftId: shiftId,
            employeeId: employeeId
          }
        };
        handleApplySuggestion(quickSuggestion);
      }
    }
  };

  const getEmployeeName = (employeeId: string) => {
    return availableEmployees.find(emp => emp.id === employeeId)?.name || 'Unknown Employee';
  };

  return {
    shiftSuggestions,
    appliedSuggestions,
    availableForShift,
    handleApplySuggestion,
    handleQuickAssign,
    getEmployeeName
  };
}
