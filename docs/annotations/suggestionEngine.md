# SuggestionEngine — Line-by-line Annotation

Location: server/features/ai-suggestions/services/suggestionEngine.js

Purpose: Provides ranked AI-like suggestions for manual scheduling — chooses employees for a specific shift/date based on skill match, availability, workload balance, and rotation.

Overview:
- `weights`: tuning object for modular scoring (skillMatch, availability, workloadBalance, experience).
- `getEmployeeSuggestions(shiftId, date, count = 5)`: primary API — returns top `count` ranked suggestions with scores and human-readable reasons.

Key functions and notes:
- `getEmployeeSuggestions`:
  - Retrieves a shift template (`getShift`) and sets `shift.date = date`.
  - Calculates `weekStart` via `getWeekStart(date)` for workload lookups.
  - Chooses candidate employees using `getEmployeesByStation` when `shift.requiredStation` exists, otherwise `getEmployees()`.
  - Fetches past and current week assignments for workload balance using `getPastWeekAssignments` and `getCurrentWeekAssignments`.
  - For each employee, performs an asynchronous availability check via `availabilityService.checkEmployeeAvailability(employee.id, shift.date, shift.startTime, shift.endTime)`.
  - Filters out employees who are unavailable, already assigned to this shift/date, or lack any matching station (if required).
  - Enriches candidate objects with `availabilitySubmitted`, `availabilityPreferred`, `availability` string, `pastWeekHours`, `currentWeekHours`, and `pastWeekShiftTypes` for scoring.
  - Sorts candidates by workload (lowest total hours first) to prioritize underutilized employees.
  - Maps candidates to a scored object using `calculateEnhancedSuitabilityScore` and `getEnhancedSuggestionReasons`, sorts by score, and slices top `count`.

- `getShift(shiftId)`: DB call: `SELECT * FROM shifts WHERE id = ?` and `formatShift` the result.

- `getEmployees()` / `getEmployeesByStation(stations)`:
  - `getEmployees`: selects non-admin rows from `employees` table and applies `formatEmployee`.
  - `getEmployeesByStation`: loads all employees then filters by station names (case-insensitive, partial matches allowed) to be inclusive of slightly different station strings.

- Scoring: `calculateEnhancedSuitabilityScore(employee, shift)`:
  - Station match (35%): uses `StationManager.calculateSkillMatchScore(employee, requiredStations)`.
  - Availability alignment (25%): full score if submitted & preferred, partial if submitted but not preferred, otherwise low baseline.
  - Workload balance (30%): `calculateEnhancedWorkloadScore` prefers employees with fewer past/current week hours.
  - Shift type rotation (10%): `calculateShiftTypeRotationScore` rewards variety (prefers employees who haven't recently worked that shift type, especially for 'anytime' employees).
  - Returns rounded integer score (0–100 scale).

- `calculateEnhancedWorkloadScore(employee)`:
  - Computes past and current week utilization vs `maxHoursPerWeek` (default 40), weights past week 60% and current week 40% to favor balancing based on recent past.

- `calculateShiftTypeRotationScore(employee, shift)` & `getShiftType(startTime)`:
  - Categorizes shift into `opener`, `mid`, `closer`, `graveyard` based on start hour.
  - For employees with 'anytime' availability, gives higher scores when they haven't worked that shift type recently.

- Assignment checks and history:
  - `isEmployeeAlreadyAssigned(employeeId, date)`: checks `schedule_assignments` and `final_schedule` tables, returns boolean. On DB error logs a warning and conservatively assumes employee was not assigned.
  - `getPastWeekAssignments` / `getCurrentWeekAssignments`: DB queries to fetch assignments joined with shift rows; used to compute `pastWeekHours`, `currentWeekHours`, and `pastWeekShiftTypes`.
  - Helpers `getEmployeePastWeekHours` / `getEmployeeCurrentWeekHours` calculate hours using `calculateShiftHours`.

- Utilities and additional methods:
  - `hasAnyMatchingStation(employee, requiredStations)`: inclusive station matching supporting string arrays or objects with `.name`.
  - `getEnhancedSuggestionReasons(employee, shift)`: builds an array of human-readable reasons such as station match quality, availability summary, and explicit hour counts (helpful in the UI to explain suggestions).
  - `getReplacementSuggestions(shiftId, absentEmployeeId, date)`: wraps `getEmployeeSuggestions` and tags `replacementFor` with a capped confidence value.
  - `getTopUnassignedSuggestions(shiftId, date)`: requests more suggestions and filters out employees already assigned on that date, returning top 3 unassigned candidates.

Operational and testing notes:
- Performance: `getEmployeeSuggestions` performs an availability check per employee which can be expensive for large rosters — adding batching or caching per week can reduce latency.
- Error handling: many methods catch DB/availability errors and log warnings; tests should cover fallback behavior (e.g., when availability lookup fails).
- Tuning: `weights` and internal percentages (35/25/30/10) are centralized and can be replaced with a config-driven tuning service for experimentation.

Security and privacy considerations:
- Avoid exposing internal scoring details in public logs. Only return minimal reasons to the UI and keep sensitive employee data (e.g., detailed availability notes) out of suggestion responses unless explicitly authorized.
