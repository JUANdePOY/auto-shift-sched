import React from 'react';
import { Card, CardContent } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/components/ui/tabs';
import {
  Brain,
  ArrowRight,
  X
} from 'lucide-react';
import type { AISuggestion, Employee } from '../../shared/types';
import { SuggestionCard } from './SuggestionCard';
import { QuickAssignSection } from './QuickAssignSection';
import { SuggestionStats } from './SuggestionStats';
import { useAISuggestions } from '../hooks/useAISuggestions';
import { formatTo12Hour } from '../../../utils/timeUtils';

interface AISuggestionsPanelProps {
  suggestions?: AISuggestion[];
  employees: Employee[];
  onApplySuggestion?: (suggestion: AISuggestion) => void;
  // Panel mode props
  isOpen?: boolean;
  onClose?: () => void;
  shiftId?: string;
  shiftTitle?: string;
  shiftTime?: string;
  shiftEndTime?: string;
  shiftDate?: string;
  department?: string;
  requiredStations?: string[];
  availableEmployees?: Employee[];
  mode?: 'full' | 'panel';
  employeeCurrentHours?: Record<string, number>; // Current scheduled hours for the week by employee ID
  assignedEmployeeIds?: string[]; // Employee IDs already assigned on this date
  finalSchedule?: any[]; // Final schedule data for last week calculations
}

export function AISuggestionsPanel({
  suggestions = [],
  employees,
  onApplySuggestion,
  // Panel mode props
  onClose,
  shiftId,
  shiftTitle,
  shiftTime,
  shiftEndTime,
  shiftDate,
  department,
  requiredStations = [],
  availableEmployees = [],
  mode = 'full',
  employeeCurrentHours = {},
  assignedEmployeeIds = [],
  finalSchedule = []
}: AISuggestionsPanelProps) {
  const {
    shiftSuggestions,
    appliedSuggestions,
    handleApplySuggestion,
    handleQuickAssign,
    getEmployeeName
  } = useAISuggestions({
    shiftId,
    availableEmployees,
    requiredStations,
    shiftDate,
    shiftTime,
    shiftEndTime,
    employeeCurrentHours,
    finalSchedule,
    assignedEmployeeIds
  });

  const handleApply = (suggestion: AISuggestion) => {
    handleApplySuggestion(suggestion);
    if (onApplySuggestion) {
      onApplySuggestion(suggestion);
    }
  };

  const handleQuickAssignWrapper = (employeeId: string) => {
    const employee = availableEmployees.find(emp => emp.id === employeeId);
    if (employee && shiftId && onApplySuggestion) {
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
      onApplySuggestion(quickSuggestion);
    }
    handleQuickAssign(employeeId);
  };

  // Panel mode - compact view
  if (mode === 'panel') {
    return (
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
              <Brain className="w-5 h-5 text-blue-600" />
              Smart Assistant
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-medium">{shiftTitle}</span> • {requiredStations.map(s => s.replace(/\b\w/g, l => l.toUpperCase())).join(', ')} • {shiftTime ? formatTo12Hour(shiftTime) : ''} - {shiftEndTime ? formatTo12Hour(shiftEndTime) : ''}
            </p>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Quick Assign Section */}
          <QuickAssignSection
            availableEmployees={availableEmployees}
            requiredStations={requiredStations}
            department={department || ''}
            shiftTime={shiftTime}
            shiftEndTime={shiftEndTime}
            employeeCurrentHours={employeeCurrentHours}
            onQuickAssign={handleQuickAssignWrapper}
            assignedEmployeeIds={assignedEmployeeIds}
          />

          {/* AI Suggestions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-600" />
              <h4 className="font-semibold text-base">Smart Recommendations</h4>
            </div>
            {shiftSuggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                employees={employees}
                isApplied={appliedSuggestions.has(suggestion.id)}
                onApply={() => handleApply(suggestion)}
                getEmployeeName={getEmployeeName}
                employeeCurrentHours={employeeCurrentHours}
              />
            ))}
          </div>

          {shiftSuggestions.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center">
                <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-muted-foreground">No Suggestions Available</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Use Quick Assign above to manually select an employee.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  
}
