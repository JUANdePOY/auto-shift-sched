import { useState, useEffect } from 'react'
import { Navigation } from './features/shared/components/Navigation';
import { Dashboard } from './features/shared/components/Dashboard';

import { ScheduleView } from './features/schedule/components/ScheduleView';
import { Employees } from './features/employees/components/Employees';
import AvailabilityPanel from './features/availability/components/AvailabilityPanel';
import { Toaster } from './features/shared/components/ui/sonner';
import { toast } from 'sonner';
import { useEmployees } from './features/employees/hooks/useEmployees';
import { useSchedule } from './features/schedule/hooks/useSchedule';
import { useAuth } from './features/auth/contexts/AuthContext';
import { LoginForm } from './features/auth/components/LoginForm';
import { CrewDashboard } from './features/crew/components/CrewDashboard';
import { CrewAvailabilityPanel } from './features/crew/components/CrewAvailabilityPanel';
import { CrewProfileWrapper } from './features/crew/components/CrewProfileWrapper';

type AdminView = 'dashboard' | 'schedule' | 'employees' | 'availability' | 'settings';
type CrewView = 'dashboard' | 'availability' | 'profile';
type View = AdminView | CrewView;

export default function App() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');

  // Custom hooks for state management
  const { employees } = useEmployees();
  const { schedule, finalSchedule, fetchSchedule, fetchFinalScheduleForWeek } = useSchedule();

  // Fetch initial schedule data on app mount (only if authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      const weekStart = getCurrentWeekStart();
      fetchSchedule(weekStart);
      fetchFinalScheduleForWeek(weekStart);
    }
  }, [isAuthenticated]);



  const handleRefreshData = async (weekStart?: string) => {
    try {
      // Refresh schedule data from the server
      await fetchSchedule(weekStart);
      // Also fetch final schedule for the current week
      if (weekStart) {
        await fetchFinalScheduleForWeek(weekStart);
      }
      toast.success('Data refreshed successfully!');
    } catch (error) {
      console.error('Failed to refresh data:', error);
      toast.error('Failed to refresh data. Please try again.');
    }
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
    // Admin views
    if (user?.role === 'admin') {
      switch (currentView) {
        case 'schedule':
          return (
            <ScheduleView
              employees={employees}
              conflicts={schedule?.conflicts || []}
              finalSchedule={finalSchedule}
              onRefreshData={handleRefreshData}
            />
          );

        case 'employees':
          return <Employees />;

        case 'availability':
          return (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Availability Management</h2>
              <AvailabilityPanel
                initialWeekStart={getCurrentWeekStart()}
              />
            </div>
          );

        case 'dashboard':
        default:
          return (
            <Dashboard
              schedule={schedule}
              employees={employees}
              onViewSchedule={() => setCurrentView('schedule')}
            />
          );
      }
    }

    // Crew views
    if (user?.role === 'crew') {
      switch (currentView) {
        case 'availability':
          return (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Submit Availability</h2>
              <CrewAvailabilityPanel employeeId={user.id} />
            </div>
          );

        case 'profile':
          return (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">My Profile</h2>
              <CrewProfileWrapper employeeId={user.id} />
            </div>
          );

        case 'dashboard':
        default:
          return (
            <CrewDashboard employeeId={user.id} />
          );
      }
    }

    // Fallback
    return (
      <div className="text-center py-12">
        <p>Unable to load dashboard. Please contact support.</p>
      </div>
    );
  };


  // Helper function to get current week's Monday
  const getCurrentWeekStart = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Sunday
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);

    // Format as YYYY-MM-DD
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, '0');
    const day = String(monday.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Sidebar */}
      <Navigation
        currentView={currentView}
        onViewChange={handleViewChange}
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
          duration: 700,
          style: {
            animationDuration: '0.1s',
          },
        }}
      />
    </div>
  );
}
