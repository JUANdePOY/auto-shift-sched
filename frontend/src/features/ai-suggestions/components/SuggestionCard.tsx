import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Badge } from '../../shared/components/ui/badge';
import {
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  Users,
  ArrowRight,
  TrendingUp,
  Brain
} from 'lucide-react';
import type { AISuggestion, Employee } from '../../shared/types';
import { getConfidenceColor } from '../utils/suggestionUtils';

interface SuggestionCardProps {
  suggestion: AISuggestion;
  employees: Employee[];
  isApplied: boolean;
  onApply: () => void;
  getEmployeeName: (id: string) => string;
}

export function SuggestionCard({
  suggestion,
  isApplied,
  onApply,
  getEmployeeName
}: SuggestionCardProps) {
  const getSuggestionIconComponent = (type: string) => {
    switch (type) {
      case 'assignment':
        return Users;
      case 'swap':
        return ArrowRight;
      case 'optimization':
        return TrendingUp;
      default:
        return Brain;
    }
  };

  const SuggestionIcon = getSuggestionIconComponent(suggestion.type);

  return (
    <Card className={isApplied ? 'border-green-200 bg-green-50/50' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <SuggestionIcon className="w-4 h-4" />
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
