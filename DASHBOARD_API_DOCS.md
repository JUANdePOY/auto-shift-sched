# Dashboard API Endpoints Documentation

## Base URL
All endpoints are relative to `/api/schedule/`

## Endpoints

### 1. Get Weekly Schedule Summary with Conflicts

**Endpoint:** `GET /dashboard/week-summary/:weekStart`

**Parameters:**
- `weekStart` (path parameter): Start date of the week in YYYY-MM-DD format (should be a Monday)

**Response:**
```json
{
  "weekStart": "2025-12-08",
  "weekEnd": "2025-12-14",
  "assignments": [
    {
      "shift_id": 1,
      "employee_id": 1,
      "title": "Morning Service",
      "date": "2025-12-08",
      "startTime": "09:00",
      "endTime": "17:00",
      "employee_name": "John Doe",
      "requiredEmployees": 2
    }
  ],
  "conflicts": [
    {
      "type": "overlap",
      "severity": "error",
      "employeeId": 1,
      "employeeName": "John Doe",
      "shiftIds": [1, 2],
      "message": "John Doe assigned to overlapping shifts on 2025-12-08"
    }
  ],
  "coverageRate": 85,
  "totalShifts": 20,
  "coveredShifts": 17
}
```

**Description:**
- Returns all shift assignments for a specific week
- Detects overlapping shifts (same employee assigned to multiple shifts on same day)
- Calculates shift coverage percentage
- Useful for identifying scheduling problems

---

### 2. Get Employee Utilization Metrics

**Endpoint:** `GET /dashboard/employee-utilization/:weekStart`

**Parameters:**
- `weekStart` (path parameter): Start date of the week in YYYY-MM-DD format

**Response:**
```json
{
  "weekStart": "2025-12-08",
  "averageUtilization": 72,
  "employeesScheduled": 8,
  "totalEmployees": 10,
  "employeeDetails": [
    {
      "employeeId": "1",
      "employeeName": "John Doe",
      "maxHoursPerWeek": 40,
      "scheduledHours": "35.50",
      "utilizationPercentage": 88.75
    },
    {
      "employeeId": "2",
      "employeeName": "Jane Smith",
      "maxHoursPerWeek": 40,
      "scheduledHours": "20.00",
      "utilizationPercentage": 50
    }
  ]
}
```

**Description:**
- Calculates how many hours each employee is scheduled vs their maximum
- Returns average utilization across all employees
- Shows how many employees are actively scheduled
- Useful for workload balancing analysis

**Calculations:**
- Utilization % = (Scheduled Hours / Max Hours Per Week) × 100
- Average Utilization = Sum of all utilization % / Number of employees

---

### 3. Get Monthly Overview Statistics

**Endpoint:** `GET /dashboard/monthly-overview`

**Parameters:**
- None (uses current month)

**Response:**
```json
{
  "month": "2025-12",
  "currentMonth": {
    "totalShifts": 85,
    "totalAssignments": 142,
    "uniqueEmployees": 9,
    "totalHours": "1045.50",
    "averageCoverageRate": 88
  },
  "percentageChanges": {
    "assignmentsChange": 12,
    "shiftsCovered": 88
  }
}
```

**Description:**
- Aggregates statistics for the current calendar month
- Compares with previous month to show trends
- Tracks total work hours scheduled
- Shows coverage rate for the month

**Metrics:**
- **totalShifts**: Number of distinct shifts in the month
- **totalAssignments**: Total shift assignments made
- **uniqueEmployees**: Count of different employees scheduled
- **totalHours**: Sum of all scheduled work hours
- **averageCoverageRate**: Percentage of shifts adequately staffed
- **assignmentsChange**: % change in assignments vs last month

---

### 4. Get Recent Activity Feed

**Endpoint:** `GET /dashboard/recent-activity`

**Parameters:**
- None

**Response:**
```json
[
  {
    "type": "schedule_published",
    "description": "Schedule published for week of 2025-12-08",
    "timeAgo": "2 hours ago"
  },
  {
    "type": "availability_submitted",
    "description": "Availability submitted by employee for week of 2025-12-15",
    "timeAgo": "4 hours ago"
  },
  {
    "type": "employee_added",
    "description": "New employee added: Alice Johnson",
    "timeAgo": "1 day ago"
  },
  {
    "type": "shift_assigned",
    "description": "Employee assigned to shift on 2025-12-09",
    "timeAgo": "3 days ago"
  }
]
```

**Description:**
- Returns the 10 most recent activities in the system
- Activities are sorted by date (newest first)
- Includes timestamps in human-readable format
- Useful for auditing and activity tracking

**Activity Types:**
- `schedule_published`: When a schedule is published
- `availability_submitted`: When an employee submits availability
- `employee_added`: When a new employee is created
- `shift_assigned`: When an employee is assigned to a shift

**Time Format:**
- "Just now" for activities < 1 hour old
- "X hour(s) ago" for activities < 24 hours old
- "X day(s) ago" for older activities

---

## Authentication
All endpoints require:
- `Authorization: Bearer <token>` header (uses session storage auth token)
- `Content-Type: application/json` header

## Error Handling

All endpoints follow standard HTTP status codes:
- `200 OK`: Successful response
- `400 Bad Request`: Missing or invalid parameters
- `401 Unauthorized`: Missing or invalid auth token
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Usage Examples

### Using the Dashboard Service (TypeScript)

```typescript
import { dashboardService } from '@/features/shared/services/dashboardService';

// Get current week's summary
const weekStart = '2025-12-08';
const summary = await dashboardService.getWeekSummary(weekStart);
console.log(`Coverage Rate: ${summary.coverageRate}%`);
console.log(`Conflicts Found: ${summary.conflicts.length}`);

// Get utilization data
const utilization = await dashboardService.getEmployeeUtilization(weekStart);
console.log(`Average Utilization: ${utilization.averageUtilization}%`);
console.log(`Employees Scheduled: ${utilization.employeesScheduled}/${utilization.totalEmployees}`);

// Get monthly overview
const monthly = await dashboardService.getMonthlyOverview();
console.log(`Month: ${monthly.month}`);
console.log(`Total Hours: ${monthly.currentMonth.totalHours}`);

// Get recent activity
const activities = await dashboardService.getRecentActivity();
activities.forEach(activity => {
  console.log(`${activity.description} (${activity.timeAgo})`);
});
```

### Direct API Calls (cURL)

```bash
# Get week summary
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/schedule/dashboard/week-summary/2025-12-08

# Get employee utilization
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/schedule/dashboard/employee-utilization/2025-12-08

# Get monthly overview
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/schedule/dashboard/monthly-overview

# Get recent activity
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/schedule/dashboard/recent-activity
```

## Performance Notes

- **Week Summary**: O(n) where n = number of shifts + assignments
- **Employee Utilization**: O(n) where n = number of employees
- **Monthly Overview**: Uses indexed date range queries
- **Recent Activity**: Returns fixed set of 10 items

All queries use efficient GROUP BY and JOIN operations for performance.

## Database Dependencies

The endpoints require these tables:
- `final_schedule`: Stores shift assignments
- `shifts`: Shift definitions (time, requirements)
- `employees`: Employee data (max hours, etc.)
- `schedule_generations`: For schedule publication tracking
- `availability_submissions`: For availability tracking
- `schedule_assignments`: For shift assignment history

Ensure these tables are properly populated for accurate metrics.
