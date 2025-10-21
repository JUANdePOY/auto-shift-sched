import React from 'react';
import { Card, CardContent } from '../../shared/components/ui/card';
import { Brain, Target, Star } from 'lucide-react';
import type { AISuggestion } from '../../shared/types';
import { calculateAverageMetrics } from '../utils/suggestionUtils';

interface SuggestionStatsProps {
  suggestions: AISuggestion[];
}

export function SuggestionStats({ suggestions }: SuggestionStatsProps) {
  const { efficiency, confidence } = calculateAverageMetrics(suggestions);

  return (
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
              <p className="text-2xl text-green-600">{Math.round(efficiency)}%</p>
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
              <p className={`text-2xl ${confidence >= 80 ? 'text-green-600' : confidence >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {Math.round(confidence)}%
              </p>
            </div>
            <Star className="w-8 h-8 text-yellow-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
