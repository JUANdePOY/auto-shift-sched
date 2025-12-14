# Feature-Based Organization

This project uses Feature-Based Architecture. Each feature is a self-contained area of the app with clear responsibilities.

Common subfolders in a feature:
- `components/` — UI only (presentational)
- `services/` — API calls and HTTP plumbing
- `hooks/` — state and logic orchestration
- `types/` — TypeScript interfaces and types
- `context/` — optional feature-specific React context

### Example: `features/employee`

Purpose: Admin-only employee CRUD

Structure:
```
features/employee/
  components/
    EmployeeList.tsx
    EmployeeCard.tsx
    EmployeeModal.tsx
  services/
    employeeService.ts
  hooks/
    useEmployees.ts
  types/
    employee.types.ts
```

Flow example (create employee):
1. `EmployeeModal` (component) collects input and calls `useEmployees.addEmployee()`
2. `useEmployees` validates and calls `employeeService.createEmployee()`
3. `employeeService` POSTs to the API
4. API returns created employee → `useEmployees` updates local state

### Schedule (core feature)

Responsibilities:
- Create/Update/Delete shifts
- Auto-scheduling and conflict detection
- Calendar rendering and navigation

Services should expose functions like `getWeeklySchedule`, `createShift`, `generateAutomatedSchedule`, `detectConflicts` (see [scheduleService.ts](frontend/src/features/schedule/services/scheduleService.ts)).

### Crew, Availability, AI Suggestions

- **Crew**: user dashboard, limited to own records
- **Availability**: availability input and calendar; used as input by scheduling logic and AI
- **AI Suggestions**: reads availability + schedule to recommend assignments (suggest-only)

Security note: Backend must always be the source of truth for enforcing permissions.

Detailed per-feature documentation:

- Dashboard: [docs/features/DASHBOARD.md](docs/features/DASHBOARD.md)
- Schedule: [docs/features/SCHEDULE.md](docs/features/SCHEDULE.md)
- Employee: [docs/features/EMPLOYEE.md](docs/features/EMPLOYEE.md)
- Availability: [docs/features/AVAILABILITY.md](docs/features/AVAILABILITY.md)
- Crew: [docs/features/CREW.md](docs/features/CREW.md)
