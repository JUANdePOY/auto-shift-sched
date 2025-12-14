# Crew (Employee) Feature — Deep Dive

Overview
--------
The Crew (employee) feature is the worker-facing part of the app; it exposes a lightweight dashboard where crew members can view upcoming shifts, submit or edit availability, and update their profile.

Structure
- `components/`
  - `CrewDashboard.tsx` — the employee landing page (shows profile, stats, upcoming shifts)
  - `CrewProfile.tsx` — profile details and edit UI
  - `CrewUpcomingShifts.tsx` — list of upcoming shifts
  - `CrewAvailabilityPanel.tsx` — employee availability editor
- `hooks/`
  - `useCrewData.ts` — loads profile, upcoming shifts, stats and availability; exposes `submitAvailability` and `updateAvailability` helpers
- `services/`
  - `crewService.ts` — endpoints for profile, upcoming shifts, stats, availability
- `types/`
  - `CrewProfile`, `CrewShift`, `CrewStats`, `CrewAvailability`

Representative hook: `useCrewData`

Highlights:

1. `useCrewData(employeeId)` orchestrates multiple requests on mount (profile, upcoming shifts, stats, availability) and exposes simple helpers:

```ts
export function useCrewData(employeeId: string) {
  const [profile, setProfile] = useState(null);
  const [upcomingShifts, setUpcomingShifts] = useState([]);
  const [stats, setStats] = useState(null);
  const [availability, setAvailability] = useState(null);

  useEffect(() => { load(); }, [employeeId]);

  async function load() {
    const data = await crewService.getProfile(employeeId);
    const shifts = await crewService.getUpcomingShifts(employeeId);
    const stats = await crewService.getStats(employeeId);
    const avail = await crewService.getAvailability(employeeId, weekStart);
    setProfile(data); setUpcomingShifts(shifts); setStats(stats); setAvailability(avail);
  }

  return { profile, upcomingShifts, stats, availability, submitAvailability, updateAvailability };
}
```

2. `CrewUpcomingShifts` is intentionally simple and display-only; clicking a shift may open a detailed view for the crew member.

Security model
- Crew actions are limited to their own data, enforced by the backend. The frontend shows/hides UI based on the authenticated user's role.

Best practices
- Keep `crewService` mapping between the app's `CrewAvailability` format and the server's `AvailabilitySubmission` format.
- Design `useCrewData` to be resilient to partial failures (profile may load but availability may not) and show graceful UI fallbacks.
