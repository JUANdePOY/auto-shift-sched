import { useState, useMemo, useEffect } from 'react';
import type { AISuggestion, Employee } from '../../shared/types';
import { getEmployeeSuggestions, getTopUnassignedSuggestions } from '../../schedule/services/scheduleService';
import {
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

  // Fetch suggestions from backend when shiftId and shiftDate are available
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!shiftId || !shiftDate) {
        setShiftSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const suggestions = await getEmployeeSuggestions(shiftId, shiftDate);
        // Convert backend response to AISuggestion format
        const formattedSuggestions: AISuggestion[] = suggestions.map((suggestion, index) => ({
          id: `backend-suggestion-${shiftId}-${index}`,
          type: 'assignment',
          title: `AI Recommendation: ${suggestion.employee.name}`,
          description: `${suggestion.employee.name} is recommended based on skill matching, availability, and workload balance.`,
          confidence: Math.min(95, Math.round(suggestion.score * 0.95)), // Convert score to confidence percentage
          impact: {
            efficiency: Math.round(suggestion.score * 0.3),
            satisfaction: Math.round(suggestion.score * 0.25),
            coverage: Math.round(suggestion.score * 0.35)
          },
          action: {
            type: 'assign',
            shiftId: shiftId,
            employeeId: suggestion.employee.id,
            employeeName: suggestion.employee.name
          },
          reasons: suggestion.reasons // Add reasons to the suggestion object
        }));
        setShiftSuggestions(formattedSuggestions);
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
