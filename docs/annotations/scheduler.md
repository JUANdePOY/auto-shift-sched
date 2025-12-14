# ShiftScheduler — Line-by-line Annotation

Location: server/features/schedule/services/scheduler.js

Purpose: Constraint-based automated scheduler that assigns employees to shifts across a date range while applying fairness, availability and skill constraints.

Overview:
- Constructor (`this.rules`): centralizes scheduling policy (max hours, rest days, skill matching, fairness flags).
- `generateSchedule(startDate, endDate)`: main entry. Fetches employees and shift templates, sorts shifts, iterates date-by-date to find available employees, ranks and assigns them, collects conflicts and coverage metrics.

Key functions and notes:
- `generateSchedule`:
  - Fetch employees and shift templates in parallel with `getEmployees` and `getShiftTemplates`.
  - Reset `currentWeeklyHours` on employee objects to ensure fresh calculations.
  - Use `sortShifts` to apply priority/time ordering so critical shifts are filled first.
  - Build date array with `getDatesInRange` and iterate each date.
  - For each shift/date, build `shiftWithDate` and find candidates via `findAvailableEmployees`.
  - Filter out employees already assigned that day using `dailyAssignments` map to avoid double-booking.
  - If no unassigned candidates, add a `conflict` object (useful to show gaps to users).
  - Rank candidates with `rankEmployees` (delegates to `EmployeeRanker`) and call `assignEmployeesToShift`.
  - Track assigned shifts and update each employee's `currentWeeklyHours`.
  - Return `{ assignments, conflicts, coverageRate, totalShifts, assignedShifts }` for callers to present or further process.

- `getEmployees(startDate)`:
  - Reads employees from DB (`SELECT * FROM employees`) and `formatEmployee` each row.
  - Computes week start via `getWeekStart` and attempts to fetch submitted weekly availability per employee via `availabilityService.getAvailability`.
  - Falls back to the employee record's default availability on fetch failures and logs a warning — this prevents schedule generation from failing due to missing availability.

- `getWeekStart(dateString)`:
  - Normalizes date to the Monday of the week containing `dateString` and returns `YYYY-MM-DD`.

- `getShiftTemplates()`:
  - Reads all shifts from DB and `formatShift` them. Shift templates are date-agnostic until placed into a target date.

- `sortShifts(shifts)`:
  - Sorts by `priority` (high→low) then by `startTime`.
  - Ensures important shifts are filled before lower-priority ones.

- `getDatesInRange(startDate, endDate)`:
  - Returns an array of `YYYY-MM-DD` strings for every date in the inclusive range.

- `findAvailableEmployees(employees, shift)`:
  - Uses `AvailabilityMatcher.isEmployeeAvailable(employee, shift)` for comprehensive availability checks.
  - Applies skill matching with `StationManager.hasRequiredSkills` when `this.rules.skillMatching` is enabled.
  - Does not rigidly enforce `maxHoursPerWeek` in the filter stage — ranking step handles workloads for flexibility and to avoid prematurely excluding candidates.

- `rankEmployees(employees, shift)`:
  - Delegates to `EmployeeRanker.rankEmployeesForShift`, passing `weekStart` and placeholders for current/past assignments.
  - Converts returned ranking objects to `{ employee, score }` shape for backward compatibility.

- `assignEmployeesToShift(rankedEmployees, shift)`:
  - Computes `employeesNeeded` = `shift.requiredEmployees - shift.assignedEmployees.length` and takes the top-ranked candidates up to the need.
  - Returns an array of assignment objects (shiftId, employeeId, employeeName, date, times).

- Utility methods:
  - `calculateSkillMatch(employeeStation, requiredStation)` — fraction of required stations matched.
  - `calculateAvailabilityScore(employee, shift)` — compares shift times to preferred start/end windows and returns 0.0–1.0. Falls back to 0.5 if no preferences set.
  - `calculateShiftHours(shift)` — computes hours difference from `startTime` and `endTime`.
  - `getDayOfWeek(dateString)` — returns weekday string used to index employee availability.
  - `calculateCoverageRate(shifts, assignments)` — computes a coverage percentage (assigned vs required employees).

Testing and maintenance suggestions:
- Add unit tests for `sortShifts`, `getDatesInRange`, `calculateShiftHours`, and `getWeekStart` (pure functions, easy to assert).
- Add integration tests for `generateSchedule` using a small controlled DB fixture to validate fairness constraints and conflict reporting.
- Consider caching `availabilityService.getAvailability` responses per employee/week if `generateSchedule` is run frequently to reduce DB/API calls.
- Document assumptions (e.g., `availability` shape) and ensure `AvailabilityMatcher` contract remains stable.

Performance note: `generateSchedule` can be CPU- and I/O-intensive for large date ranges and many employees. Profiling and opportunistic memoization of availability lookups are recommended.
