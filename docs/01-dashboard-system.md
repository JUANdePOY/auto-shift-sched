# Dashboard System Documentation

## Overview

The Dashboard System serves as the central command center for the Auto Shift Scheduler application, providing administrators and crew members with real-time insights into scheduling operations, employee utilization, and system performance.

## Architecture

### Frontend Components

#### Main Dashboard Component (`Dashboard.tsx`)
**Location**: `frontend/src/features/shared/components/Dashboard.tsx`

**Purpose**: Central dashboard interface displaying key metrics and system overview

**Key Features**:
- Real-time schedule coverage tracking
- Employee utilization monitoring
- Department-wise employee distribution
- Availability submission status
- Monthly performance overview
- Recent activity feed
- Today's shift display

#### Logic Flow

```typescript
// Dashboard initialization logic
const fetchDashboardData = async () => {
  try {
    const currentWeekStart = getCurrentWeekStart();
    const nextWeekStart = getNextWeekStart();

    // Parallel data fetching for performance
    const [
      weekSummaryData,
      utilizationData,
      monthlyData,
      activityData,
      availabilityData
    ] = await Promise.all([
      dashboardService.getWeekSummary(currentWeekStart),
      dashboardService.getEmployeeUtilization(currentWeekStart),
      dashboardService.getMonthlyOverview(),
      dashboardService.getRecentActivity(),
      availabilityService.getAvailabilityStatus(nextWeekStart)
    ]);

    // State updates
    setWeekSummary(weekSummaryData);
    setEmployeeUtilization(utilizationData);
    setMonthlyOverview(monthlyData);
    setRecentActivity(activityData || []);
    setNextWeekAvailability(availabilityData);
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
  }
};
```

**Week Calculation Logic**:
```typescript
// Get current week's Monday
const getCurrentWeekStart = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Sunday
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  
  return formatDate(monday); // YYYY-MM-DD format
};

// Get next week's Monday for availability tracking
const getNextWeekStart = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? 1 : 8 - dayOfWeek; // Next Monday
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + diff);
  
  return formatDate(nextMonday);
};
```

### Backend Services

#### Dashboard Service (`dashboardService.ts`)
**Location**: `frontend/src/features/shared/services/dashboardService.ts`

**API Endpoints**:
- `GET /api/dashboard/week-summary/:weekStart` - Weekly performance metrics
- `GET /api/dashboard/employee-utilization/:weekStart` - Employee usage statistics
- `GET /api/dashboard/monthly-overview` - Monthly trends and comparisons
- `GET /api/dashboard/recent-activity` - Latest system activities

**Data Types**:
```typescript
interface WeekSummary {
  totalShifts: number;
  coveredShifts: number;
  coverageRate: number;
  conflicts: ScheduleConflict[];
  assignments: Assignment[];
}

interface EmployeeUtilization {
  totalEmployees: number;
  employeesScheduled: number;
  averageUtilization: number;
  utilizationByDepartment: Record<string, number>;
}

interface MonthlyOverview {
  currentMonth: {
    averageCoverageRate: number;
    totalHours: string;
    totalAssignments: number;
    uniqueEmployees: number;
  };
  percentageChanges: {
    assignmentsChange: number;
    hoursChange: number;
    coverageChange: number;
  };
}
```

### Key Metrics Calculation

#### Schedule Coverage Rate
```typescript
// Coverage calculation logic
const calculateCoverageRate = (totalShifts: number, coveredShifts: number) => {
  if (totalShifts === 0) return 0;
  return Math.round((coveredShifts / totalShifts) * 100);
};

// Usage in dashboard
const coverage = weekSummary?.coverageRate ?? 0;
```

#### Employee Utilization
```typescript
// Utilization calculation
const calculateUtilization = (scheduledEmployees: number, totalEmployees: number) => {
  if (totalEmployees === 0) return 0;
  return Math.round((scheduledEmployees / totalEmployees) * 100);
};

// Department-wise distribution
const departmentDistribution = employees.reduce((acc, employee) => {
  acc[employee.department] = (acc[employee.department] || 0) + 1;
  return acc;
}, {} as Record<string, number>);
```

#### Availability Submission Tracking
```typescript
// Availability status calculation
const calculateAvailabilityStatus = (submissions: number, totalEmployees: number) => {
  const submissionRate = totalEmployees > 0 
    ? Math.round((submissions / totalEmployees) * 100) 
    : 0;
    
  return {
    submissionRate,
    totalEmployees,
    submissions,
    pendingSubmissions: totalEmployees - submissions
  };
};
```

### User Interface Components

#### Metric Cards
Each metric is displayed in an interactive card with:
- **Visual Indicators**: Progress bars, color-coded badges
- **Hover Effects**: Smooth transitions and shadow effects
- **Real-time Updates**: Automatic refresh on data changes

```typescript
// Metric card structure
<Card className="transition-all hover:shadow-lg hover:-translate-y-1 duration-200">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
    <CardTitle className="text-sm font-medium">Schedule Coverage</CardTitle>
    <CalendarDays className="h-5 w-5 text-blue-500" />
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold text-slate-900">{coverage}%</div>
    <Progress value={coverage} className="mt-3 h-2" />
    <p className="text-xs text-slate-600 mt-3">
      {weekSummary?.coveredShifts ?? 0} of {weekSummary?.totalShifts ?? 0} shifts covered
    </p>
  </CardContent>
</Card>
```

