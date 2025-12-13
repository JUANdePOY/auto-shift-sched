# Availability System Documentation

## Overview

The Availability System manages employee availability submissions, tracks submission status, and provides administrators with comprehensive tools to view, edit, and lock availability data for scheduling purposes.

## Architecture

### Core Components

#### 1. Availability Panel (`AvailabilityPanel.tsx`)
**Location**: `frontend/src/features/availability/components/AvailabilityPanel.tsx`

**Purpose**: Administrative interface for managing employee availability across the organization

**Key Features**:
- Weekly availability calendar view
- Department and status filtering
- Real-time submission tracking
- Admin editing capabilities
- Availability locking mechanism
- Interactive availability grid

#### 2. Availability Service (`availabilityService.js`)
**Location**: `server/features/availability/services/availabilityService.js`

**Purpose**: Backend service handling availability data operations

**Key Responsibilities**:
- Availability submission processing
- Status tracking and validation
- Administrative override capabilities
- Submission locking mechanism
- Data aggregation and reporting

### Frontend Implementation

#### Main Component Logic

```typescript
const AvailabilityPanel: React.FC<AvailabilityPanelProps> = ({ initialWeekStart }) => {
  // State management for availability data
  const [weekStart, setWeekStart] = useState<string>(getMondayOfWeek(initialWeekStart || getCurrentWeekStart()));
  const [allSubmissions, setAllSubmissions] = useState<AdminAvailabilitySubmission[]>([]);
  const [status, setStatus] = useState<AvailabilityStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtering and editing state
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [editingSubmission, setEditingSubmission] = useState<AdminAvailabilitySubmission | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editAvailability, setEditAvailability] = useState<Record<string, AvailabilityDay>>({});

  // Load data when week changes
  useEffect(() => {
    loadAllSubmissions();
    loadStatus();
  }, [weekStart]);

  // Load departments for filtering
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const deps = await getAllDepartments();
        setDepartments(deps);
      } catch (error) {
        console.error('Error loading departments:', error);
      }
    };
    loadDepartments();
  }, []);
};
```

#### Week Navigation Logic

```typescript
// Week calculation utilities
const getMondayOfWeek = (dateString: string) => {
  const date = new Date(dateString);
  const dayOfWeek = date.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const day = String(monday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCurrentWeekStart = () => {
  return getMondayOfWeek(getCurrentDate());
};

// Week navigation handlers
const goToPreviousWeek = () => {
  const current = new Date(weekStart);
  current.setDate(current.getDate() - 7);
  const newWeekStart = getMondayOfWeek(current.toISOString().split('T')[0]);
  setWeekStart(newWeekStart);
};

const goToNextWeek = () => {
  const current = new Date(weekStart);
  current.setDate(current.getDate() + 7);
  const newWeekStart = getMondayOfWeek(current.toISOString().split('T')[0]);
  setWeekStart(newWeekStart);
};

// Date picker handler
const handleWeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const selectedDate = e.target.value;
  const mondayOfWeek = getMondayOfWeek(selectedDate);
  setWeekStart(mondayOfWeek);
};
```

#### Data Loading and Management

```typescript
// Load all availability submissions for the week
const loadAllSubmissions = async () => {
  setLoading(true);
  setError(null);
  try {
    const submissions = await availabilityService.getWeeklySubmissions(weekStart);
    setAllSubmissions(submissions);
  } catch (error) {
    console.error('Error loading submissions:', error);
    setError('Failed to load availability submissions');
    toast.error('Failed to load availability submissions');
  } finally {
    setLoading(false);
  }
};

// Load availability status for the week
const loadStatus = async () => {
  try {
    const statusData = await availabilityService.getAvailabilityStatus(weekStart);
    setStatus(statusData);
  } catch (error) {
    console.error('Error loading status:', error);
  }
};

// Handle availability locking
const handleLockSubmissions = async () => {
  try {
    await availabilityService.lockAvailability(weekStart);
    toast.success('Availability submissions locked successfully');
    loadStatus();
    loadAllSubmissions();
  } catch (error) {
    console.error('Error locking submissions:', error);
    toast.error('Failed to lock availability submissions');
  }
};
```

#### Filtering Logic

```typescript
// Filter submissions based on selected criteria
const filteredSubmissions = allSubmissions.filter(submission => {
  const matchesDepartment = selectedDepartment === 'all' || submission.department === selectedDepartment;
  const matchesStatus = selectedStatus === 'all' ||
    (selectedStatus === 'submitted' && submission.status === 'submitted') ||
    (selectedStatus === 'not_submitted' && submission.status === 'not_submitted') ||
    (selectedStatus === 'locked' && submission.status === 'locked');
  return matchesDepartment && matchesStatus;
});
```

