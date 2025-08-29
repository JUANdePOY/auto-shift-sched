import { useState } from 'react'
import { Navigation } from './features/shared/components/Navigation';
import { Dashboard } from './features/shared/components/Dashboard';
import { AISuggestionsPanel } from './features/ai-suggestions/components/AISuggestionPanel';
import { ScheduleView } from './features/schedule/components/ScheduleView';
import { Employees } from './features/employees/components/Employees';
import { Toaster } from './features/shared/components/ui/sonner';
import { toast } from 'sonner';
import { useEmployees } from './features/employees/hooks/useEmployees';
import { useSchedule } from './features/schedule/hooks/useSchedule';
import { useAssignments } from './features/shared/hooks/useAssignments';
import { useSuggestions } from './features/ai-suggestions/hooks/useSuggestions';
import type { AISuggestion } from './features/shared/types';

type View = 'dashboard' | 'suggestions' | 'schedule' | 'employees' | 'settings';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  
  // Custom hooks for state management
  const { employees, updateEmployeeHours } = useEmployees();
  const { schedule, updateShiftAssignment } = useSchedule();
  const { handleAssignEmployee } = useAssignments();
  const { handleApplySuggestion } = useSuggestions();

  const handleApplySuggestionWrapper = (suggestion: AISuggestion) => {
    handleApplySuggestion(
      suggestion,
      schedule,
      updateShiftAssignment,
      updateEmployeeHours
    );
  };

  const handleAssignEmployeeWrapper = (shiftId: string, employeeId: string) => {
    handleAssignEmployee(
      shiftId,
      employeeId,
      employees,
      updateShiftAssignment,
      updateEmployeeHours
    );
  };

  const handleEditShift = () => {
    toast.info('Shift editing feature coming soon!', {
      description: 'This would open a shift editing dialog.'
    });
  };

  const handleCreateShift = () => {
    toast.info('Shift creation feature coming soon!', {
      description: 'This would open a shift creation dialog.'
    });
  };

  const handleRefreshData = () => {
    // This would refresh all data from the server
    toast.info('Data refresh feature coming soon!', {
      description: 'This would refresh all data from the server.'
    });
  };

  const handleViewChange = (view: View) => {
    if (view === 'settings') {
      toast.info('Settings feature coming soon!', {
        description: 'This would open the settings panel.'
      });
      return;
    }
    setCurrentView(view);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'suggestions':
        return (
          <AISuggestionsPanel
            suggestions={schedule?.suggestions || []}
            employees={employees}
            onApplySuggestion={handleApplySuggestionWrapper}
          />
        );
      
      case 'schedule':
        return (
          <ScheduleView
            shifts={schedule?.shifts || []}
            employees={employees}
            conflicts={schedule?.conflicts || []}
            onEditShift={handleEditShift}
            onCreateShift={handleCreateShift}
            onAssignEmployee={handleAssignEmployeeWrapper}
            onRefreshData={handleRefreshData}
          />
        );

      case 'employees':
        return <Employees />;
      
      case 'dashboard':
      default:
        return (
          <Dashboard
            schedule={schedule}
            employees={employees}
            onViewSchedule={() => setCurrentView('schedule')}
            onViewSuggestions={() => setCurrentView('suggestions')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Sidebar */}
      <Navigation 
        currentView={currentView} 
        onViewChange={handleViewChange}
        suggestionsCount={schedule?.suggestions?.length || 0}
      />
      
      {/* Main Content */}
      <div className="ml-16 transition-all duration-300">
        <div className="container mx-auto p-6">
          {renderCurrentView()}
        </div>
      </div>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
        }}
      />
    </div>
  );
}
