# Crew System Documentation

## Overview

The Crew System provides a dedicated interface for crew members to manage their personal schedules, submit availability, view upcoming shifts, and manage their profile. It offers a simplified, role-based experience focused on individual employee needs.

## Architecture

### Core Components

#### 1. Crew Dashboard (`CrewDashboard.tsx`)
**Location**: `frontend/src/features/crew/components/CrewDashboard.tsx`

**Purpose**: Personal dashboard for crew members showing their schedule overview and key metrics

**Key Features**:
- Personal shift statistics
- Today's shift display
- Weekly and monthly hours tracking
- Next shift preview
- Upcoming shifts calendar

#### 2. Crew Profile (`CrewProfile.tsx`)
**Location**: `frontend/src/features/crew/components/CrewProfile.tsx`

**Purpose**: Profile management interface for crew members

**Key Features**:
- Personal information display
- Station assignments view
- Password change functionality
- Security settings
- Logout capability

### Frontend Implementation

#### Crew Dashboard Logic

```typescript
export function CrewDashboard({ employeeId }: CrewDashboardProps) {
  const { profile, upcomingShifts, stats, loading, error } = useCrewData(employeeId);

  // Time formatting for 12-hour display
  const formatTo12Hour = (time: string): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Station formatting for display
  const formatStation = (station: any) => {
    if (Array.isArray(station)) {
      return station.join(', ');
    }
    if (typeof station === 'string') {
      return station.replace(/[\[\]"']/g, '').replace(/,/g, ', ');
    }
    return station || 'Not assigned';
  };

  // Calculate hours from shift data
  const calculateHoursFromShifts = (shifts: typeof upcomingShifts, startDate: Date, endDate: Date) => {
    return shifts
      .filter(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate >= startDate && shiftDate <= endDate;
      })
      .reduce((total, shift) => {
        if (shift.startTime && shift.endTime) {
          const start = new Date(`2000-01-01T${shift.startTime}`);
          const end = new Date(`2000-01-01T${shift.endTime}`);
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          return total + (hours > 0 ? hours : 0);
        }
        return total;
      }, 0);
  };

  // Week and month calculations
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Calculate actual hours
  const actualWeeklyHours = Math.round(calculateHoursFromShifts(upcomingShifts, startOfWeek, endOfWeek) * 10) / 10;
  const actualMonthlyHours = Math.round(calculateHoursFromShifts(upcomingShifts, startOfMonth, endOfMonth) * 10) / 10;
  const upcomingShiftsCount = upcomingShifts.filter(shift => new Date(shift.date) > now).length;

  // Filter today's shifts
  const todayShifts = upcomingShifts.filter(shift =>
    shift.date === new Date().toISOString().split('T')[0]
  );

  // Find next upcoming shift
  const nextShift = upcomingShifts.find(shift =>
    new Date(shift.date) > new Date()
  );
}
```

#### Dashboard Metrics Cards