#### Availability Grid Rendering

```typescript
// Render the availability calendar grid
<div className="grid grid-cols-[min-content_min-content_repeat(7,1fr)] gap-1 min-w-max">
  {/* Day Headers */}
  <div className="font-semibold text-center p-2 bg-muted"></div>
  <div className="font-semibold text-center p-2 bg-muted border border-border">Status</div>
  {dayNames.map((day) => (
    <div key={day} className="font-semibold text-center p-2 bg-muted border border-border">
      {day}
    </div>
  ))}

  {/* Employee Rows */}
  {filteredSubmissions.map((submission) => (
    <React.Fragment key={submission.employeeId}>
      {/* Employee Name and Department */}
      <div className="p-2 font-medium border border-border bg-muted/50 whitespace-nowrap">
        {submission.employeeName}
        <div className="text-xs text-muted-foreground">
          {submission.department}
        </div>
      </div>
      
      {/* Submission Status Badge */}
      <div className="p-2 border border-border bg-muted/50 flex items-center justify-center">
        <Badge variant={submission.status === 'locked' ? 'destructive' : 
                      submission.status === 'not_submitted' ? 'secondary' : 'default'}>
          {submission.status === 'locked' ? 'Locked' : 
           submission.status === 'not_submitted' ? 'Not Submitted' : 'Submitted'}
        </Badge>
      </div>
      
      {/* Daily Availability Cells */}
      {daysOfWeek.map((day) => {
        const dayAvail = submission.availability[day];
        const isAvailable = dayAvail?.available || false;
        const start = dayAvail?.startTime || dayAvail?.preferredStart;
        const end = dayAvail?.endTime || dayAvail?.preferredEnd;
        const timeDisplay = start && end ? 
          `${formatTimeToAMPM(start)} - ${formatTimeToAMPM(end)}` : 
          start ? `${formatTimeToAMPM(start)} onwards` : 
          end ? `until ${formatTimeToAMPM(end)}` : 'Anytime';
        
        const cellClass = isAvailable
          ? 'bg-green-100 border-green-300 hover:bg-green-200'
          : 'bg-destructive/10 border-destructive/30 hover:bg-destructive/20';
          
        return (
          <div
            key={day}
            className={`p-1 border text-center cursor-pointer transition-colors ${cellClass}`}
            onClick={() => handleEdit(submission)}
            title={isAvailable ? timeDisplay : 'Unavailable - Click to edit'}
          >
            {isAvailable ? (
              <div className="flex flex-col items-center gap-0.5">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-xs text-green-700 leading-tight whitespace-nowrap">
                  {timeDisplay}
                </span>
              </div>
            ) : (
              <XCircle className="w-4 h-4 text-destructive mx-auto" />
            )}
          </div>
        );
      })}
    </React.Fragment>
  ))}
</div>
```

#### Time Formatting Utilities

```typescript
// Format 24-hour time to 12-hour AM/PM format
const formatTimeToAMPM = (time: string) => {
  if (!time) return time;
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};
```

### Administrative Editing System

#### Edit Modal Implementation

```typescript
// Handle editing availability for an employee
const handleEdit = (submission: AdminAvailabilitySubmission) => {
  setEditingSubmission(submission);

  // Initialize edit state from current availability
  const initialEditAvailability: Record<string, AvailabilityDay> = {};

  daysOfWeek.forEach((dayKey) => {
    const dayAvail = submission.availability[dayKey];
    const isAvailable = dayAvail?.available || false;
    const hasTimes = dayAvail?.preferredStart || dayAvail?.preferredEnd;
    
    let type: 'not_available' | 'anytime' | 'specific';
    if (!isAvailable) {
      type = 'not_available';
    } else if (!hasTimes) {
      type = 'anytime';
    } else {
      type = 'specific';
    }

    initialEditAvailability[dayKey] = {
      type,
      preferredStart: dayAvail?.preferredStart || '',
      preferredEnd: dayAvail?.preferredEnd || ''
    };
  });

  setEditAvailability(initialEditAvailability);
  setActiveEditTab('monday');
  setIsEditModalOpen(true);
};

// Save edited availability
const handleSaveEdit = async () => {
  if (!editingSubmission) return;

  // Convert edit state to API format
  const availability: Record<string, { available: boolean; preferredStart?: string; preferredEnd?: string }> = {};
  
  Object.entries(editAvailability).forEach(([dayKey, dayAvail]) => {
    const available = dayAvail.type !== 'not_available';
    availability[dayKey] = {
      available,
      ...(available && dayAvail.type === 'specific' && {
        preferredStart: dayAvail.preferredStart && dayAvail.preferredStart.trim() ? dayAvail.preferredStart : undefined,
        preferredEnd: dayAvail.preferredEnd && dayAvail.preferredEnd.trim() ? dayAvail.preferredEnd : undefined
      })
    };
  });

  setIsSaving(true);
  try {
    await availabilityService.adminSubmitAvailability(editingSubmission.employeeId, weekStart, availability);
    toast.success('Availability updated successfully for all days');
    loadAllSubmissions();
    setIsEditModalOpen(false);
  } catch (error) {
    console.error('Error updating availability:', error);
    toast.error('Failed to update availability');
  } finally {
    setIsSaving(false);
  }
};
```

