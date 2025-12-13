import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Badge } from '../../shared/components/ui/badge';
import {
  CheckCircle,
  Users,
  ArrowRight,
  TrendingUp,
  Brain,
  Star
} from 'lucide-react';
import type { AISuggestion, Employee } from '../../shared/types';

interface SuggestionCardProps {
  suggestion: AISuggestion;
  employees: Employee[];
  isApplied: boolean;
  onApply: () => void;
  getEmployeeName: (id: string) => string;
  employeeCurrentHours?: Record<string, number>;
}

export function SuggestionCard({
  suggestion,
  isApplied,
  onApply,
  getEmployeeName,
  employeeCurrentHours = {}
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

  const getRecommendationLevel = (confidence: number) => {
    if (confidence >= 85) return { label: 'Highly Recommended', color: 'bg-green-100 text-green-800' };
    if (confidence >= 70) return { label: 'Recommended', color: 'bg-blue-100 text-blue-800' };
    return { label: 'Consider', color: 'bg-gray-100 text-gray-800' };
  };

  const recommendation = getRecommendationLevel(suggestion.confidence);

  return (
    <Card className={isApplied ? 'border-green-200 bg-green-50/50' : 'hover:shadow-md transition-shadow'}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <SuggestionIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base">{suggestion.title}</CardTitle>
            </div>
          </div>
          <Badge className={recommendation.color}>
            <Star className="w-3 h-3 mr-1" />
            {recommendation.label}
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
            
            {/* Show current hours if available */}
            {employeeCurrentHours[suggestion.action.employeeId] !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">
                Current hours: {employeeCurrentHours[suggestion.action.employeeId].toFixed(1)}h this week
              </p>
            )}
            {/* Display reasons if available */}
            {suggestion.reasons && suggestion.reasons.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground font-medium">Smart Analysis:</p>
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

          {/* Action Button */}
          <div className="flex justify-end">
            {isApplied ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Applied
              </Badge>
            ) : (
              <Button onClick={onApply} size="sm" className="bg-blue-600 hover:bg-blue-700">
                Apply Suggestion
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