```typescript
// Quick stats display with visual indicators
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Today's Shifts Card */}
  <Card className="shadow-md border border-slate-200 bg-white hover:shadow-lg transition-all duration-200">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <CardTitle className="text-base font-semibold text-slate-700">Today's Shifts</CardTitle>
      <div className="p-2 bg-slate-100 rounded-lg">
        <CalendarDays className="h-5 w-5 text-slate-600" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-slate-800 mb-1">{todayShifts.length}</div>
      <p className="text-sm font-medium text-slate-600">
        {todayShifts.length > 0 ? 'Scheduled today' : 'No shifts today'}
      </p>
    </CardContent>
  </Card>

  {/* Weekly Hours Card */}
  <Card className="shadow-md border border-slate-200 bg-white hover:shadow-lg transition-all duration-200">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <CardTitle className="text-base font-semibold text-slate-700">This Week Hours</CardTitle>
      <div className="p-2 bg-emerald-100 rounded-lg">
        <Clock className="h-5 w-5 text-emerald-600" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-slate-800 mb-1">{actualWeeklyHours}h</div>
      <p className="text-sm font-medium text-slate-600">
        of {profile?.maxHoursPerWeek || 40}h target
      </p>
    </CardContent>
  </Card>

  {/* Upcoming Shifts Card */}
  <Card className="shadow-md border border-slate-200 bg-white hover:shadow-lg transition-all duration-200">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <CardTitle className="text-base font-semibold text-slate-700">Upcoming Shifts</CardTitle>
      <div className="p-2 bg-blue-100 rounded-lg">
        <TrendingUp className="h-5 w-5 text-blue-600" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-slate-800 mb-1">{upcomingShiftsCount}</div>
      <p className="text-sm font-medium text-slate-600">Next 2 weeks</p>
    </CardContent>
  </Card>

  {/* Monthly Hours Card */}
  <Card className="shadow-md border border-slate-200 bg-white hover:shadow-lg transition-all duration-200">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <CardTitle className="text-base font-semibold text-slate-700">Monthly Hours</CardTitle>
      <div className="p-2 bg-amber-100 rounded-lg">
        <TrendingUp className="h-5 w-5 text-amber-600" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-slate-800 mb-1">{actualMonthlyHours}h</div>
      <p className="text-sm font-medium text-slate-600">This month's total</p>
    </CardContent>
  </Card>
</div>
```

#### Next Shift Preview

```typescript
// Next shift alert with detailed information
{nextShift && (
  <Card className="shadow-lg border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
    <CardHeader className="pb-4">
      <CardTitle className="flex items-center gap-3 text-xl text-slate-800">
        <div className="p-2 bg-emerald-100 rounded-lg">
          <CheckCircle className="h-6 w-6 text-emerald-600" />
        </div>
        Your Next Shift
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xl font-bold text-slate-800">{nextShift.title}</p>
          <div className="flex items-center gap-2 text-slate-600">
            <CalendarDays className="h-4 w-4" />
            <span className="font-medium">
              {new Date(nextShift.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Clock className="h-4 w-4" />
            <span className="font-medium">
              {formatTo12Hour(nextShift.startTime)} - {formatTo12Hour(nextShift.endTime)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600">Station:</span>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {formatStation(nextShift.station)}
            </Badge>
          </div>
        </div>
        <Badge 
          variant={nextShift.status === 'confirmed' ? 'default' : 'secondary'}
          className={`text-base px-4 py-2 ${
            nextShift.status === 'confirmed' 
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600' 
              : 'bg-slate-100 text-slate-700 border-slate-300'
          }`}
        >
          {nextShift.status}
        </Badge>
      </div>
    </CardContent>
  </Card>
)}
```

### Crew Profile Management

#### Profile Information Display

```typescript
export function CrewProfile({ profile, stats, employeeId, upcomingShifts = [] }: CrewProfileProps) {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Station icon mapping
  const getStationIcon = (station: string | undefined) => {
    if (!station) return MapPin;

    const stationStr = typeof station === 'string' ? station : String(station);
    const stationLower = stationStr.toLowerCase();

    // Kitchen stations
    if (stationLower.includes('grill') || stationLower.includes('prep') ||
        stationLower.includes('fry') || stationLower.includes('salad') ||
        stationLower.includes('dish') || stationLower.includes('batch') ||
        stationLower.includes('prepping')) {
      return ChefHat;
    }

    return MapPin; // Default icon
  };

  // Profile details grid
  <div className="grid gap-4">
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
      <div className="flex items-center gap-3">
        <User className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Name</span>
      </div>
      <span className="font-semibold text-gray-900">{profile.name}</span>
    </div>

    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
      <div className="flex items-center gap-3">
        <Mail className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Email</span>
      </div>
      <span className="text-gray-900">{profile.email}</span>
    </div>

    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
      <div className="flex items-center gap-3">
        <Building2 className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Department</span>
      </div>
      <Badge variant="outline" className="font-medium">{profile.department}</Badge>
    </div>

    {/* Station assignments with icons */}
    <div className="p-4 bg-white rounded-lg border border-gray-100">
      <div className="flex items-center gap-3 mb-3">
        <MapPin className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Assigned Stations</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {profile.stations && profile.stations.length > 0 ? (
          profile.stations.map((station, index) => (
            <div key={index} className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-200">
              {React.createElement(getStationIcon(station), { className: "w-3 h-3 text-blue-600" })}
              <span className="text-sm font-medium text-blue-700">{station}</span>
            </div>
          ))
        ) : (
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-200">
            <MapPin className="w-3 h-3 text-gray-500" />
            <span className="text-sm text-gray-600">Not assigned</span>
          </div>
        )}
      </div>
    </div>
  </div>
}
```