#### Tabbed Day Editor

```typescript
// Render tabbed interface for editing each day
<Tabs value={activeEditTab} onValueChange={setActiveEditTab} className="w-full">
  <TabsList className="grid grid-cols-7 w-full h-auto gap-1 p-1 bg-muted">
    {daysOfWeek.map((day) => (
      <TabsTrigger 
        key={day} 
        value={day}
        className="text-xs px-2 py-1.5 data-[state=active]:bg-white"
      >
        {day.slice(0, 3).toUpperCase()}
      </TabsTrigger>
    ))}
  </TabsList>

  {/* Day Content */}
  {daysOfWeek.map((dayKey) => {
    const dayAvail = editAvailability[dayKey];
    const dayIndex = daysOfWeek.indexOf(dayKey);

    return (
      <TabsContent key={dayKey} value={dayKey} className="space-y-4 mt-4">
        <h3 className="font-semibold text-lg">{dayNames[dayIndex]}</h3>
        
        {/* Availability Type Buttons */}
        <div className="grid grid-cols-3 gap-3">
          {/* Not Available Button */}
          <Button
            type="button"
            variant={dayAvail.type === 'not_available' ? 'destructive' : 'outline'}
            className={`h-auto p-4 flex flex-col items-center gap-2 transition-all ${
              dayAvail.type === 'not_available' 
                ? 'ring-2 ring-destructive/20 shadow-md' 
                : 'hover:bg-destructive/5 hover:border-destructive/30'
            }`}
            onClick={() => setEditAvailability(prev => ({
              ...prev,
              [dayKey]: { ...prev[dayKey], type: 'not_available' }
            }))}
          >
            <XCircle className={`w-6 h-6 ${
              dayAvail.type === 'not_available' ? 'text-white' : 'text-destructive'
            }`} />
            <div className="text-center">
              <div className="font-medium text-sm">Not Available</div>
              <div className={`text-xs ${
                dayAvail.type === 'not_available' ? 'text-white/80' : 'text-muted-foreground'
              }`}>
                Won't work
              </div>
            </div>
          </Button>

          {/* Available Anytime Button */}
          <Button
            type="button"
            variant={dayAvail.type === 'anytime' ? 'default' : 'outline'}
            className={`h-auto p-4 flex flex-col items-center gap-2 transition-all ${
              dayAvail.type === 'anytime' 
                ? 'ring-2 ring-primary/20 shadow-md bg-green-600 hover:bg-green-700' 
                : 'hover:bg-green-50 hover:border-green-300'
            }`}
            onClick={() => setEditAvailability(prev => ({
              ...prev,
              [dayKey]: { ...prev[dayKey], type: 'anytime' }
            }))}
          >
            <CheckCircle className={`w-6 h-6 ${
              dayAvail.type === 'anytime' ? 'text-white' : 'text-green-600'
            }`} />
            <div className="text-center">
              <div className="font-medium text-sm">Available Anytime</div>
              <div className={`text-xs ${
                dayAvail.type === 'anytime' ? 'text-white/80' : 'text-muted-foreground'
              }`}>
                Flexible hours
              </div>
            </div>
          </Button>

          {/* Specific Times Button */}
          <Button
            type="button"
            variant={dayAvail.type === 'specific' ? 'default' : 'outline'}
            className={`h-auto p-4 flex flex-col items-center gap-2 transition-all ${
              dayAvail.type === 'specific' 
                ? 'ring-2 ring-primary/20 shadow-md bg-blue-600 hover:bg-blue-700' 
                : 'hover:bg-blue-50 hover:border-blue-300'
            }`}
            onClick={() => setEditAvailability(prev => ({
              ...prev,
              [dayKey]: { ...prev[dayKey], type: 'specific' }
            }))}
          >
            <Clock className={`w-6 h-6 ${
              dayAvail.type === 'specific' ? 'text-white' : 'text-blue-600'
            }`} />
            <div className="text-center">
              <div className="font-medium text-sm">Specific Times</div>
              <div className={`text-xs ${
                dayAvail.type === 'specific' ? 'text-white/80' : 'text-muted-foreground'
              }`}>
                Set hours
              </div>
            </div>
          </Button>
        </div>

        {/* Time Inputs for Specific Times */}
        {dayAvail.type === 'specific' && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`${dayKey}-start`} className="text-sm font-medium text-blue-900 block mb-2">
                  Start Time
                </Label>
                <Input
                  id={`${dayKey}-start`}
                  type="time"
                  value={dayAvail.preferredStart || ''}
                  onChange={(e) => setEditAvailability(prev => ({
                    ...prev,
                    [dayKey]: { ...prev[dayKey], preferredStart: e.target.value || '' }
                  }))}
                  className="h-10 border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor={`${dayKey}-end`} className="text-sm font-medium text-blue-900 block mb-2">
                  End Time
                </Label>
                <Input
                  id={`${dayKey}-end`}
                  type="time"
                  value={dayAvail.preferredEnd || ''}
                  onChange={(e) => setEditAvailability(prev => ({
                    ...prev,
                    [dayKey]: { ...prev[dayKey], preferredEnd: e.target.value || '' }
                  }))}
                  className="h-10 border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </TabsContent>
    );
  })}
</Tabs>
```

