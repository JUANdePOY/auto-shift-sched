# Fix Availability API 400 Errors

## Tasks
- [x] Analyze the 400 error issue with /api/availability/week/:weekStart endpoint
- [x] Identify missing endpoint in server routes
- [x] Add GET /week/:weekStart endpoint to availability routes
- [ ] Test the new endpoint functionality

## Root Cause
The frontend AdminAvailabilityGrid component calls availabilityService.getWeeklySubmissions() which makes a GET request to /api/availability/week/:weekStart, but this endpoint was not defined in the server routes, causing 400 Bad Request errors.

## Solution
Added the missing endpoint to server/features/availability/routes/availability.js with proper validation and database querying.

## Changes Made
- Added GET /week/:weekStart endpoint that:
  - Validates weekStart parameter using validateWeekStartStatus middleware
  - Queries availability_submissions table joined with employees table
  - Returns all submissions for the given week with employee details
  - Uses safeJsonParse for availability data
  - Includes proper error handling
