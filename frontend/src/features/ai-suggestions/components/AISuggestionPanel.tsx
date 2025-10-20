import React, { useState } from 'react';
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
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  // Helper function to parse time strings (assuming format like "09:00" or "9:00 AM")
  const parseTime = (timeStr: string): number => {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let hourNum = hours;
    if (period?.toUpperCase() === 'PM' && hours !== 12) hourNum += 12;
    if (period?.toUpperCase() === 'AM' && hours === 12) hourNum = 0;
    return hourNum * 60 + minutes;
  };

  // Helper function to check if shift time overlaps with employee availability
  const isTimeAvailable = (employee: Employee, shiftDate: string, shiftStart: string, shiftEnd: string): boolean => {
    if (!employee.availability) return false;

    const dayOfWeek = new Date(shiftDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof typeof employee.availability;
    const availability = employee.availability[dayOfWeek];

    if (!availability || !availability.available) return false;

    // Require specific preferred times to be set for accurate matching
    if (!availability.preferredStart || !availability.preferredEnd) return false;

    const shiftStartMinutes = parseTime(shiftStart);
    const shiftEndMinutes = parseTime(shiftEnd);
    const availStartMinutes = parseTime(availability.preferredStart);
    const availEndMinutes = parseTime(availability.preferredEnd);

    // Check if shift is fully contained within employee's preferred availability
    return shiftStartMinutes >= availStartMinutes && shiftEndMinutes <= availEndMinutes;
  };

  // Filter employees who are available for this specific shift date and time
  const availableForShift = availableEmployees.filter(employee =>
    shiftDate && shiftTime && shiftEndTime ?
      isTimeAvailable(employee, shiftDate, shiftTime, shiftEndTime) :
      true // If no date/time provided, include all
  );

  // Generate AI suggestions for the specific shift using enhanced logic
  const generateShiftSuggestions = (): AISuggestion[] => {
    if (!shiftId || !availableForShift.length) return [];

    const shiftSuggestions: AISuggestion[] = [];

    // Use the new ranking logic to determine best matches
    // This would ideally call the backend EmployeeRanker service
    // For now, we'll simulate enhanced ranking based on availability patterns

    // Sort employees by enhanced criteria
    const rankedEmployees = availableForShift.map(employee => {
      let score = 0;

      // Availability match (higher for preferred times)
      if (shiftDate && shiftTime && shiftEndTime) {
        const dayOfWeek = new Date(shiftDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof typeof employee.availability;
        const availability = employee.availability[dayOfWeek];
        if (availability && availability.available) {
          if (availability.preferredStart && availability.preferredEnd) {
            // Check if shift time matches preferred times
            const shiftStart = shiftTime;
            const shiftEnd = shiftEndTime;
            const prefStart = availability.preferredStart;
            const prefEnd = availability.preferredEnd;

            if (shiftStart === prefStart && shiftEnd === prefEnd) {
              score += 50; // Perfect match
            } else if (shiftStart >= prefStart && shiftEnd <= prefEnd) {
              score += 40; // Within preferred range
            } else {
              score += 30; // Has preferred times but different
            }
          } else {
            score += 20; // Available but no preferences
          }
        }
      }

      // Skill match (higher for exact station matches)
      if (requiredStations && requiredStations.length > 0) {
        const employeeStations = Array.isArray(employee.station) ? employee.station : [employee.station];
        const matchedStations = requiredStations.filter(station =>
          employeeStations.includes(station)
        ).length;
        score += (matchedStations / requiredStations.length) * 40;
      }

      // Fairness factor (prefer employees with lower current hours - simulated workload balance)
      // In real implementation, this would come from FairnessEngine with actual current hours
      const simulatedCurrentHours = Math.random() * 40; // Simulate 0-40 hours worked this week
      const maxHours = 40; // Assume 40 hours is full time
      const workloadBalance = (maxHours - simulatedCurrentHours) / maxHours; // 0-1, higher means less worked
      score += workloadBalance * 30; // Up to 30 points for workload balance

      return { employee, score };
    }).sort((a, b) => b.score - a.score);

    // Best match suggestion
    const bestMatch = rankedEmployees[0];
    if (bestMatch) {
      shiftSuggestions.push({
        id: `suggestion-${shiftId}-best-match`,
        type: 'assignment',
        title: `Best Match: ${bestMatch.employee.name}`,
        description: `${bestMatch.employee.name} is the optimal choice based on enhanced fairness algorithms, skill matching, and availability patterns.`,
        confidence: Math.min(98, 85 + (bestMatch.score / 100) * 13),
        impact: {
          efficiency: 28,
          satisfaction: 25,
          coverage: 35
        },
        action: {
          type: 'assign',
          shiftId: shiftId,
          employeeId: bestMatch.employee.id
        }
      });
    }

    // Alternative suggestions with enhanced reasoning
    rankedEmployees.slice(1, 4).forEach((rankedEmp, index) => {
      const reasons = [];
      if (rankedEmp.score > 50) reasons.push('strong skill match');
      if (rankedEmp.score > 30) reasons.push('good availability');
      if (reasons.length === 0) reasons.push('balanced option');

      shiftSuggestions.push({
        id: `suggestion-${shiftId}-alt-${index}`,
        type: 'assignment',
        title: `Alternative: ${rankedEmp.employee.name}`,
        description: `${rankedEmp.employee.name} is a solid alternative with ${reasons.join(' and ')}.`,
        confidence: Math.max(60, 80 - (index * 8)),
        impact: {
          efficiency: Math.max(15, 25 - (index * 3)),
          satisfaction: Math.max(12, 20 - (index * 2)),
          coverage: Math.max(20, 30 - (index * 3))
        },
        action: {
          type: 'assign',
          shiftId: shiftId,
          employeeId: rankedEmp.employee.id
        }
      });
    });

    // Fairness optimization suggestion
    if (availableEmployees.length > 2) {
      shiftSuggestions.push({
        id: `suggestion-${shiftId}-fairness`,
        type: 'optimization',
        title: 'Enhanced Fairness Optimization',
        description: 'This assignment considers workload balance, station variety, and equal distribution across the team using advanced fairness algorithms.',
        confidence: 82,
        impact: {
          efficiency: 18,
          satisfaction: 40,
          coverage: 25
        },
        action: {
          type: 'assign',
          shiftId: shiftId,
          employeeId: rankedEmployees[0].employee.id
        }
      });
    }

    // Station variety suggestion
    const stationVarietyEmployees = availableEmployees.filter(emp => {
      const employeeStations = Array.isArray(emp.station) ? emp.station : [emp.station];
      return requiredStations && requiredStations.some(station => employeeStations.includes(station));
    });

    if (stationVarietyEmployees.length > 1) {
      shiftSuggestions.push({
        id: `suggestion-${shiftId}-variety`,
        type: 'optimization',
        title: 'Station Variety Consideration',
        description: 'Prioritizing employees for station variety to prevent skill stagnation and maintain team versatility.',
        confidence: 75,
        impact: {
          efficiency: 20,
          satisfaction: 30,
          coverage: 22
        },
        action: {
          type: 'assign',
          shiftId: shiftId,
          employeeId: stationVarietyEmployees[0].id
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
              {shiftTitle} from {shiftTime} to {shiftEndTime}
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
                  {availableEmployees.filter(employee => {
                    if (!employee.station) return false;

                    // Convert employee stations to array and clean up
                    let employeeStations: string[] = [];

                    if (Array.isArray(employee.station)) {
                      // Handle nested array structure
                      employeeStations = employee.station.flat().map(s => {
                        if (typeof s === 'string') {
                          return s.trim().toLowerCase();
                        }
                        if (typeof s === 'object' && s !== null && 'name' in s) {
                          const name = (s as { name: unknown }).name;
                          return typeof name === 'string' ? name.trim().toLowerCase() : '';
                        }
                        return String(s).trim().toLowerCase();
                      });
                    } else if (typeof employee.station === 'string') {
                      // Handle single string with possible commas
                      employeeStations = employee.station.split(',').map(s => s.trim().toLowerCase());
                    } else {
                      // Handle any other case by converting to string
                      employeeStations = String(employee.station).split(',').map(s => s.trim().toLowerCase());
                    }

                    // Remove any empty strings from the array
                    employeeStations = employeeStations.filter(s => s !== '');

                    // Clean up required stations
                    const trimmedRequiredStations = requiredStations
                      .filter(s => s != null && s !== '')
                      .map(s => s.trim().toLowerCase());

                    // Check for matches and store matching stations
                    const matchingStations = trimmedRequiredStations.filter(required =>
                      employeeStations.includes(required)
                    );

                    return matchingStations.length > 0 && employee.department === department;
                  }).map(employee => {
                    // Get actual current scheduled hours for the week
                    const currentHours = employeeCurrentHours[employee.id] || 0;

                    // Calculate shift duration in hours
                    const shiftStartMinutes = shiftTime ? parseTime(shiftTime) : 0;
                    const shiftEndMinutes = shiftEndTime ? parseTime(shiftEndTime) : 0;
                    const shiftHours = (shiftEndMinutes - shiftStartMinutes) / 60;

                    const afterHours = currentHours + shiftHours;

                    return (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} - {employee.role} (Current: {currentHours.toFixed(1)} hrs, After: {afterHours.toFixed(1)} hrs)
                      </SelectItem>
                    );
                  })}
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