### Backend Service Implementation

#### Availability Service (`availabilityService.js`)

```javascript
class AvailabilityService {
  // Get weekly submissions for admin view
  async getWeeklySubmissions(weekStart) {
    const query = `
      SELECT 
        e.id as employeeId,
        e.name as employeeName,
        e.department,
        COALESCE(a.availability, e.availability) as availability,
        CASE 
          WHEN al.week_start IS NOT NULL THEN 'locked'
          WHEN a.id IS NOT NULL THEN 'submitted'
          ELSE 'not_submitted'
        END as status,
        a.submitted_at,
        al.locked_at
      FROM employees e
      LEFT JOIN availability_submissions a ON e.id = a.employee_id AND a.week_start = ?
      LEFT JOIN availability_locks al ON al.week_start = ?
      WHERE e.role != 'admin' OR e.role IS NULL
      ORDER BY e.department, e.name
    `;
    
    const [results] = await db.query(query, [weekStart, weekStart]);
    
    return results.map(row => ({
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      department: row.department,
      availability: typeof row.availability === 'string' 
        ? JSON.parse(row.availability) 
        : row.availability,
      status: row.status,
      submittedAt: row.submitted_at,
      lockedAt: row.locked_at
    }));
  }

  // Get availability status for a week
  async getAvailabilityStatus(weekStart) {
    const [totalEmployees] = await db.query(
      'SELECT COUNT(*) as count FROM employees WHERE role != ? OR role IS NULL',
      ['admin']
    );
    
    const [submissions] = await db.query(
      'SELECT COUNT(*) as count FROM availability_submissions WHERE week_start = ?',
      [weekStart]
    );
    
    const [lockStatus] = await db.query(
      'SELECT * FROM availability_locks WHERE week_start = ?',
      [weekStart]
    );
    
    const total = totalEmployees[0].count;
    const submitted = submissions[0].count;
    const submissionRate = total > 0 ? Math.round((submitted / total) * 100) : 0;
    
    return {
      totalEmployees: total,
      submissions: submitted,
      submissionRate,
      locked: lockStatus.length > 0,
      lockedAt: lockStatus.length > 0 ? lockStatus[0].locked_at : null
    };
  }

  // Admin submit availability for employee
  async adminSubmitAvailability(employeeId, weekStart, availability) {
    const connection = await db.promise().getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Check if submission already exists
      const [existing] = await connection.query(
        'SELECT id FROM availability_submissions WHERE employee_id = ? AND week_start = ?',
        [employeeId, weekStart]
      );
      
      if (existing.length > 0) {
        // Update existing submission
        await connection.query(
          'UPDATE availability_submissions SET availability = ?, submitted_at = NOW() WHERE employee_id = ? AND week_start = ?',
          [JSON.stringify(availability), employeeId, weekStart]
        );
      } else {
        // Create new submission
        await connection.query(
          'INSERT INTO availability_submissions (employee_id, week_start, availability, submitted_at) VALUES (?, ?, ?, NOW())',
          [employeeId, weekStart, JSON.stringify(availability)]
        );
      }
      
      await connection.commit();
      
      return {
        success: true,
        message: 'Availability updated successfully'
      };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Lock availability submissions for a week
  async lockAvailability(weekStart) {
    const [existing] = await db.query(
      'SELECT id FROM availability_locks WHERE week_start = ?',
      [weekStart]
    );
    
    if (existing.length > 0) {
      throw new Error('Availability is already locked for this week');
    }
    
    await db.query(
      'INSERT INTO availability_locks (week_start, locked_at) VALUES (?, NOW())',
      [weekStart]
    );
    
    return {
      success: true,
      message: 'Availability submissions locked successfully'
    };
  }

  // Get individual employee availability
  async getAvailability(employeeId, weekStart) {
    const [results] = await db.query(
      'SELECT * FROM availability_submissions WHERE employee_id = ? AND week_start = ?',
      [employeeId, weekStart]
    );
    
    if (results.length === 0) {
      return null;
    }
    
    const submission = results[0];
    return {
      id: submission.id,
      employeeId: submission.employee_id,
      weekStart: submission.week_start,
      availability: typeof submission.availability === 'string' 
        ? JSON.parse(submission.availability) 
        : submission.availability,
      submittedAt: submission.submitted_at
    };
  }
}
```

