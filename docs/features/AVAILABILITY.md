# Availability Feature — Deep Dive

Overview
--------
The Availability feature lets employees declare when they can work and lets admins review, lock, and edit submissions. Availability data is a key input for the AI scheduler.

Structure
- `components/`
  - `AvailabilityPanel.tsx` — admin view for weekly submissions
  - `AvailabilityCalendar.tsx` — interactive calendar input (employee view)
- `services/`
  - `availabilityService.ts` — endpoints for get/submit/lock/status/history/week
- `types/`
  - `AvailabilitySubmission`, `AvailabilityStatus`, `AdminAvailabilitySubmission`
- `utils/`
  - Date utilities for computing week start and formatting (`getMondayOfWeek`, `formatTimeToAMPM` inside components)

Representative service operations

`getAvailabilityStatus(weekStart)` — returns submission rates and totals for a week:

```ts
export async function getAvailabilityStatus(weekStart) {
  const response = await fetch(`${API_BASE_URL}/status/${weekStart}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch availability status');
  return response.json();
}
```

Admin UI example: `AvailabilityPanel` highlights:

- `getMondayOfWeek()` — ensures the UI always uses a Monday-based week start.
- `loadAllSubmissions()` — calls `availabilityService.getWeeklySubmissions(weekStart)` and stores submissions in `allSubmissions`.
- `handleLockSubmissions()` — calls `availabilityService.lockAvailability(weekStart)`; on success refreshes status and submissions and shows a toast.

Key UI behavior (line-by-line highlights):

1. Date normalization helper `getMondayOfWeek` ensures consistent week boundaries for the UI and service calls.
2. `formatTimeToAMPM(time)` formats times for friendliness in the UI and is used in table cells.
3. `loadAllSubmissions()` handles loading/error/toast behavior and sets `allSubmissions`.

Integration with scheduler
- Availability is an input to the automated scheduler and the AI Suggestion Engine; ensure API returns normalized availability shapes (preferred start/end or `anytime`) and that the scheduler is resilient to missing availability.

Notes
- Consider moving date helpers to `frontend/src/lib/dateUtils.ts` to avoid duplication between dashboard/availability components.
