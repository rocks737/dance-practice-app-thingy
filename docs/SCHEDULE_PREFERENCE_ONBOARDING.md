# Schedule Preference Onboarding - Step 4

## Overview

Added a new Step 4 to the sign-up flow that requires users to set at least one schedule availability preference before completing onboarding.

## What Was Added

### New Component
**`/frontend/src/app/signup/schedule-preference-step.tsx`**

A simplified version of the full schedule preference form designed for onboarding:

#### Required Fields
- **At least one availability window** (day of week + time range)
- **Preferred roles** (defaults to both Leader and Follower)

#### Optional Fields
- **Focus areas** (Connection, Technique, Musicality, etc.)
- **Additional notes** (max 500 characters)

#### Intentionally Simplified
These fields are available in the full `/schedule` page but omitted from onboarding:
- Preferred skill levels (can be set later)
- Location preferences (can be set later)
- Max travel distance (can be set later)

## User Flow

```
Step 1: Email & Password
   ↓
Step 1.5: Email Verification
   ↓
Step 2: Personal Information
   ↓
Step 3: Dance Profile
   ↓
Step 4: Set Availability ← NEW!
   ↓
Complete → Redirect to Schedule
```

## UI Features

### 1. Availability Windows
- **Default**: One time slot pre-filled (Monday 6:00 PM - 8:00 PM)
- **Add more**: "+ Add time slot" button
- **Remove**: Trash icon (only if more than one slot)
- **Fields**: Day of week (dropdown), Start time, End time

### 2. Preferred Roles
- Checkboxes for Leader and Follower
- Both selected by default

### 3. Focus Areas (Optional)
- Grid of checkboxes
- 9 options: Connection, Technique, Musicality, Competition prep, Styling, Social dancing, Choreography, Mindset, Conditioning

### 4. Notes (Optional)
- Single-line input field
- Max 500 characters
- Placeholder: "Any specific requirements or preferences?"

### 5. Navigation
- **Back button**: Returns to Step 3 (Dance Profile)
- **Complete Setup button**: Validates and creates schedule preference

## Validation

```typescript
- availabilityWindows: min 1 window required
- Each window must have:
  - Valid day of week
  - Valid time format (HH:mm)
  - End time after start time
- Notes: max 500 characters
- Preferred roles: defaults to both if none selected
```

## Technical Details

### Data Flow
1. User completes Step 3 → Profile created in `user_profiles` table
2. Profile ID passed to Step 4
3. User sets availability → Schedule preference created in `schedule_preferences` table
4. Redirect to `/schedule` or return URL

### API Call
```typescript
await createSchedulePreference({
  userId: profileId,
  data: {
    availabilityWindows: [...],
    preferredRoles: [...],
    preferredLevels: [], // Empty for onboarding
    preferredFocusAreas: [...],
    preferredLocationIds: [], // Empty for onboarding
    maxTravelDistanceKm: null,
    locationNote: null,
    notes: string | null,
  },
});
```

### Progress Indicator
Updated to show **4 steps** instead of 3:
1. Create Account ✓
2. Personal Info ✓
3. Dance Profile ✓
4. Availability ← New!

## Benefits

### For Users
- ✅ **Immediate value**: Can be matched with practice partners right away
- ✅ **Low friction**: Only requires one time slot minimum
- ✅ **Quick setup**: Takes ~30 seconds to complete
- ✅ **Clear purpose**: Users understand why this info is needed
- ✅ **Can refine later**: Full schedule page has more options

### For the Platform
- ✅ **Better engagement**: Users have actionable schedule data from day 1
- ✅ **Matching quality**: Can immediately match users based on availability
- ✅ **Data collection**: Gather availability data during high-motivation signup
- ✅ **Reduced friction**: No need to prompt for schedule later
- ✅ **Onboarding completion**: Users less likely to abandon incomplete profiles

## Testing

### Test Scenario 1: Complete Flow
1. Go through Steps 1-3
2. On Step 4, verify default time slot is present
3. Modify day/time as desired
4. Select focus areas (optional)
5. Click "Complete Setup"
6. Verify redirect to `/schedule`
7. Check Supabase `schedule_preferences` table for new entry

