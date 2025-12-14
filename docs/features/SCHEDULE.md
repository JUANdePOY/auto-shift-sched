# Schedule Feature — Deep Dive

Overview
--------
The Schedule feature is the core of the app: it defines shifts, assigns staff, detects conflicts, and supports automated schedule generation with AI suggestions.

Structure
- `components/`
  - `ScheduleView.tsx` — calendar and list views
  - `ShiftAssignmentPanel/*` — assignment editor and auto-schedule controls
  - `ShiftAssignmentTable.tsx` — tabular shift view
- `hooks/`
  - `useShifts.ts` — loads shift templates and formats them for UI
  - `useAssignmentHandlers.ts` — handlers for assign, unassign, save final, edit, delete, and apply AI suggestions
  - `useShiftAssignments.ts` — assignment-focused logic used by the panel
- `services/`
  - `scheduleService.ts` — all schedule-related API calls (getAllShifts, getWeeklySchedule, generateAutomatedSchedule, detectConflicts, assign/unassign)
- `utils/`
  - `shiftAssignmentUtils.ts` — availability checks and helper functions like `getAvailableEmployees`, `getShiftType`, `formatTimeForDatabase`
- `types/`
  - `Shift`, `ShiftAssignment`, `ScheduleConflict`, `WeeklySchedule`

Representative backend/service calls

1) `generateAutomatedSchedule(startDate, endDate)` (service)

```ts
export async function generateAutomatedSchedule(startDate: string, endDate: string) {
  const response = await fetch(`${API_URL}/schedule/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ startDate, endDate }) });
  if (!response.ok) throw new Error('Failed to generate automated schedule');
  return response.json();
}
```

- This endpoint delegates to `ShiftScheduler.generateSchedule` on the server. Keep services lean and delegate heavy algorithms to backend services for performance and testability.

2) `getEmployeeSuggestions(shiftId, date)` (service)

```ts
export async function getEmployeeSuggestions(shiftId: string, date: string) {
  const response = await fetch(`${API_URL}/schedule/suggest-employee`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shiftId, date })
  });
  if (!response.ok) throw new Error('Failed to get employee suggestions');
  return response.json();
}
```

- Frontend and AI engines follow a suggest-only policy — suggestions require human approval before applying.

Hook-level example

`useShifts` summary and key lines:

```ts
useEffect(() => {
  if (!isOpen || assignments.length > 0 || departments.length === 0 || stations.length === 0) return;
  setLoading(true);
  const fetchedShifts = await getAllShifts();
  const initialAssignments = fetchedShifts.map(shift => ({
    id: shift.id,
    time: formatTimeForDisplay(shift.startTime),
    endTime: formatTimeForDisplay(shift.endTime),
    department: shift.department || departments[0]?.name || 'General',
    status: 'unassigned',
    type: getShiftType(formatTimeForDisplay(shift.startTime))
  }));
  setAssignments(initialAssignments);
  setLoading(false);
}, [isOpen, assignments.length, departments, stations, date]);
```

- This hook demonstrates guarded fetching and mapping raw shift records into UI-friendly `ShiftAssignment` objects. It also defers loading when preconditions (departments/stations) aren't met.

UI → Hook → Service rules
- Components should call hooks for actions and display state; hooks call services. Never call `fetch` directly in components.

Conflict detection and scheduler
- The server contains `ShiftScheduler` (automated generation) and conflict detection functions. Keep heavy algorithms on the server for consistent, single-source-of-truth behaviour. The frontend calls `detectConflicts` to surface issues.

Testing
- Unit test the UI utilities (`getShiftType`, `formatTimeForDisplay`), hooks in isolation using mocked services, and integration tests that exercise `scheduleService` with a test backend.

Notes
- Keep the assignment logic in `shiftAssignmentUtils.ts` small and well-tested; it is central to correctness when determining employee eligibility and detecting conflicts.
