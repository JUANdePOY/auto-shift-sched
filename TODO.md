# Crew Profile Enhancement TODO

## Backend Changes
- [x] Add change password endpoint to `server/features/auth/routes/auth.js`
- [x] Implement password change logic with validation (current password verification, new password requirements)

## Frontend Types
- [x] Update `frontend/src/features/crew/types/index.ts` - Add email to CrewProfile interface
- [x] Update `frontend/src/features/auth/types/index.ts` - Add password change types

## Frontend Services
- [x] Update `frontend/src/features/auth/services/authService.ts` - Add changePassword method

## Frontend Components
- [x] Update `frontend/src/features/crew/components/CrewProfile.tsx` - Display email and add password change form

## Testing
- [ ] Test password change functionality end-to-end
- [ ] Verify UI integration with existing profile layout
- [ ] Ensure proper error handling and user feedback