### Data Types and Interfaces

```typescript
// Availability data types
interface AvailabilityDay {
  type: 'not_available' | 'anytime' | 'specific';
  preferredStart?: string;
  preferredEnd?: string;
}

interface AdminAvailabilitySubmission {
  employeeId: number;
  employeeName: string;
  department: string;
  availability: Record<string, {
    available: boolean;
    preferredStart?: string;
    preferredEnd?: string;
    startTime?: string;
    endTime?: string;
  }>;
  status: 'submitted' | 'not_submitted' | 'locked';
  submittedAt?: string;
  lockedAt?: string;
}

interface AvailabilityStatus {
  totalEmployees: number;
  submissions: number;
  submissionRate: number;
  locked: boolean;
  lockedAt?: string;
}
```

### Database Schema

```sql
-- Availability submissions table
CREATE TABLE availability_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  week_start DATE NOT NULL,
  availability JSON NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  UNIQUE KEY unique_employee_week (employee_id, week_start)
);

-- Availability locks table
CREATE TABLE availability_locks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  week_start DATE NOT NULL UNIQUE,
  locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_availability_week ON availability_submissions(week_start);
CREATE INDEX idx_availability_employee ON availability_submissions(employee_id);
CREATE INDEX idx_locks_week ON availability_locks(week_start);
```

### Integration with Scheduling System

#### Availability Fetching in Scheduler

```javascript
// Integration point in scheduler.js
async getEmployees(startDate) {
  const [results] = await db.query('SELECT * FROM employees');
  const employees = results.map(employee => formatEmployee(employee));

  // Calculate week start for availability lookup
  const weekStartStr = this.getWeekStart(startDate);

  // Fetch submitted availability for each employee for this week
  for (const employee of employees) {
    try {
      const availabilityService = require('../../availability/services/availabilityService');
      const submittedAvailability = await availabilityService.getAvailability(employee.id, weekStartStr);

      // Override default availability with submitted availability if available
      if (submittedAvailability && submittedAvailability.availability) {
        employee.availability = submittedAvailability.availability;
      }
    } catch (error) {
      console.warn(`Could not fetch availability for employee ${employee.id}, using default:`, error.message);
      // Keep default availability from employee record
    }
  }

  return employees;
}
```

## Best Practices

1. **Data Validation**: Validate all availability data before storage
2. **User Experience**: Provide intuitive interfaces for availability submission
3. **Performance**: Use efficient database queries and caching
4. **Security**: Implement proper authorization for admin functions
5. **Flexibility**: Support multiple availability types and constraints
6. **Audit Trail**: Track all availability changes and submissions

## Future Enhancements

1. **Mobile App**: Native mobile availability submission
2. **Notifications**: Automated reminders for availability submission
3. **Templates**: Recurring availability patterns
4. **Bulk Operations**: Mass availability updates
5. **Analytics**: Availability submission patterns and insights