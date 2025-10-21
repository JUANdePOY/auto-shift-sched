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
  employeeCurrentHours = {}
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
    employeeCurrentHours
  });

  const handleApply = (suggestion: AISuggestion) => {
    handleApplySuggestion(suggestion);
    if (onApplySuggestion) {
      onApplySuggestion(suggestion);
    }
  };

  const handleQuickAssignWrapper = (employeeId: string) => {
    handleQuickAssign(employeeId);
    // You might want to trigger onApplySuggestion here as well if needed
  };

  // Panel mode - compact view
  if (mode === 'panel') {
    return (
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              AI Suggestions
            </h3>
            <p className="text-lg text-muted-foreground">
              {shiftTitle} - {requiredStations.map(s => s.replace(/\b\w/g, l => l.toUpperCase())).join(', ')} from {shiftTime} to {shiftEndTime}
            </p>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Quick Assign Section */}
          {department && (
            <QuickAssignSection
              availableEmployees={availableEmployees}
              requiredStations={requiredStations}
              department={department}
              shiftTime={shiftTime}
              shiftEndTime={shiftEndTime}
              employeeCurrentHours={employeeCurrentHours}
              onQuickAssign={handleQuickAssignWrapper}
            />
          )}

          {/* AI Suggestions */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Smart Recommendations</h4>
            {shiftSuggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                employees={employees}
                isApplied={appliedSuggestions.has(suggestion.id)}
                onApply={() => handleApply(suggestion)}
                getEmployeeName={getEmployeeName}
              />
            ))}
          </div>

          {shiftSuggestions.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium">No AI Suggestions</h3>
                <p className="text-sm text-muted-foreground">
                  No recommendations available for this shift.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Full mode - original implementation
  const categorizedSuggestions = {
    assignment: suggestions.filter(s => s.type === 'assignment'),
    optimization: suggestions.filter(s => s.type === 'optimization'),
    swap: suggestions.filter(s => s.type === 'swap')
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-blue-600" />
          AI Scheduling Suggestions
        </h1>
        <p className="text-muted-foreground">
          Smart recommendations to optimize your schedule
        </p>
      </div>

      {/* Summary Stats */}
      <SuggestionStats suggestions={suggestions} />

      {/* Suggestions by Category */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({suggestions.length})</TabsTrigger>
          <TabsTrigger value="assignment">Assignments ({categorizedSuggestions.assignment.length})</TabsTrigger>
          <TabsTrigger value="optimization">Optimization ({categorizedSuggestions.optimization.length})</TabsTrigger>
          <TabsTrigger value="swap">Swaps ({categorizedSuggestions.swap.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              employees={employees}
              isApplied={appliedSuggestions.has(suggestion.id)}
              onApply={() => handleApply(suggestion)}
              getEmployeeName={getEmployeeName}
            />
          ))}
        </TabsContent>

        <TabsContent value="assignment" className="space-y-4">
          {categorizedSuggestions.assignment.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              employees={employees}
              isApplied={appliedSuggestions.has(suggestion.id)}
              onApply={() => handleApply(suggestion)}
              getEmployeeName={getEmployeeName}
            />
          ))}
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          {categorizedSuggestions.optimization.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              employees={employees}
              isApplied={appliedSuggestions.has(suggestion.id)}
              onApply={() => handleApply(suggestion)}
              getEmployeeName={getEmployeeName}
            />
          ))}
        </TabsContent>

        <TabsContent value="swap" className="space-y-4">
          {categorizedSuggestions.swap.length > 0 ? (
            categorizedSuggestions.swap.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                employees={employees}
                isApplied={appliedSuggestions.has(suggestion.id)}
                onApply={() => handleApply(suggestion)}
                getEmployeeName={getEmployeeName}
              />
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <ArrowRight className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3>No Swap Suggestions</h3>
                <p className="text-muted-foreground">
                  No employee swap recommendations available at this time.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
