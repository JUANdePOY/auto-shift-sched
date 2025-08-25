import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Users, 
  Star, 
  CheckCircle, 
  ArrowRight,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import type { AISuggestion, Employee } from '../types';

interface AISuggestionsPanelProps {
  suggestions: AISuggestion[];
  employees: Employee[];
  onApplySuggestion: (suggestion: AISuggestion) => void;
}

export function AISuggestionsPanel({ 
  suggestions, 
  employees, 
  onApplySuggestion
}: AISuggestionsPanelProps) {
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  const handleApply = (suggestion: AISuggestion) => {
    setAppliedSuggestions(prev => new Set([...prev, suggestion.id]));
    onApplySuggestion(suggestion);
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

  const categorizedSuggestions = {
    assignment: suggestions.filter(s => s.type === 'assignment'),
    optimization: suggestions.filter(s => s.type === 'optimization'),
    swap: suggestions.filter(s => s.type === 'swap')
  };

  const averageEfficiencyGain = suggestions.reduce((sum, s) => sum + s.impact.efficiency, 0) / suggestions.length;
  const averageConfidence = suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length;

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