# employeeService — Line-by-line explanation

Source: [frontend/src/features/employees/services/employeeService.ts](frontend/src/features/employees/services/employeeService.ts#L1-L200)

Overview: A small service module that centralizes API calls related to `employees`. It handles auth headers, CRUD operations, and returns typed responses for hooks or components to consume.

Annotated Walkthrough:

1. `import type { Employee } from '../../shared/types';` — Uses shared `Employee` type to strongly type responses and requests.

3. `const API_URL = '/api/employees';` — Single source of truth for the employee base endpoint.

5–10. `getAuthHeaders()` helper:
- Reads `authToken` from `localStorage` and returns `Content-Type` header with an optional `Authorization` header when a token exists.
- Returning a `HeadersInit` object keeps fetch calls succinct and consistent.

13–23. `getAllEmployees()`:
- Fetches `API_URL` with `getAuthHeaders()`.
- Throws a descriptive `Error` when response is not OK so callers can handle it.

25–35. `getAllEmployeesIncludingAdmins()`:
- Fetches `API_URL + '/all'` for admin UI flows where admins need to see every user.

37–48. `getEmployeeById(id)`:
- Fetches `API_URL/:id` and throws on failure.

50–62. `createEmployee(employeeData)`:
- POSTs to `API_URL` with `getAuthHeaders()` and `JSON.stringify` body.
- Returns the created employee object.

64–77. `updateEmployee(id, employeeData)`:
- PUTs to `API_URL/:id` with the partial employee payload and returns the updated object.

79–92. `deleteEmployee(id)`:
- DELETEs `API_URL/:id` and returns a `{ message }` response. Uses `getAuthHeaders()` for authorization.

Best practices & notes:
- Keep services small and focused: each method does a single HTTP request, converts HTTP errors to thrown exceptions, and returns typed data.
- Avoid toasts or UI logic here—let hooks or calling components handle presentation and retries.
