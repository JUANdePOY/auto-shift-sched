# useAssignmentHandlers — Line-by-line explanation

Source: [frontend/src/features/schedule/hooks/useAssignmentHandlers.ts](frontend/src/features/schedule/hooks/useAssignmentHandlers.ts#L1-L300)

Overview: This hook provides UI event handlers for assignment flows: assign/unassign employees, add/edit/delete shifts, save final schedule, and apply AI suggestions. It works against a local `assignments` array and calls higher-level context functions to persist changes.

Annotated Walkthrough:

1. `import { useState, useEffect } from 'react';` — standard React hooks used for local state.
2. `import { toast } from 'sonner';` — lightweight UI feedback for success/error toasts.
3. `import { updateShift } from '../services/scheduleService';` — service function used to persist shift edits to backend.
4. `import type { ShiftAssignment, Employee, NewShiftForm, EditShiftForm } from '../types/shiftAssignmentTypes';` — typed shapes used by the hook.
5. `import { getAvailableEmployees, getShiftType, calculateEndTime } from '../utils/shiftAssignmentUtils';` — helpers for availability checks, shift typing, and end time calculation.

7–18. `interface UseAssignmentHandlersParams { ... }` — defines the hook's input contract. Important fields:
- `assignments` & `setAssignments`: current local assignment list and its setter.
- `employees`: available employees (used for assignment lookups & availability logic).
- `onSaveFinalSchedule`: optional callback to persist a final schedule for a date.
- `updateAssignment`: a context-level updater used to sync assignment changes globally.

20–31. Hook initialization sets up three pieces of local UI state:
- `newShiftForm`: stores values for creating a new temporary shift.
- `editingShift`: holds the shift being edited (or `null`).
- `showAddDialog`: boolean to toggle the Add Shift dialog UI.

33–58. `handleAssignEmployee(shiftId, employeeId)` — primary assignment handler:
- Logs the call (useful for debugging in dev).
- Finds the `Employee` by `employeeId` and the `ShiftAssignment` by `shiftId`.
- Constructs `shiftData` (title, times, department, stations) to pass along with the assignment.
- Calls `updateAssignment(date, shiftId, employeeId, employee, shiftData)` which is responsible for updating the shared state and possibly triggering downstream persistence or side effects.

60–65. `handleUnassignEmployee(shiftId)` — simply calls `updateAssignment(date, shiftId, null)` to clear an assignment.

67–88. `handleSaveSchedule()` — saves the day's final schedule:
- Verifies `onSaveFinalSchedule` is available.
- Filters `assignments` to only include assigned shifts and maps them to `{shiftId, employeeId}` objects.
- Calls `onSaveFinalSchedule(date, formattedAssignments)` and on success calls `clearAssignmentsForDate(date)` and shows a success toast.
- Errors are logged and surfaced with a toast.

90–116. `handleAddShift()` — client-only temporary shift creation:
- Validates required fields and shows an error toast if missing.
- Creates a `ShiftAssignment` with a temporary id `shift-${Date.now()}`, calculates `endTime` using `calculateEndTime`, sets `type` via `getShiftType`, lowercases `requiredStation` entries, appends to `assignments`, resets the form, and shows success toast.

118–123. `handleDeleteShift(shiftId)` — removes a temporary shift locally and shows success toast.

125–127. `handleEditShift(shift)` — marks a shift for editing in `editingShift` state (UI-driven).

129–196. `handleSaveEdit(shiftId, editForm)` — saves edited shift details:
- `formatTime` helper ensures times are HH:MM:SS when sending to the DB.
- Calls `updateShift()` to persist changes to the backend.
- Updates local `assignments` via `setAssignments` with a map that:
  - Updates `time`, `endTime`, `department`, `requiredStation`.
  - Recomputes `type`.
  - Re-evaluates the assigned employee's eligibility using `getAvailableEmployees(...)`.
  - Unassigns employees and marks status as `unassigned` if they no longer match the edited parameters.
- Shows success or failure toasts and logs errors.

198–200. `handleCloseEditDialog()` — clear edit state.

202–209. `handleApplyAISuggestion(suggestion)` — extracts `shiftId` and `employeeId` from the suggestion and forwards to `handleAssignEmployee`. The hook itself does not compute suggestions.

211–222. `handleStationToggle(stationName)` & `handleFormChange(field, value)` — utilities to manage `newShiftForm` state in a predictable way.

Return contract (lines ~224–260): the hook returns the form state, dialog toggles, and all handler functions. This makes the hook easy to use within the schedule UI.

Notes & best practices:
- Keep assertions and side effectful code (toasts, console logs) in the hook so the component remains purely presentational.
- Heavy logic (availability filtering, eligibility checks) is in `utils/shiftAssignmentUtils.ts` — this keeps the hook simple and testable.
- Persisted operations (e.g., `updateShift`) are delegated to services; the hook handles local state reconciliation.
