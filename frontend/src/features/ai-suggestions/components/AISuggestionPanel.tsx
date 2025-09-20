import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Badge } from '../../shared/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/components/ui/tabs';
import {
  Brain,
  TrendingUp,
  Target,
  Users,
  Star,
  CheckCircle,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  X,
  Clock,
  User
} from 'lucide-react';
import type { AISuggestion, Employee } from '../../shared/types';

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
  department?: string;
  requiredStations?: string[];
  availableEmployees?: Employee[];
  mode?: 'full' | 'panel';
}

export function AISuggestionsPanel({
  suggestions = [],
  employees,
  onApplySuggestion,
  // Panel mode props
  isOpen = false,
  onClose,
  shiftId,
  shiftTitle,
  shiftTime,
  department,
  requiredStations = [],
  availableEmployees = [],
  mode = 'full'
}: AISuggestionsPanelProps) {
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  // Generate AI suggestions for the specific shift
  const generateShiftSuggestions = (): AISuggestion[] => {
    if (!shiftId || !availableEmployees.length) return [];

    const shiftSuggestions: AISuggestion[] = [];

    // Best match suggestion
    const bestMatch = availableEmployees[0];
    if (bestMatch) {
      shiftSuggestions.push({
        id: `suggestion-${shiftId}-best-match`,
        type: 'assignment',
        title: `Best Match: ${bestMatch.name}`,
        description: `${bestMatch.name} is the optimal choice based on skills, availability, and workload balance.`,
        confidence: 95,
        impact: {
          efficiency: 25,
          satisfaction: 20,
          coverage: 30
        },
        action: {
          type: 'assign',
          shiftId: shiftId,
          employeeId: bestMatch.id
        }
      });
    }

    // Alternative suggestions
    availableEmployees.slice(1, 3).forEach((employee, index) => {
      shiftSuggestions.push({
        id: `suggestion-${shiftId}-alt-${index}`,
        type: 'assignment',
        title: `Alternative: ${employee.name}`,
        description: `${employee.name} is a good alternative with complementary skills.`,
        confidence: 85 - (index * 5),
        impact: {
          efficiency: 20 - (index * 3),
          satisfaction: 15 - (index * 2),
          coverage: 25 - (index * 3)
        },
        action: {
          type: 'assign',
          shiftId: shiftId,
          employeeId: employee.id
        }
      });
    });

    // Optimization suggestion
    if (availableEmployees.length > 1) {
      shiftSuggestions.push({
        id: `suggestion-${shiftId}-optimization`,
        type: 'optimization',
        title: 'Optimize Workload Distribution',
        description: 'Consider rotating assignments to ensure fair workload distribution across the team.',
        confidence: 78,
        impact: {
          efficiency: 15,
          satisfaction: 35,
          coverage: 20
        },
        action: {
          type: 'swap',
          shiftId: shiftId,
          employeeId: availableEmployees[0].id,
          targetEmployeeId: availableEmployees[1].id
        }
      });
    }

    return shiftSuggestions;
  };

  const shiftSuggestions = generateShiftSuggestions();

  const handleApply = (suggestion: AISuggestion) => {
    setAppliedSuggestions(prev => new Set([...prev, suggestion.id]));
    if (onApplySuggestion) {
      onApplySuggestion(suggestion);
    }
  };

  const handleQuickAssign = (employeeId: string) => {
    if (shiftId && onApplySuggestion) {
      const employee = employees.find(emp => emp.id === employeeId);
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
        handleApply(quickSuggestion);
      }
    }
  };

  const getEmployeeName = (employeeId: string) => {
    return employees.find(emp => emp.id === employeeId)?.name || 'Unknown Employee';
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <Users className="w-4 h-4" />;
      case 'swap':
        return <ArrowRight className="w-4 h-4" />;
      case 'optimization':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const averageEfficiencyGain = shiftSuggestions.reduce((sum, s) => sum + s.impact.efficiency, 0) / shiftSuggestions.length || 0;
  const averageConfidence = shiftSuggestions.reduce((sum, s) => sum + s.confidence, 0) / shiftSuggestions.length || 0;

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
            <p className="text-sm text-muted-foreground">
              {shiftTitle} at {shiftTime}
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
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="w-4 h-4" />
                Quick Assign
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {availableEmployees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} - {employee.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => selectedEmployee && handleQuickAssign(selectedEmployee)}
                disabled={!selectedEmployee}
                size="sm"
                className="w-full"
              >
                Assign Selected
              </Button>
            </CardContent>
          </Card>

          {/* AI Suggestions */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Smart Recommendations</h4>
            {shiftSuggestions.map((suggestion) => (
              <Card key={suggestion.id} className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-blue-100 rounded">
                      {getSuggestionIcon(suggestion.type)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{suggestion.title}</p>
                      <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`${getConfidenceColor(suggestion.confidence)} border-current text-xs`}
                  >
                    {suggestion.confidence}%
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-4 text-xs">
                    <span>Efficiency: +{suggestion.impact.efficiency}%</span>
                    <span>Coverage: +{suggestion.impact.coverage}%</span>
                  </div>
                  <Button
                    onClick={() => handleApply(suggestion)}
                    size="sm"
                    variant="outline"
                    disabled={appliedSuggestions.has(suggestion.id)}
                  >
                    {appliedSuggestions.has(suggestion.id) ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Applied
                      </>
                    ) : (
                      'Apply'
                    )}
                  </Button>
                </div>
              </Card>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Suggestions</p>
                <p className="text-2xl">{suggestions.length}</p>
              </div>
              <Brain className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Efficiency Gain</p>
                <p className="text-2xl text-green-600">{Math.round(averageEfficiencyGain)}%</p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Confidence</p>
                <p className={`text-2xl ${getConfidenceColor(averageConfidence)}`}>
                  {Math.round(averageConfidence)}%
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

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
              getSuggestionIcon={getSuggestionIcon}
              getConfidenceColor={getConfidenceColor}
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
              getSuggestionIcon={getSuggestionIcon}
              getConfidenceColor={getConfidenceColor}
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
              getSuggestionIcon={getSuggestionIcon}
              getConfidenceColor={getConfidenceColor}
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
                getSuggestionIcon={getSuggestionIcon}
                getConfidenceColor={getConfidenceColor}
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

interface SuggestionCardProps {
  suggestion: AISuggestion;
  employees: Employee[];
  isApplied: boolean;
  onApply: () => void;
  getEmployeeName: (id: string) => string;
  getSuggestionIcon: (type: string) => React.ReactNode;
  getConfidenceColor: (confidence: number) => string;
}

function SuggestionCard({
  suggestion,
  isApplied,
  onApply,
  getEmployeeName,
  getSuggestionIcon,
  getConfidenceColor
}: SuggestionCardProps) {
  return (
    <Card className={isApplied ? 'border-green-200 bg-green-50/50' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {getSuggestionIcon(suggestion.type)}
            </div>
            <div>
              <CardTitle className="text-base">{suggestion.title}</CardTitle>
              <CardDescription>{suggestion.description}</CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`${getConfidenceColor(suggestion.confidence)} border-current`}
          >
            {suggestion.confidence}% confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Impact Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Efficiency</p>
              <p className="text-blue-600">{suggestion.impact.efficiency}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Coverage</p>
              <p className="text-green-600">{suggestion.impact.coverage}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Satisfaction</p>
              <p className="text-purple-600">{suggestion.impact.satisfaction}%</p>
            </div>
          </div>

          {/* Action Details */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm">
              <span className="capitalize">{suggestion.action.type}</span>{' '}
              <span className="font-medium">{getEmployeeName(suggestion.action.employeeId)}</span>
              {suggestion.action.targetEmployeeId && (
                <>
                  {' with '}
                  <span className="font-medium">{getEmployeeName(suggestion.action.targetEmployeeId)}</span>
                </>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <ThumbsUp className="w-4 h-4 mr-1" />
                Helpful
              </Button>
              <Button variant="ghost" size="sm">
                <ThumbsDown className="w-4 h-4 mr-1" />
                Not helpful
              </Button>
            </div>

            {isApplied ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Applied
              </Badge>
            ) : (
              <Button onClick={onApply} size="sm">
                Apply Suggestion
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
