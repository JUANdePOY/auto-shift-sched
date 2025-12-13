import React from 'react';
import { Card, CardContent } from '../../shared/components/ui/card';
import { Brain, CheckCircle, Users } from 'lucide-react';
import type { AISuggestion } from '../../shared/types';

interface SuggestionStatsProps {
  suggestions: AISuggestion[];
}

export function SuggestionStats({ suggestions }: SuggestionStatsProps) {
  const highQualitySuggestions = suggestions.filter(s => s.confidence >= 80).length;
  const assignmentSuggestions = suggestions.filter(s => s.type === 'assignment').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Suggestions</p>
              <p className="text-2xl font-semibold">{suggestions.length}</p>
            </div>
            <Brain className="w-8 h-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">High Quality</p>
              <p className="text-2xl font-semibold text-green-600">{highQualitySuggestions}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Assignments</p>
              <p className="text-2xl font-semibold text-blue-600">{assignmentSuggestions}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
