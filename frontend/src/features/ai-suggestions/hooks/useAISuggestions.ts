import { useState, useMemo } from 'react';
import type { AISuggestion, Employee } from '../../shared/types';
import {
  generateShiftSuggestions,
  getAvailableEmployeesForShift
} from '../utils/suggestionUtils';

interface UseAISuggestionsProps {
  shiftId?: string;
  availableEmployees?: Employee[];
  requiredStations?: string[];
  shiftDate?: string;
  shiftTime?: string;
  shiftEndTime?: string;
  employeeCurrentHours?: Record<string, number>;
}

export function useAISuggestions({
  shiftId,
  availableEmployees = [],
  requiredStations = [],
  shiftDate,
  shiftTime,
  shiftEndTime,
  employeeCurrentHours = {}
}: UseAISuggestionsProps) {
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  // Memoize available employees for the shift
  const availableForShift = useMemo(() => {
    return getAvailableEmployeesForShift(
      availableEmployees,
      shiftDate,
      shiftTime,
      shiftEndTime
    );
  }, [availableEmployees, shiftDate, shiftTime, shiftEndTime]);

  // Memoize generated suggestions
  const shiftSuggestions = useMemo(() => {
    if (!shiftId || !availableForShift.length) {
      return [];
    }

    return generateShiftSuggestions(
      shiftId,
      availableForShift,
      requiredStations,
      shiftDate,
      shiftTime,
      shiftEndTime,
      employeeCurrentHours
    );
  }, [
    shiftId,
    availableForShift,
    requiredStations,
    shiftDate,
    shiftTime,
    shiftEndTime,
    employeeCurrentHours
  ]);

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
          impact: {
            efficiency: 20,
            satisfaction: 15,
            coverage: 25
          },
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
