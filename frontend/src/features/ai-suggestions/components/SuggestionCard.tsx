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
          {/* Action Details */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm">
              <span className="capitalize">{suggestion.action.type}</span>{' '}
              <span className="font-medium">
                {suggestion.action.employeeName || getEmployeeName(suggestion.action.employeeId)}
              </span>
              {suggestion.action.targetEmployeeId && (
                <>
                  {' with '}
                  <span className="font-medium">{getEmployeeName(suggestion.action.targetEmployeeId)}</span>
                </>
              )}
            </p>
            {/* Display reasons if available */}
            {suggestion.reasons && suggestion.reasons.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground font-medium">Reasons:</p>
                <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                  {suggestion.reasons.map((reason, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-blue-500">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