#### Password Change Functionality

```typescript
// Password change form with validation
const handlePasswordChange = async (e: React.FormEvent) => {
  e.preventDefault();
  setPasswordError('');
  setPasswordSuccess('');
  setIsLoading(true);

  try {
    const result = await authService.changePassword(passwordForm);
    setPasswordSuccess(result.message);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordForm(false);
  } catch (error) {
    setPasswordError(error instanceof Error ? error.message : 'Failed to change password');
  } finally {
    setIsLoading(false);
  }
};

// Password form with show/hide functionality
{showPasswordForm && (
  <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
    <form onSubmit={handlePasswordChange} className="space-y-4">
      <div>
        <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
          Current Password
        </Label>
        <div className="relative mt-1">
          <Input
            id="currentPassword"
            type={showCurrentPassword ? "text" : "password"}
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
            required
            className="pr-12 h-11"
            placeholder="Enter your current password"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1 h-9 w-9 p-0 hover:bg-gray-100"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
          >
            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
          New Password
        </Label>
        <div className="relative mt-1">
          <Input
            id="newPassword"
            type={showNewPassword ? "text" : "password"}
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
            required
            minLength={8}
            className="pr-12 h-11"
            placeholder="Enter your new password (min 8 characters)"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1 h-9 w-9 p-0 hover:bg-gray-100"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
          Confirm New Password
        </Label>
        <div className="relative mt-1">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
            required
            minLength={8}
            className="pr-12 h-11"
            placeholder="Confirm your new password"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1 h-9 w-9 p-0 hover:bg-gray-100"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Error and success messages */}
      {passwordError && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-700">{passwordError}</AlertDescription>
        </Alert>
      )}

      {passwordSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-700">{passwordSuccess}</AlertDescription>
        </Alert>
      )}

      {/* Form actions */}
      <div className="flex gap-3 pt-2">
        <Button 
          type="submit" 
          disabled={isLoading} 
          className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
        >
          {isLoading ? 'Updating...' : 'Update Password'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 px-6 border-2 hover:bg-gray-50"
          onClick={() => {
            setShowPasswordForm(false);
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setPasswordError('');
            setPasswordSuccess('');
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  </div>
)}
```

### Backend Implementation

#### Crew Service (`crewService.js`)

