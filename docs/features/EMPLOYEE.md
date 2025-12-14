# Employee Feature — Deep Dive

Overview
--------
The Employee feature manages CRUD for employee records, used by admins to onboard and maintain staff. It also provides data (non-admin employees) to scheduling logic.

Structure
- `components/`
  - `Employees.tsx` — main admin listing and actions
  - `EmployeeList.tsx`, `EmployeeCard.tsx`, `EmployeeModal.tsx` — smaller UI pieces
- `hooks/`
  - `useEmployees.ts` — load employees, add, edit, delete, and local-state helpers like `updateEmployeeHours`
- `services/`
  - `employeeService.ts` — API calls to `/api/employees` (get, create, update, delete)
- `types/`
  - `Employee`, `EmployeeFormData`, `EmployeeFilters`

Representative hook: `useEmployees`

Key behaviors (line-by-line highlights):

```ts
const fetchEmployees = async () => {
  try {
    setLoading(true);
    setError(null);
    const fetchedEmployees = includeAdmins ? await getAllEmployeesIncludingAdmins() : await getAllEmployees();
    setEmployees(fetchedEmployees);
  } catch (err) {
    const appError = createAppError(err, 'Failed to fetch employees');
    setError(appError.message);
    if (shouldShowErrorToUser(appError)) toast.error(appError.message);
    logError(appError, 'fetchEmployees');
  } finally {
    setLoading(false);
  }
};
```

- `useEmployees` centralizes user-facing error handling (toasts) and logging. Services throw simple `Error` objects; hooks adapt them into `appError` structures for consistent UX.

Service example: `createEmployee`

```ts
export async function createEmployee(employeeData) {
  const response = await fetch(API_URL, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(employeeData) });
  if (!response.ok) throw new Error('Failed to create employee');
  return response.json();
}
```

Security & validations
- Employee forms should validate required fields in the UI using shared `validation.ts` utilities.
- Backend should always verify roles (admin-only) for create/update/delete endpoints.

Best practices
- Keep local-only updates (like `updateEmployeeHours`) in hooks.
- Keep HTTP calls in services and avoid UI logic there.
