# Shift App - Project Structure Documentation

## Overview
This is a scheduling application with React/TypeScript frontend and Node.js/Express backend. The application manages employees, departments, shifts, and provides AI-powered scheduling suggestions.

## Current Structure

### Frontend (`frontend/src/`)
```
src/
├── components/          # UI Components
│   ├── ui/             # Reusable UI components
│   ├── Employee*.tsx    # Employee-related components
│   ├── Dashboard.tsx    # Main dashboard
│   └── ScheduleView.tsx # Schedule visualization
├── hooks/              # Custom React hooks
│   ├── useEmployees.ts  # Employee management
│   ├── useSchedule.ts   # Schedule management
│   ├── useSuggestions.ts # AI suggestions
│   └── useAssignments.ts # Assignment operations
├── services/           # API service layer
│   ├── employeeService.ts
│   ├── scheduleService.ts
│   └── departmentService.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
│   ├── errorHandler.ts
│   ├── validation.ts
│   └── utils.ts
└── lib/                # Library code
    ├── mockData.ts
    └── utils.ts
```

### Backend (`server/`)
```
server/
├── routes/             # API route handlers
│   ├── employees.js
│   ├── departments.js
│   ├── shifts.js
│   ├── schedule.js
│   └── assignments.js
├── middleware/         # Express middleware
│   └── errorHandler.js
├── utils/              # Utility functions
│   ├── formatUtils.js
│   ├── scheduler.js
│   ├── suggestionEngine.js
│   └── errorHandler.js
├── validation/         # Input validation
│   └── employeeValidation.js
├── config/             # Configuration
│   └── database.js
└── scripts/            # Database scripts
    ├── setupDepartmentsAndStations.sql
    └── insertDepartmentsAndStations.sql
```

## Proposed Feature-Based Structure

### Frontend Feature Organization
```
src/
├── features/
│   ├── employees/
│   │   ├── components/
│   │   │   ├── EmployeeList.tsx
│   │   │   ├── EmployeeCard.tsx
│   │   │   ├── EmployeeFilters.tsx
│   │   │   ├── EmployeeStats.tsx
│   │   │   └── EmployeeModal.tsx
│   │   ├── hooks/
│   │   │   └── useEmployees.ts
│   │   ├── services/
│   │   │   └── employeeService.ts
│   │   ├── types/
│   │   │   └── employee.ts
│   │   └── utils/
│   │       └── validation.ts
│   ├── schedule/
│   │   ├── components/
│   │   │   ├── ScheduleView.tsx
│   │   │   └── ScheduleControls.tsx
│   │   ├── hooks/
│   │   │   └── useSchedule.ts
│   │   ├── services/
│   │   │   └── scheduleService.ts
│   │   └── types/
│   │       └── schedule.ts
│   └── ai-suggestions/
│       ├── components/
│       │   └── AISuggestionPanel.tsx
│       ├── hooks/
│       │   └── useSuggestions.ts
│       └── services/
│           └── suggestionService.ts
├── shared/
│   ├── components/
│   │   └── ui/         # Reusable UI components
│   ├── hooks/
│   │   └── use-mobile.ts
│   ├── types/
│   │   └── index.ts    # Shared types
│   └── utils/
│       ├── errorHandler.ts
│       └── utils.ts
└── App.tsx
```

### Backend Feature Organization
```
server/
├── features/
│   ├── employees/
│   │   ├── routes/
│   │   │   └── employees.js
│   │   ├── validation/
│   │   │   └── employeeValidation.js
│   │   ├── services/
│   │   │   └── employeeService.js
│   │   └── models/
│   │       └── employee.js
│   ├── schedule/
│   │   ├── routes/
│   │   │   └── schedule.js
│   │   ├── services/
│   │   │   └── scheduler.js
│   │   └── models/
│   │       └── shift.js
│   └── ai-suggestions/
│       ├── routes/
│       │   └── suggestions.js
│       └── services/
│           └── suggestionEngine.js
├── shared/
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── utils/
│   │   └── formatUtils.js
│   └── config/
│       └── database.js
└── index.js
```

## Key Features Implemented

### Employee Management
- CRUD operations for employees
- Input validation and error handling
- Department and station management
- Availability tracking
- Hours management

### Schedule Management
- Shift creation and assignment
- Weekly schedule visualization
- Conflict detection
- Coverage rate calculation

### AI-Powered Suggestions
- Employee assignment recommendations
- Optimization suggestions
- Skill matching algorithms
- Work-life balance considerations

## API Endpoints

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get specific employee
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Schedule
- `GET /api/schedule` - Get weekly schedule
- `POST /api/schedule/suggest-employee` - Get AI suggestions
- `POST /api/shifts/:id/assign` - Assign employee to shift
- `POST /api/shifts/:id/unassign` - Unassign employee from shift

## Data Models

### Employee
```typescript
interface Employee {
  id: string;
  name: string;
  email: string;
  department: 'Service' | 'Production';
  station: string | string[];
  skills: string[];
  availability: WeeklyAvailability;
  maxHoursPerWeek: number;
  currentWeeklyHours: number;
  createdAt: string;
  updatedAt: string;
}
```

### Shift
```typescript
interface Shift {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  requiredSkills: string[];
  requiredEmployees: number;
  assignedEmployees: string[];
  isCompleted: boolean;
}
```

## Validation Rules

### Employee Validation
- Name: 2-50 characters, letters/spaces/hyphens/apostrophes only
- Email: Valid email format
- Department: Must be 'Service' or 'Production'
- Station: String or array of strings
- Max hours: 0-168 hours
- Availability: Proper day-specific object structure

## Error Handling

### Frontend
- Custom error creation with `createAppError`
- User-friendly error messages
- Toast notifications for user actions
- Error logging for debugging

### Backend
- Input validation with express-validator
- Database error handling
- Consistent HTTP status codes
- Structured error responses

## Development Guidelines

1. **Feature Development**: Create features in their respective feature directories
2. **Type Safety**: Use TypeScript interfaces for all data structures
3. **Error Handling**: Use centralized error handling utilities
4. **Validation**: Implement comprehensive input validation
5. **Documentation**: Maintain up-to-date documentation
