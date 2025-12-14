# Architecture & Big Picture

## 1. Big Picture

You are building an Auto Shift Scheduler with two user types:

- **Admin**: creates employees, assigns shifts, manages schedules, oversees the system.
- **Crew**: views their own schedule, submits availability, and updates their profile.

Frontend: React + Vite + TypeScript (UI only)
Backend: Separate API + Database (server enforces authentication and RBAC)

## 2. Architectural Idea

Main rule: Feature-Based Architecture — each feature owns its own components, hooks, services, and types.

Benefits:
- Clear responsibilities
- Easier to scale and debug
- Isolates domain logic so teams can work independently

Folder layout (example):

features/
  auth/
  employee/
  schedule/
  crew/
  availability/
  ai-suggestions/

Each feature should include: `components/`, `services/`, `hooks/`, `types/` (and `context/` if needed).

## 3. Role-Based Access Control (RBAC)

- **Admin**: full access (create/read/update/delete)
- **Crew**: read-only schedule access, update own profile and availability

Enforcement:
- Frontend: hides UI based on role stored in Auth context
- Backend: validates role on every protected API route (truth source)

## 4. Data Flow

Typical flow for any action:
User action → Component → Hook → Service → API → Database → Response → Hook/Service updates state → Component re-renders

Key rules:
- Components never call APIs directly.
- Hooks orchestrate logic and error handling.
- Services only talk to the backend and return typed data.

## 5. Why this architecture works

- Clean separation of concerns
- Easier testing and mocking (services can be swapped out)
- Readable flows for business rules and AI logic
