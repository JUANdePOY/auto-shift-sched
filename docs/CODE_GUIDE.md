# Code Guide & Line-by-Line Explanations

This guide explains conventions and shows line-by-line explanations for representative files: a util, a service, and a hook. Use these as templates for writing new features.

## Conventions Recap

- Components: UI-only; receive props; avoid API calls.
- Hooks: state, side-effects, validation, and orchestration.
- Services: HTTP requests and error translation; return typed data.
- Types: describe shapes used by features and services.

## Example 1 — Utility: Time formatting

File: [frontend/src/utils/timeUtils.ts](frontend/src/utils/timeUtils.ts#L1-L20)

Code:
```typescript
export const formatTo12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};
```

Line-by-line:
1. `export const formatTo12Hour = (time24: string): string => {` — Exports a pure function that converts `HH:MM` (24h) to 12-hour format string.
2. `const [hours, minutes] = time24.split(':');` — Split input into hour and minute components.
3. `const hour = parseInt(hours, 10);` — Convert hours to a number for calculation.
4. `const ampm = hour >= 12 ? 'PM' : 'AM';` — Decide AM/PM.
5. `const hour12 = hour % 12 || 12;` — Convert to 12-hour clock, mapping 0 → 12.
6. ``return `${hour12}:${minutes} ${ampm}`;`` — Return final formatted string.

Why this matters: Keep utilities pure and side-effect free so they're easy to test and reuse across features.

## Example 2 — Service: `scheduleService`

File: [frontend/src/features/schedule/services/scheduleService.ts](frontend/src/features/schedule/services/scheduleService.ts#L1-L200)

Key responsibilities:
- Build request URLs
- Add auth headers when necessary
- Throw meaningful errors for the caller to catch

Selected snippet and explanation:
```typescript
const API_URL = '/api';

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};
```

- `API_URL`: centralizes the base path so it can be changed easily.
- `getAuthHeaders()`: reads token from `localStorage` and conditionally returns `Authorization` header; services call this helper so auth handling is consistent.

Function example: `getAllShifts()`
```typescript
export async function getAllShifts(): Promise<Shift[]> {
  const response = await fetch(`${API_URL}/shifts`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch shifts');
  }
  return response.json();
}
```

Line-by-line:
1. `await fetch(`${API_URL}/shifts`, { headers: getAuthHeaders() })` — Asks backend for shifts, reusing the header helper.
2. `if (!response.ok) throw new Error(...)` — Services should translate HTTP failures into thrown errors, letting hooks or callers handle user feedback.
3. `return response.json()` — Return parsed JSON (typed via the function signature).

Best practices:
- Keep service functions small and focused on network I/O.
- Avoid embedding UI logic (errors, toasts) in services.

## Example 3 — Hook: `useShifts`

File: [frontend/src/features/schedule/hooks/useShifts.ts](frontend/src/features/schedule/hooks/useShifts.ts#L1-L120)

Snippet:
```typescript
const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  setAssignments([]);
}, [date]);

useEffect(() => {
  const loadShifts = async () => {
    if (!isOpen || assignments.length > 0 || departments.length === 0 || stations.length === 0) {
      return;
    }

    setLoading(true);
    try {
      const fetchedShifts = await getAllShifts();
      const initialAssignments: ShiftAssignment[] = fetchedShifts.map(shift => ({
        id: shift.id,
        time: formatTimeForDisplay(shift.startTime),
        endTime: formatTimeForDisplay(shift.endTime),
        title: shift.title,
        department: shift.department || departments[0]?.name || 'General',
        requiredStation: [],
        status: 'unassigned',
        type: getShiftType(formatTimeForDisplay(shift.startTime))
      }));
      setAssignments(initialAssignments);
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
    } finally {
      setLoading(false);
    }
  };
  loadShifts();
}, [isOpen, assignments.length, departments, stations, date]);

return { assignments, setAssignments, loading };
```

Line-by-line notes and best practices:
1. `useState` holds assignments and `loading` separately—simple and predictable state.
2. The first `useEffect` clears assignments when `date` changes—single responsibility for that effect.
3. The second `useEffect` implements a guarded loader (`isOpen` and minimal preconditions) to avoid unnecessary double requests.
4. `setLoading(true)` / `finally setLoading(false)` ensures UI can show spinners reliably.
5. `try/catch` around the service call captures network and parsing errors; the hook logs and leaves toast or user-facing handling to the component or a shared error handler.
6. The hook returns both state and setters (the setter allows controlled modification; expose more helper functions if the hook needs to encapsulate updates).

## Writing New Feature Code — Quick checklist

- Put presentational UI in `components/` and keep it pure.
- Place network logic in `services/` and return typed data.
- Encapsulate business logic in `hooks/` and surface a small, well-typed API.
- Keep `types/` small and meaningful — prefer composition over duplication.

## Where to go next

- Use `ARCHITECTURE.md` for overall context.
- Use `FEATURES.md` to see how an individual feature should be structured.
- Follow the examples above when creating new hooks, services, utils or types.

## Detailed Annotations

The repository contains longer, per-file annotations for important logic you can use as templates:

- `useAssignmentHandlers` (frontend hook): [docs/annotations/useAssignmentHandlers.md](docs/annotations/useAssignmentHandlers.md)
- `employeeService` (frontend service): [docs/annotations/employeeService.md](docs/annotations/employeeService.md)
- `schedule.js` (backend routes): [docs/annotations/schedule_routes.md](docs/annotations/schedule_routes.md)
- `ShiftScheduler` (server scheduler): [docs/annotations/scheduler.md](docs/annotations/scheduler.md)
- `SuggestionEngine` (AI suggestions): [docs/annotations/suggestionEngine.md](docs/annotations/suggestionEngine.md)
