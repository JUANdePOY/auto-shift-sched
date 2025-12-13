# Admin Employee Filter Implementation

This document summarizes the changes made to exclude admin employees from scheduling, availability, and assignment operations throughout the system.

## Changes Made

### 1. Backend API Changes

#### Employee Routes (`server/features/employees/routes/employees.js`)
- **Modified default `/` endpoint**: Now returns only non-admin employees (excludes `role = 'admin'`)
- **Added `/all` endpoint**: Returns all employees including admins (for admin management interface)
- This ensures that by default, scheduling and availability operations only see non-admin employees

#### Availability Service (`server/features/availability/services/availabilityService.js`)
- **Updated `getAvailabilityStatus()`**: Excludes admin employees from total employee count
- **Updated `getWeeklySubmissions()`**: Filters out admin employees from availability submissions
- This ensures availability statistics and management only consider non-admin employees

#### Schedule Dashboard Routes (`server/features/schedule/routes/schedule.js`)
- **Updated employee utilization endpoint**: Excludes admin employees from utilization calculations
- **Updated monthly overview endpoint**: Excludes admin employees from monthly statistics
- This ensures dashboard metrics only reflect non-admin employee data

#### AI Suggestion Engine (`server/features/ai-suggestions/services/suggestionEngine.js`)
- **Updated `getEmployees()`**: Excludes admin employees from suggestion pool
- **Updated `getEmployeesByStation()`**: Excludes admin employees when filtering by station
- This ensures AI suggestions never recommend admin employees for shifts

### 2. Frontend Changes

#### Employee Service (`frontend/src/features/employees/services/employeeService.ts`)
- **Modified `getAllEmployees()`**: Now fetches non-admin employees by default
- **Added `getAllEmployeesIncludingAdmins()`**: New function to fetch all employees including admins

#### Employee Hook (`frontend/src/features/employees/hooks/useEmployees.ts`)
- **Added `includeAdmins` parameter**: Allows components to specify whether to include admin employees
- **Updated `fetchEmployees()`**: Uses appropriate service function based on `includeAdmins` parameter

#### Component Updates
- **Employee Management (`Employees.tsx`)**: Uses `includeAdmins: true` to show all employees in management interface
- **App Component (`App.tsx`)**: Uses `includeAdmins: false` for scheduling operations
- **Dashboard Component**: Receives filtered employee list from App component

#### Utility Functions (`frontend/src/features/shared/utils/employeeUtils.ts`)
- **Added `filterNonAdminEmployees()`**: Utility function to filter out admin employees
- **Added `getAdminEmployees()`**: Utility function to get only admin employees

## Impact

### What's Excluded for Admin Employees:
1. **Scheduling Operations**: Admin employees won't appear in shift assignment interfaces
2. **Availability Management**: Admin employees won't be counted in availability statistics or submissions
3. **AI Suggestions**: Admin employees won't be suggested for shift assignments
4. **Dashboard Metrics**: Admin employees won't be included in utilization and workload calculations
5. **Crew Views**: Admin employees won't appear in employee lists for crew members

### What's Still Included for Admin Employees:
1. **Employee Management**: Admin employees can still be viewed, edited, and managed in the employee management interface
2. **Authentication**: Admin employees can still log in and access admin functions
3. **System Administration**: Admin employees retain full system access and control

## Database Schema
The existing `employees` table already has a `role` column that supports 'admin', 'manager', and 'crew' values. No database schema changes were required.

## Testing Recommendations
1. Verify that admin employees don't appear in shift assignment panels
2. Confirm availability statistics exclude admin employees
3. Test that AI suggestions don't recommend admin employees
4. Ensure employee management interface still shows all employees including admins
5. Verify dashboard metrics exclude admin employees from calculations

## Future Considerations
- Consider adding a system setting to control whether admin employees should be completely hidden or just excluded from scheduling
- Add audit logging for admin employee management operations
- Consider role-based permissions for viewing different employee types