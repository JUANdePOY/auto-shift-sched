import React from 'react';
import { Users } from 'lucide-react';
import type { AssignmentProgressProps } from './ShiftAssignmentTypes';

const AssignmentProgress: React.FC<AssignmentProgressProps> = ({
  assignedCount,
  totalCount
}) => {
  return (
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
  );
};

export default AssignmentProgress;