#### Activity Feed
Real-time activity tracking with categorized events:

```typescript
// Activity types and their visual representation
const typeColors: Record<string, { bg: string; dot: string }> = {
  schedule_published: { bg: 'bg-green-50', dot: 'bg-green-500' },
  availability_submitted: { bg: 'bg-blue-50', dot: 'bg-blue-500' },
  employee_added: { bg: 'bg-orange-50', dot: 'bg-orange-500' },
  shift_assigned: { bg: 'bg-purple-50', dot: 'bg-purple-500' }
};

// Activity rendering logic
{recentActivity.slice(0, 4).map((activity, idx) => {
  const colors = typeColors[activity.type] || { bg: 'bg-gray-50', dot: 'bg-gray-500' };
  
  return (
    <div key={idx} className={`flex items-start gap-3 p-2 ${colors.bg} rounded-lg`}>
      <div className={`w-2 h-2 ${colors.dot} rounded-full mt-2`}></div>
      <div className="flex-1">
        <p className="text-xs font-medium">{activity.description}</p>
        <p className="text-xs text-muted-foreground">{activity.timeAgo}</p>
      </div>
    </div>
  );
})}
```

### Role-Based Dashboard Views

#### Admin Dashboard
- Full system overview
- All employee metrics
- Schedule management controls
- System administration tools

#### Crew Dashboard
- Personal schedule view
- Individual availability status
- Upcoming shifts
- Profile management

```typescript
// Role-based rendering logic
const renderCurrentView = () => {
  if (user?.role === 'admin') {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            schedule={schedule}
            employees={employees}
            onViewSchedule={() => setCurrentView('schedule')}
          />
        );
      // ... other admin views
    }
  }
  
  if (user?.role === 'crew') {
    switch (currentView) {
      case 'dashboard':
        return <CrewDashboard employeeId={user.id} />;
      // ... other crew views
    }
  }
};
```

### Performance Optimizations

#### Data Caching
```typescript
// Implement caching for frequently accessed data
const [cachedData, setCachedData] = useState<Map<string, any>>(new Map());

const getCachedData = (key: string, fetchFunction: () => Promise<any>) => {
  if (cachedData.has(key)) {
    return cachedData.get(key);
  }
  
  return fetchFunction().then(data => {
    setCachedData(prev => new Map(prev).set(key, data));
    return data;
  });
};
```

#### Lazy Loading
```typescript
// Lazy load non-critical dashboard components
const LazyMonthlyOverview = lazy(() => import('./MonthlyOverview'));
const LazyActivityFeed = lazy(() => import('./ActivityFeed'));

// Usage with Suspense
<Suspense fallback={<div>Loading...</div>}>
  <LazyMonthlyOverview data={monthlyOverview} />
</Suspense>
```

### Error Handling

#### Graceful Degradation
```typescript
// Handle API failures gracefully
const fetchDashboardData = async () => {
  try {
    const data = await dashboardService.getWeekSummary(currentWeekStart);
    setWeekSummary(data);
  } catch (error) {
    console.error('Failed to fetch week summary:', error);
    // Use fallback data or show error state
    setWeekSummary({
      totalShifts: 0,
      coveredShifts: 0,
      coverageRate: 0,
      conflicts: [],
      assignments: []
    });
  }
};
```

#### Loading States
```typescript
// Comprehensive loading state management
if (loading) {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Integration Points

#### Navigation Integration
```typescript
// Dashboard navigation to other modules
const handleViewSchedule = () => {
  setCurrentView('schedule');
};

const handleManageEmployees = () => {
  setCurrentView('employees');
};

const handleAvailabilityManagement = () => {
  setCurrentView('availability');
};
```

#### Real-time Updates
```typescript
// WebSocket integration for real-time updates
useEffect(() => {
  const ws = new WebSocket('ws://localhost:3001/dashboard');
  
  ws.onmessage = (event) => {
    const update = JSON.parse(event.data);
    
    switch (update.type) {
      case 'schedule_updated':
        fetchScheduleData();
        break;
      case 'employee_added':
        fetchEmployeeData();
        break;
      case 'availability_submitted':
        fetchAvailabilityData();
        break;
    }
  };
  
  return () => ws.close();
}, []);
```

## Best Practices

1. **Data Fetching**: Use parallel requests for independent data
2. **State Management**: Implement proper loading and error states
3. **Performance**: Cache frequently accessed data
4. **User Experience**: Provide immediate feedback for user actions
5. **Accessibility**: Ensure all metrics are screen reader accessible
6. **Responsive Design**: Adapt layout for different screen sizes

## Future Enhancements

1. **Real-time Notifications**: WebSocket integration for live updates
2. **Advanced Analytics**: Trend analysis and predictive insights
3. **Customizable Widgets**: User-configurable dashboard layout
4. **Export Functionality**: PDF/Excel export of dashboard data
5. **Mobile App**: Native mobile dashboard application