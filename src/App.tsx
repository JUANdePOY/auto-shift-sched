import { useState } from 'react'
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { AISuggestionsPanel } from '@/components/AISuggestionPanel';
import { ScheduleView } from './components/ScheduleView';
import { Employees } from './components/Employees';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { 
  mockEmployees, 
  mockWeeklySchedule,
  AISchedulingEngine
} from '@/lib/mockData';
import type { AISuggestion, Employee, WeeklySchedule } from './types';

type View = 'dashboard' | 'suggestions' | 'schedule' | 'employees' | 'settings';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [schedule, setSchedule] = useState<WeeklySchedule>(mockWeeklySchedule);

  const handleApplySuggestion = (suggestion: AISuggestion) => {
    // Simulate applying the suggestion
    const updatedShifts = schedule.shifts.map(shift => {
      if (shift.id === suggestion.action.shiftId) {
        if (suggestion.action.type === 'assign') {
          return {
            ...shift,
            assignedEmployees: [...shift.assignedEmployees, suggestion.action.employeeId]
          };
        } else if (suggestion.action.type === 'unassign') {
          return {
            ...shift,
            assignedEmployees: shift.assignedEmployees.filter(id => id !== suggestion.action.employeeId)
          };
        }
      }
      return shift;
    });

    // Update employee hours
    const updatedEmployees = employees.map(emp => {
      if (emp.id === suggestion.action.employeeId) {
        const hoursChange = suggestion.action.type === 'assign' ? 8 : -8;
        return {
          ...emp,
          currentWeeklyHours: Math.max(0, emp.currentWeeklyHours + hoursChange)
        };
      }
      return emp;
    });

    // Regenerate suggestions with updated data
    const newSuggestions = AISchedulingEngine.generateSuggestions(updatedShifts, updatedEmployees);
    
    // Update schedule
    const updatedSchedule = {
      ...schedule,
      shifts: updatedShifts,
      suggestions: newSuggestions,
      coverageRate: Math.round((updatedShifts.filter(s => 
        s.assignedEmployees.length >= s.requiredEmployees
      ).length / updatedShifts.length) * 100),
      scheduleEfficiency: AISchedulingEngine.calculateScheduleEfficiency(updatedShifts, updatedEmployees)
    };

    setEmployees(updatedEmployees);
    setSchedule(updatedSchedule);

    toast.success(`Applied suggestion: ${suggestion.title}`, {
      description: `Schedule updated successfully. Efficiency improved by ${suggestion.impact.efficiency}%.`
    });
  };

  const handleAssignEmployee = (shiftId: string, employeeId: string) => {
    const updatedShifts = schedule.shifts.map(shift => {
      if (shift.id === shiftId && !shift.assignedEmployees.includes(employeeId)) {
        return {
          ...shift,
          assignedEmployees: [...shift.assignedEmployees, employeeId]
        };
      }
      return shift;
    });

    const updatedEmployees = employees.map(emp => {
      if (emp.id === employeeId) {
        return {
          ...emp,
          currentWeeklyHours: emp.currentWeeklyHours + 8
        };
      }
      return emp;
    });

    // Recalculate schedule efficiency
    const updatedSchedule = {
      ...schedule,
      shifts: updatedShifts,
      coverageRate: Math.round((updatedShifts.filter(s => 
        s.assignedEmployees.length >= s.requiredEmployees
      ).length / updatedShifts.length) * 100),
      scheduleEfficiency: AISchedulingEngine.calculateScheduleEfficiency(updatedShifts, updatedEmployees)
    };

    setSchedule(updatedSchedule);
    setEmployees(updatedEmployees);

    const employeeName = employees.find(emp => emp.id === employeeId)?.name;
    const shiftTitle = updatedShifts.find(shift => shift.id === shiftId)?.title;
    toast.success(`Assigned ${employeeName} to ${shiftTitle}`);
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
            suggestions={schedule.suggestions}
            employees={employees}
            onApplySuggestion={handleApplySuggestion}
          />
        );
      
      case 'schedule':
        return (
          <ScheduleView
            shifts={schedule.shifts}
            employees={employees}
            conflicts={schedule.conflicts}
            onEditShift={handleEditShift}
            onCreateShift={handleCreateShift}
            onAssignEmployee={handleAssignEmployee}
          />
        );

      case 'employees':
        return (
          <Employees
            employees={employees}
          />
        );
      
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
        suggestionsCount={schedule.suggestions.length}
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
