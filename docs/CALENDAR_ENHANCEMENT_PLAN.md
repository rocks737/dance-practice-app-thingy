# Calendar Enhancement Plan

## Overview
Enhance the schedule availability calendar to show actual dates, grey out past dates, and allow week navigation.

## Current State
- Calendar uses a fixed reference week (Dec 31, 2023 - Jan 6, 2024)
- No date information displayed (only day names like "Monday")
- No navigation controls between weeks
- Past dates are not visually distinguished
- Week starts on Sunday (correct), but date is fixed

## Goals
1. Show actual dates in calendar headers (e.g., "Sunday, Jan 14")
2. Make Sunday-Sunday consistent week navigation
3. Grey out past dates while keeping events visible
4. Add navigation arrows to move between weeks

## Implementation Plan

### 1. Update Calendar Utilities (`lib/schedule/calendar.ts`)

**Changes needed:**
- Remove fixed `REFERENCE_WEEK_START` approach
- Add function `getWeekStart(date)` to get Sunday of any given week
- Update `windowToEvent()` to accept a week start date parameter
- Update `windowsToEvents()` to accept and use current week start
- Keep the logic that maps day-of-week to dates, but make it dynamic

**Key functions to modify:**
```typescript
// Add: Get Sunday of the week containing the given date
export function getWeekStart(date: Date): Date {
  const day = date.getDay(); // 0 = Sunday
  const diff = day; // Days to subtract to get to Sunday
  const weekStart = addDays(date, -diff);
  return startOfDay(weekStart); // Reset to midnight
}

// Update: windowToEvent now takes a weekStart parameter
export function windowToEvent(
  window: AvailabilityWindow, 
  weekStart: Date
): AvailabilityEvent { ... }

// Update: windowsToEvents now takes a weekStart parameter
export function windowsToEvents(
  windows: AvailabilityWindow[],
  weekStart: Date
): AvailabilityEvent[] { ... }
```

### 2. Configure Localizer for Sunday Start (`lib/schedule/calendar.ts`)

**Changes needed:**
- Ensure `startOfWeek` from date-fns uses Sunday (weekStartsOn: 0)
- Update localizer configuration if needed

**Code:**
```typescript
import { startOfWeek as startOfWeekFns } from "date-fns";

// Create custom startOfWeek that always starts on Sunday
const startOfWeekSunday = (date: Date) => 
  startOfWeekFns(date, { weekStartsOn: 0 });

export const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: startOfWeekSunday,
  getDay,
  locales,
});
```

### 3. Add Week Navigation Component (`components/schedule/ScheduleAvailabilityCalendar.tsx`)

**Changes needed:**
- Initialize `currentDate` to current date (not fixed reference)
- Calculate week start dynamically from `currentDate`
- Add navigation buttons (Previous Week / Next Week)
- Add "Today" button to jump to current week
- Update `events` calculation to use current week start

**New UI elements:**
```tsx
// Navigation toolbar above calendar
<div className="flex items-center justify-between mb-4">
  <Button onClick={goToPreviousWeek} variant="outline" size="sm">
    <ChevronLeft /> Previous Week
  </Button>
  <div className="text-center">
    <Button onClick={goToToday} variant="ghost" size="sm">
      Today
    </Button>
    <p className="text-sm text-muted-foreground">
      {formatWeekRange(currentWeekStart)}
    </p>
  </div>
  <Button onClick={goToNextWeek} variant="outline" size="sm">
    Next Week <ChevronRight />
  </Button>
</div>
```

### 4. Update Date Formatting (`components/schedule/ScheduleAvailabilityCalendar.tsx`)

**Changes needed:**
- Update `dayFormat` in `formats` to show date + day name
- Format: "Sunday, Jan 14" instead of just "Sunday"

**Code:**
```typescript
formats={{
  dayFormat: (date: Date) => {
    // Show day name and date: "Sunday, Jan 14"
    return format(date, "EEEE, MMM d");
  },
  dayHeaderFormat: (date: Date) => {
    return format(date, "EEEE, MMM d");
  },
}}
```

### 5. Style Past Dates (`components/schedule/calendar-custom.css`)

**Changes needed:**
- Add CSS to grey out past day columns
- Use opacity or muted colors for past dates
- Ensure events in past dates remain visible but styled differently
- Use CSS classes based on date comparison

**CSS approach:**
```css
/* Grey out past dates */
.rbc-time-view .rbc-day-slot.past-date {
  opacity: 0.5;
  background-color: hsl(var(--muted) / 0.3);
}

/* Keep events visible in past dates but slightly dimmed */
.rbc-time-view .rbc-day-slot.past-date .rbc-event {
  opacity: 0.7;
}

/* Style past date headers */
.rbc-time-view .rbc-header.past-date {
  color: hsl(var(--muted-foreground));
  opacity: 0.6;
}
```

**Implementation:**
- Use `components` prop or custom `dayPropGetter` to add `past-date` class
- Compare each day's date to today's date

### 6. Update Event Creation Logic

**Changes needed:**
- When user creates/updates events via drag/drop, ensure we still extract day-of-week correctly
- The `eventToWindow()` function should continue to work (it already extracts day from date)

**No changes needed to `eventToWindow()` - it already handles this correctly.**

### 7. Handle Week Boundaries

**Considerations:**
- When user navigates to different weeks, availability windows should still display correctly
- Since availability is day-of-week based, same windows show every week
- Events get re-rendered with new dates but same day-of-week mapping

## Implementation Order

1. ✅ Update localizer to ensure Sunday start (quick check)
2. ✅ Add `getWeekStart()` utility function
3. ✅ Update `windowToEvent()` and `windowsToEvents()` to accept week start
4. ✅ Update calendar component to use current date and calculate week start
5. ✅ Add navigation controls (Previous/Next/Today buttons)
6. ✅ Update date formatting to show actual dates
7. ✅ Add CSS styling for past dates
8. ✅ Add `dayPropGetter` to apply past-date classes
9. ✅ Test navigation, date display, and past date styling

## Testing Checklist

- [ ] Calendar shows current week by default
- [ ] Week starts on Sunday consistently
- [ ] Navigation arrows move week correctly
- [ ] "Today" button jumps to current week
- [ ] Date headers show actual dates (e.g., "Sunday, Jan 14")
- [ ] Past dates are greyed out
- [ ] Events in past dates are still visible but dimmed
- [ ] Creating new availability windows works correctly
- [ ] Dragging/resizing events works across different weeks
- [ ] Day-of-week mapping is consistent (Sunday = 0, Monday = 1, etc.)

## Files to Modify

1. `frontend/src/lib/schedule/calendar.ts` - Utility functions
2. `frontend/src/components/schedule/ScheduleAvailabilityCalendar.tsx` - Main component
3. `frontend/src/components/schedule/calendar-custom.css` - Styling

## Dependencies

- `date-fns` - Already in use for date manipulation
- `react-big-calendar` - Already in use
- Need to import `ChevronLeft`, `ChevronRight` icons from `lucide-react`