```javascript
class CrewService {
  async getProfile(employeeId) {
    try {
      const query = `
        SELECT
          id,
          name,
          email,
          department,
          station,
          maxHoursPerWeek,
          currentWeeklyHours,
          role
        FROM employees
        WHERE id = ?
      `;

      const [rows] = await db.execute(query, [employeeId]);

      if (rows.length === 0) {
        throw new Error('Employee not found');
      }

      const profile = rows[0];

      // Parse station data - handle multiple formats
      if (profile.station) {
        if (Array.isArray(profile.station)) {
          // Already parsed by MySQL driver
          profile.stations = profile.station;
          delete profile.station;
        } else if (typeof profile.station === 'string') {
          try {
            // Try to parse as JSON
            const parsedStation = JSON.parse(profile.station);
            if (Array.isArray(parsedStation)) {
              profile.stations = parsedStation;
              delete profile.station;
            } else {
              profile.stations = [parsedStation];
              delete profile.station;
            }
          } catch (e) {
            // If JSON parsing fails, treat as comma-separated string
            if (profile.station.includes(',')) {
              profile.stations = profile.station.split(',').map(s => s.trim()).filter(s => s.length > 0);
            } else {
              profile.stations = [profile.station];
            }
            delete profile.station;
          }
        } else {
          // Fallback for other types
          profile.stations = [String(profile.station)];
          delete profile.station;
        }
      } else {
        profile.stations = [];
      }

      return profile;
    } catch (error) {
      console.error('Error in getProfile:', error);
      throw error;
    }
  }

  async getUpcomingShifts(employeeId) {
    try {
      const query = `
        SELECT
          fs.shift_id as id,
          fs.date_schedule as date,
          s.startTime,
          s.endTime,
          fs.required_stations as station,
          'scheduled' as status
        FROM final_schedule fs
        JOIN shifts s ON fs.shift_id = s.id
        WHERE fs.employee_id = ?
          AND fs.date_schedule >= CURDATE()
        ORDER BY fs.date_schedule ASC, s.startTime ASC
        LIMIT 10
      `;

      const [rows] = await db.execute(query, [employeeId]);
      return rows;
    } catch (error) {
      console.error('Error in getUpcomingShifts:', error);
      throw error;
    }
  }

  async getStats(employeeId) {
    try {
      // Get current week stats from final_schedule table
      const currentWeekQuery = `
        SELECT
          COUNT(*) as totalShifts,
          SUM(TIMESTAMPDIFF(HOUR, startTime, endTime)) as totalHours,
          SUM(CASE WHEN time_out IS NOT NULL THEN 1 ELSE 0 END) as completedShifts
        FROM final_schedule fs
        JOIN shifts s ON fs.shift_id = s.id
        WHERE fs.employee_id = ?
          AND YEARWEEK(fs.date_schedule, 1) = YEARWEEK(CURDATE(), 1)
      `;

      const [currentWeekRows] = await db.execute(currentWeekQuery, [employeeId]);
      const currentWeek = currentWeekRows[0];

      // Get next week stats from final_schedule table
      const nextWeekQuery = `
        SELECT
          COUNT(*) as totalShifts,
          SUM(TIMESTAMPDIFF(HOUR, startTime, endTime)) as totalHours
        FROM final_schedule fs
        JOIN shifts s ON fs.shift_id = s.id
        WHERE fs.employee_id = ?
          AND YEARWEEK(fs.date_schedule, 1) = YEARWEEK(DATE_ADD(CURDATE(), INTERVAL 1 WEEK), 1)
      `;

      const [nextWeekRows] = await db.execute(nextWeekQuery, [employeeId]);
      const nextWeek = nextWeekRows[0];

      return {
        currentWeek: {
          shifts: currentWeek.totalShifts || 0,
          hours: currentWeek.totalHours || 0,
          completedShifts: currentWeek.completedShifts || 0
        },
        nextWeek: {
          shifts: nextWeek.totalShifts || 0,
          hours: nextWeek.totalHours || 0
        }
      };
    } catch (error) {
      console.error('Error in getStats:', error);
      throw error;
    }
  }
}
```

### Data Hooks (`useCrewData.ts`)