### Test Scenario 2: Add Multiple Slots
1. Reach Step 4
2. Click "+ Add time slot"
3. Set different day/time
4. Click "+ Add time slot" again
5. Complete setup
6. Verify all slots saved correctly

### Test Scenario 3: Validation
1. Reach Step 4
2. Remove the default time slot (should show error)
3. Try to submit (should be blocked)
4. Add a time slot back
5. Submit successfully

### Test Scenario 4: Back Navigation
1. Reach Step 4
2. Click "Back" button
3. Verify return to Step 3
4. Click "Continue" to return to Step 4
5. Verify availability data is preserved

## Future Enhancements

### Short-term
- [ ] Add calendar view option (like full schedule page)
- [ ] Show suggested time slots based on common practice times
- [ ] Add timezone selection/detection

### Long-term
- [ ] Social proof: "80% of users practice on Tuesday evenings"
- [ ] Smart defaults based on user's profile (competitive users → weekday evenings)
- [ ] Import from Google Calendar
- [ ] Recurring vs one-time slots toggle

## Comparison: Onboarding vs Full Schedule

| Feature | Onboarding (Step 4) | Full Schedule Page |
|---------|-------------------|-------------------|
| Availability Windows | ✅ Required (min 1) | ✅ Full control |
| Preferred Roles | ✅ Basic checkboxes | ✅ Same |
| Preferred Skill Levels | ❌ Skipped | ✅ Full control |
| Focus Areas | ✅ Optional | ✅ Same |
| Location Preferences | ❌ Skipped | ✅ Full control |
| Max Travel Distance | ❌ Skipped | ✅ Can specify |
| Location Notes | ❌ Skipped | ✅ Can specify |
| Notes | ✅ Simple input (500 chars) | ✅ Textarea |
| Calendar View | ❌ List only | ✅ List or Calendar |
| Multiple Preferences | ❌ One only | ✅ Multiple |

## Help Text for Users

**Step 4 header:**
> "Set Your Availability"
> Let us know when you're available to practice. You can add more details later!

**Availability section:**
> "When can you practice?"
> Add at least one time slot when you're typically available

**Footer note:**
> "Don't worry, you can add more details like locations and skill levels in your schedule page later!"

This reassures users that:
1. This is quick and simple
2. They can refine later
3. They're not locked into these choices

## Migration Guide

### For Existing Users
No migration needed! Existing users who signed up before this change:
- Already have profiles without schedule preferences (OK)
- Will be prompted to add schedule when they visit `/schedule` page
- Middleware only checks for profile completion, not schedule preferences

### For New Users (After This Change)
- Must complete all 4 steps including schedule availability
- Will have at least one schedule preference upon completion
- Can immediately be matched with practice partners

## Technical Notes

### Why Not Make This Optional?
We require at least one availability window because:
1. **Core value prop**: Practice partner matching requires availability
2. **Higher quality matches**: Users with schedules get better matches
3. **Low barrier**: Only one time slot needed (takes 30 seconds)
4. **Immediate value**: Users can be matched right away
5. **Data quality**: Better than asking later when motivation is lower

### Error Handling
- If schedule preference creation fails, user stays on Step 4
- Error message shown with retry option
- User's input is preserved (not lost)
- Can use "Back" button if needed

### Performance
- No additional API calls needed (uses existing `/schedule-preferences` API)
- Single Supabase insert operation
- Minimal UI overhead (reuses existing components)

## Summary

✅ **Added**: Step 4 for schedule availability
✅ **Required**: At least one availability window
✅ **Optional**: Focus areas and notes
✅ **Simplified**: Intentionally minimal for onboarding
✅ **Extensible**: Full schedule page has all advanced options
✅ **Tested**: No linter errors, follows existing patterns
✅ **Documented**: Updated all docs and testing checklists

Users now complete a more comprehensive onboarding that sets them up for immediate success with practice partner matching! 🎉

