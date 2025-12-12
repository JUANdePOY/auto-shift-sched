import React from 'react';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';

import { Badge } from '../../shared/components/ui/badge';
import { Users, Clock, Zap, RefreshCw, Plus, Search } from 'lucide-react';

interface AssignmentActionsProps {
  onAddShift: () => void;
  onAutoAssign: () => void;
  isAutoAssigning: boolean;
  assignedCount: number;
  totalCount: number;

  searchTerm: string;
  onSearchChange: (value: string) => void;
  viewMode?: boolean;
}

const AssignmentActions: React.FC<AssignmentActionsProps> = ({
  onAddShift,
  onAutoAssign,
  isAutoAssigning,
  assignedCount,
  totalCount,

  searchTerm,
  onSearchChange,
  viewMode = false
}) => {
  return (
    <>
      {/* Action Buttons - Only show when not in view mode */}
      {!viewMode && (
        <section
          className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-muted/30 rounded-lg border gap-4"
          aria-labelledby="action-buttons-heading"
        >
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            <Button
              onClick={onAddShift}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              aria-label="Add new shift"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Add Shift
            </Button>

            <Button
              onClick={onAutoAssign}
              disabled={isAutoAssigning}
              variant="outline"
              className="flex items-center gap-2 border-purple-300 hover:bg-purple-50 hover:border-purple-400"
              aria-label={isAutoAssigning ? 'Auto-assigning shifts' : 'Auto-assign shifts'}
            >
              {isAutoAssigning ? (
                <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Zap className="w-4 h-4" aria-hidden="true" />
              )}
              {isAutoAssigning ? 'Auto-Assigning...' : 'Auto-Assign'}
            </Button>

            <div
              className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border shadow-sm"
              role="status"
              aria-label={`Assignment progress: ${assignedCount} of ${totalCount} shifts assigned`}
            >
              <Users className="w-4 h-4 text-blue-600" aria-hidden="true" />
              <span className="text-sm font-medium">
                {assignedCount}/{totalCount} Assigned
              </span>
              <div
                className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={assignedCount}
                aria-valuemax={totalCount}
              >
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${totalCount > 0 ? (assignedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
            </div>


          </div>

          {/* Search Bar - Right Side */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search shifts..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 w-full"
            />
          </div>


        </section>
      )}


    </>
  );
};

export default AssignmentActions;