```typescript
export function useCrewData(employeeId: string) {
  const [profile, setProfile] = useState<CrewProfile | null>(null);
  const [upcomingShifts, setUpcomingShifts] = useState<CrewShift[]>([]);
  const [stats, setStats] = useState<CrewStats | null>(null);
  const [availability, setAvailability] = useState<CrewAvailability | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<{ isLocked: boolean; submissionRate: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      const data = await crewService.getProfile(employeeId);
      setProfile(data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load profile');
    }
  };

  const fetchUpcomingShifts = async () => {
    try {
      const data = await crewService.getUpcomingShifts(employeeId);
      setUpcomingShifts(data);
    } catch (err) {
      console.error('Failed to fetch upcoming shifts:', err);
      setError('Failed to load shifts');
    }
  };

  const fetchStats = async () => {
    try {
      const data = await crewService.getStats(employeeId);
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError('Failed to load stats');
    }
  };

  const fetchAvailability = async (weekStart: string) => {
    try {
      const data = await crewService.getAvailability(employeeId, weekStart);
      setAvailability(data);

      // Also fetch availability status for lock checking
      const status = await crewService.getAvailabilityStatus(employeeId, weekStart);
      setAvailabilityStatus(status);
    } catch (err) {
      console.error('Failed to fetch availability:', err);
      setError('Failed to load availability');
    }
  };

  const submitAvailability = async (availabilityData: Omit<CrewAvailability, 'id' | 'submittedAt'>) => {
    try {
      // Check if availability is locked before submitting
      const status = await crewService.getAvailabilityStatus(employeeId, availabilityData.weekStart);
      if (status.isLocked) {
        throw new Error('Availability submissions are locked for this week');
      }

      const data = await crewService.submitAvailability(employeeId, availabilityData);
      setAvailability(data);
      return data;
    } catch (err) {
      console.error('Failed to submit availability:', err);
      throw err;
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);

      await Promise.all([
        fetchProfile(),
        fetchUpcomingShifts(),
        fetchStats(),
      ]);

      setLoading(false);
    };

    if (employeeId) {
      fetchAllData();
    }
  }, [employeeId]);

  return {
    profile,
    upcomingShifts,
    stats,
    availability,
    availabilityStatus,
    loading,
    error,
    fetchAvailability,
    submitAvailability,
    updateAvailability,
    refetch: () => {
      fetchProfile();
      fetchUpcomingShifts();
      fetchStats();
    }
  };
}
```

### Data Types and Interfaces

```typescript
// Crew-specific data types
interface CrewProfile {
  id: number;
  name: string;
  email: string;
  department: string;
  stations: string[];
  maxHoursPerWeek: number;
  currentWeeklyHours: number;
  role: string;
}

interface CrewShift {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  station: string | string[];
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}

interface CrewStats {
  currentWeek: {
    shifts: number;
    hours: number;
    completedShifts: number;
  };
  nextWeek: {
    shifts: number;
    hours: number;
  };
}

interface CrewAvailability {
  id: string;
  employeeId: string;
  weekStart: string;
  availability: Record<string, {
    available: boolean;
    preferredStart?: string;
    preferredEnd?: string;
  }>;
  submittedAt: string;
}
```

### Security and Access Control

#### Role-Based Access
```typescript
// Ensure crew members can only access their own data
const validateCrewAccess = (requestedEmployeeId: string, userEmployeeId: string, userRole: string) => {
  if (userRole === 'admin') {
    return true; // Admins can access any employee data
  }
  
  if (userRole === 'crew' && requestedEmployeeId === userEmployeeId) {
    return true; // Crew can access their own data
  }
  
  throw new Error('Access denied: You can only view your own information');
};
```

#### Data Privacy
```typescript
// Filter sensitive data for crew members
const filterCrewData = (data: any, userRole: string) => {
  if (userRole === 'crew') {
    // Remove sensitive fields that crew shouldn't see
    const { salary, performanceReviews, adminNotes, ...publicData } = data;
    return publicData;
  }
  
  return data; // Admins see all data
};
```

## Best Practices

1. **User Experience**: Simplified interface focused on crew needs
2. **Security**: Role-based access control and data filtering
3. **Performance**: Efficient data loading and caching
4. **Mobile-First**: Responsive design for mobile devices
5. **Real-time Updates**: Live data synchronization
6. **Error Handling**: Graceful error states and recovery

## Future Enhancements

1. **Mobile App**: Native mobile application for crew members
2. **Push Notifications**: Shift reminders and updates
3. **Time Tracking**: Clock in/out functionality
4. **Shift Swapping**: Peer-to-peer shift exchanges
5. **Performance Metrics**: Individual performance tracking
6. **Communication**: In-app messaging and announcements