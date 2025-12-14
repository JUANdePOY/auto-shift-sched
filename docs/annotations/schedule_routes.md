# schedule.js (backend routes) — Line-by-line explanation

Source: [server/features/schedule/routes/schedule.js](server/features/schedule/routes/schedule.js#L1-L800)

Overview: Express router that exposes endpoints for schedule retrieval, conflict detection, automated schedule generation, AI suggestions, and final schedule persistence. The router relies on a database access layer (`db`) and helper/service modules for scheduling and AI suggestions.

Top-level imports:
1. `const express = require('express');` — Express framework.
2. `const db = require('../../../shared/config/database');` — MySQL connection/query wrapper.
3. `const { formatShift } = require('../../../shared/utils/formatUtils');` — utility for normalizing shift objects (used elsewhere in the module).
4. `const ShiftScheduler = require('../services/scheduler');` — service that encapsulates the automated scheduling algorithm.
5. `const SuggestionEngine = require('../../ai-suggestions/services/suggestionEngine');` — AI-based suggestion logic.

GET `/week` (lines 9–63): weekly schedule endpoint
- Validates `startDate` query parameter and computes `endDate` (start + 6 days).
- Fetches assigned shifts for the date range using `schedule_assignments` joined to `shifts` and `employees`.
- Maps DB rows into a `shifts` array with `id`, `title`, `date`, `startTime`, `endTime`, `requiredEmployees`, and `assignedEmployees` (simple single-assignment representation).
- Returns `weeklySchedule` with placeholders for `conflicts` and `suggestions`, and a `coverageRate` computed via `calculateCoverageRate(shifts)`.

GET `/conflicts` (lines 65–100): conflict listing
- Builds a query joining `schedule_assignments`, `shifts`, and `employees`.
- If `startDate` & `endDate` provided, restricts to that range.
- Runs `detectScheduleConflicts(assignments)` — a placeholder for a more advanced conflict detection algorithm.

POST `/generate` (lines 102–120): automated schedule generation
- Accepts `startDate` and `endDate` in body, validates them, and delegates to `ShiftScheduler.generateSchedule(startDate, endDate)`.
- Returns the generated schedule or forwards errors.

POST `/suggest-employee` & `/suggest-unassigned` (lines 122–162): AI suggestions
- Validate `shiftId` and `date` in body.
- Call `SuggestionEngine.getEmployeeSuggestions(shiftId, date)` or `getTopUnassignedSuggestions(shiftId, date)` and return results.

Helper `calculateCoverageRate(shifts)` (lines 164–175):
- If no shifts, consider coverage `100`.
- Otherwise compute % of shifts where assigned employees >= required employees.

Helper `detectScheduleConflicts(shifts)` (lines 178–200): placeholder
- The existing implementation returns an empty array, but comments list expected checks: overlapping shifts for same employee, station mismatches, overtime violations, availability conflicts.

POST `/save-final` (lines 202–346): persist final schedule
- Validates `date` and `assignments` array.
- Starts a DB transaction and creates a `schedule_generations` record to group the publication.
- Handles temporary shift IDs (`shift-<timestamp>`) by attempting to find an existing shift template or creating a new `shifts` record when necessary.
- For each assignment, inserts into `schedule_assignments` if it doesn't already exist, and builds `finalAssignments` for a bulk insert into `final_schedule` (legacy compatibility).
- Uses transaction commit/rollback and releases the connection; returns `{ success, scheduleGenerationId, message, totalAssignments }`.

GET `/final/:date` (lines 348–403): final schedule for a date
- Validates the `date` parameter.
- Queries `final_schedule` LEFT JOIN `shifts` and `employees` and uses `COALESCE` to fall back to legacy `final_schedule` fields when JOINs fail.
- Parses `required_stations` JSON for each row with try/catch and returns the array.

GET `/final/week/:startDate` (lines 405–473): final schedule for a week
- Computes `endDate` as start + 6 days.
- Fetches final schedule rows for the range, parses `required_stations`, and returns results.

GET `/dashboard/week-summary/:weekStart` (lines 476–610): dashboard summary
- Aggregates `assignments` for the week and `allShifts` to compute coverage rate.
- Detects overlapping shift conflicts by comparing start/end times for assignments sharing the same `employee_id` and date.
- Returns `assignments`, `conflicts`, `coverageRate`, `totalShifts`, `coveredShifts`.

GET `/dashboard/employee-utilization/:weekStart` (lines 612–684): employee utilization
- Queries non-admin employees and computes scheduled hours using SQL `SUM(TIME_TO_SEC(TIMEDIFF(s.endTime, s.startTime)) / 3600)`.
- Calculates per-employee utilization percentage vs `maxHoursPerWeek` and returns averages and details.

GET `/dashboard/monthly-overview` & `/dashboard/recent-activity` (lines 686–800): reporting endpoints
- Monthly overview: computes current and last month stats and coverage rate comparisons.
- Recent activity: collects a variety of recent events (schedule publications, availability submissions, new employees, assignments) and formats them with `timeAgo` strings.

Notes & recommendations:
- The file mixes SQL queries, business logic, and endpoint handlers. Consider moving heavy SQL aggregation and conflict detection into service modules to keep routes tidy and easier to test.
- Conflict detection and scheduling algorithms should live in `services/` so they can be tested independently and replaced with more advanced implementations later.
- Sanitize and validate inputs more strictly (e.g., ensure dates follow `YYYY-MM-DD`, and check numeric types) before DB operations.
