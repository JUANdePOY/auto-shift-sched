# Dashboard Feature — Deep Dive

Overview
--------
The Dashboard is an admin-facing summary view. Its purpose is to give a quick, actionable overview of the current schedule: coverage, utilization, availability, monthly trends and recent activity.

Key responsibilities
- Present high-level metrics and trends
- Surface conflicts and urgent items
- Give entry-points to the Schedule and Availability tools

Structure
- `components/`
  - `Dashboard.tsx` — main UI (presentational + light orchestration)
- `services/`
  - `dashboardService.ts` — API calls for weekly summary, utilization, monthly overview, recent activity
- `types/` (shared)
  - `WeeklySchedule`, `ScheduleConflict`, `WeekSummary`, `EmployeeUtilization`, `MonthlyOverview`, `ActivityItem`

Important files
- `frontend/src/features/shared/components/Dashboard.tsx` — UI and orchestration (fetches multiple dashboard endpoints in parallel)
- `frontend/src/features/shared/services/dashboardService.ts` — server interactions

Data flow summary
User opens Dashboard → `Dashboard` component computes `weekStart` → `dashboardService` calls (parallel) → responses are set in local state → component renders metrics & feed

Representative code and line-by-line

1) `getNextWeekStart` (utils inside component)

```ts
const getNextWeekStart = (baseDate?: string) => {
  const start = baseDate ? new Date(baseDate) : new Date();
  const dayOfWeek = start.getDay();
  const diff = dayOfWeek === 0 ? 1 : 8 - dayOfWeek; // Next Monday
  const nextMonday = new Date(start);
  nextMonday.setDate(start.getDate() + diff);
  return nextMonday.toISOString().split('T')[0];
};
```

- Purpose: compute a canonical Monday string (YYYY-MM-DD) for the next week.
- Key detail: uses `getDay()` where 0 is Sunday; the formula ensures monotonic next-week Monday.

2) Dashboard `useEffect` fetching all data in parallel

```ts
useEffect(() => {
  const fetchDashboardData = async () => {
    const currentWeekStart = schedule?.weekStart ?? getCurrentWeekStart();
    const nextWeekStart = getNextWeekStart(addDaysToDate(currentWeekStart, 0));

    const [weekSummaryData, utilizationData, monthlyData, activityData, availabilityData] = await Promise.all([
      dashboardService.getWeekSummary(currentWeekStart).catch(() => null),
      dashboardService.getEmployeeUtilization(currentWeekStart).catch(() => null),
      dashboardService.getMonthlyOverview().catch(() => null),
      dashboardService.getRecentActivity().catch(() => null),
      availabilityService.getAvailabilityStatus(nextWeekStart).catch(() => ({ submissionRate: 0, totalEmployees: employees.length, submissions: 0 }))
    ]);

    setWeekSummary(weekSummaryData);
    setEmployeeUtilization(utilizationData);
    setMonthlyOverview(monthlyData);
    setRecentActivity(activityData || []);
    setNextWeekAvailability(availabilityData || { submissionRate: 0, totalEmployees: employees.length, submissions: 0 });
  };
  fetchDashboardData();
}, [employees.length]);
```

- Purpose: load all dashboard pieces in parallel and set sensible fallbacks on failures.
- Best practice demonstrated: non-blocking fetches (parallel Promise.all), `.catch(() => null)` to avoid whole failure, and using sensible fallbacks for UI.

UI considerations
- Keep Dashboard components presentational where possible; heavy computations and aggregation live in `dashboardService` or server.
- Use proper fallbacks for missing data (0 or empty arrays) and bound percentages to 0–100.

Notes & next steps
- Add unit tests for `getNextWeekStart` and any date utility functions.
- Consider moving `getNextWeekStart` and `addDaysToDate` into a shared `dateUtils` module for reuse and testability.
