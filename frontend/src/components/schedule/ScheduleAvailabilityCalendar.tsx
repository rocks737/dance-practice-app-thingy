"use client";

import { useCallback, useMemo, useState } from "react";
import { Calendar as BigCalendar, View, SlotInfo } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "./calendar-custom.css";
import {
  AvailabilityWindow,
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_VALUES,
} from "@/lib/schedule/types";
import {
  localizer,
  windowToEvent,
  eventToWindow,
  windowsToEvents,
  getCalendarDateRange,
  getWeekStart,
  roundToQuarterHour,
  isValidDuration,
  type AvailabilityEvent,
} from "@/lib/schedule/calendar";
import { Info, ChevronLeft, ChevronRight, Repeat, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { addWeeks, addDays, startOfToday } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

// Enable drag and drop
const Calendar = withDragAndDrop(BigCalendar);

interface ScheduleAvailabilityCalendarProps {
  /**
   * Current availability windows from the form
   */
  windows: AvailabilityWindow[];
  /**
   * Callback when a new window is created via calendar selection
   */
  onCreateWindow: (window: AvailabilityWindow) => void;
  /**
   * Callback when an existing window is updated via drag/resize
   */
  onUpdateWindow: (oldWindow: AvailabilityWindow, newWindow: AvailabilityWindow) => void;
  /**
   * Callback when a window is deleted
   */
  onDeleteWindow: (window: AvailabilityWindow) => void;
}

export function ScheduleAvailabilityCalendar({
  windows,
  onCreateWindow,
  onUpdateWindow,
  onDeleteWindow,
}: ScheduleAvailabilityCalendarProps) {
  const [view, setView] = useState<View>("week");
  // Start with current date, calendar will show the week containing this date
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Calculate the Sunday of the current week being displayed
  const currentWeekStart = useMemo(() => getWeekStart(currentDate), [currentDate]);

  // Calculate events for the current week
  const events = useMemo(
    () => windowsToEvents(windows, currentWeekStart),
    [windows, currentWeekStart],
  );

  // Calculate date range for the current week
  const { start: minDate, end: maxDate } = useMemo(
    () => getCalendarDateRange(currentDate),
    [currentDate],
  );

  // Today's date for comparison (start of day)
  const today = useMemo(() => startOfToday(), []);

  // Navigation handlers
  const goToPreviousWeek = useCallback(() => {
    setCurrentDate((prev) => addWeeks(prev, -1));
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentDate((prev) => addWeeks(prev, 1));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Format week range for display
  const weekRangeText = useMemo(() => {
    const endDate = addDays(currentWeekStart, 6); // Saturday
    return `${format(currentWeekStart, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
  }, [currentWeekStart]);

  // Check if a date is in the past (before today)
  const isPastDate = useCallback(
    (date: Date) => {
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      return dateStart < today;
    },
    [today],
  );

  // Check if an event's end time is in the past (for styling)
  const isEventInPast = useCallback(
    (eventEnd: Date) => {
      const now = new Date();
      return eventEnd < now;
    },
    [],
  );

  // Handle slot selection (user clicks/drags on empty calendar space)
  const handleSelectSlot = useCallback(
    (slotInfo: SlotInfo) => {
      const start = roundToQuarterHour(slotInfo.start);
      const end = roundToQuarterHour(slotInfo.end);

      if (!isValidDuration(start, end, 15)) {
        toast.error("Availability window must be at least 15 minutes");
        return;
      }

      if (start < new Date()) {
        toast.error("You can't add availability in the past");
        return;
      }

      const newWindow = eventToWindow(start, end);
      // Default to recurring
      newWindow.recurring = true;

      // Check for duplicate
      const isDuplicate = windows.some(
        (w) =>
          w.dayOfWeek === newWindow.dayOfWeek &&
          w.startTime === newWindow.startTime &&
          w.endTime === newWindow.endTime &&
          w.recurring === newWindow.recurring,
      );

      if (isDuplicate) {
        toast.error("This time slot is already added");
        return;
      }

      onCreateWindow(newWindow);
      toast.success("Recurring availability added");
    },
    [windows, onCreateWindow],
  );

  // Handle event selection (user clicks on existing event)
  const handleSelectEvent = useCallback(
    (event: object) => {
      // Context menu now handles all interactions
    },
    [],
  );

  // Toggle between recurring and one-time
  const handleToggleRecurring = useCallback(
    async (event: AvailabilityEvent) => {
      const oldWindow: AvailabilityWindow = {
        dayOfWeek: event.dayOfWeek,
        startTime: event.startTime,
        endTime: event.endTime,
        recurring: event.recurring,
        specificDate: event.specificDate,
      };

      const isCurrentlyRecurring = oldWindow.recurring !== false;

      if (isCurrentlyRecurring) {
        // Converting recurring → one-time:
        // 1. Delete the recurring pattern (removes all instances)
        // 2. Create a NEW one-time window for this specific date only
        const oneTimeWindow: AvailabilityWindow = {
          dayOfWeek: event.dayOfWeek,
          startTime: event.startTime,
          endTime: event.endTime,
          recurring: false,
          specificDate: format(event.start, "yyyy-MM-dd"),
        };

        // Delete recurring pattern first
        onDeleteWindow(oldWindow);
        // Then create the one-time window
        // Add a small delay to ensure delete completes first
        setTimeout(() => {
          onCreateWindow(oneTimeWindow);
        }, 100);
        
        toast.success("Converted to one-time availability for this date only");
      } else {
        // Converting one-time → recurring:
        // 1. Delete the one-time window
        // 2. Create a NEW recurring window
        const recurringWindow: AvailabilityWindow = {
          dayOfWeek: event.dayOfWeek,
          startTime: event.startTime,
          endTime: event.endTime,
          recurring: true,
          specificDate: undefined,
        };

        // Delete one-time window first
        onDeleteWindow(oldWindow);
        // Then create the recurring pattern
        setTimeout(() => {
          onCreateWindow(recurringWindow);
        }, 100);
        
        toast.success("Converted to recurring (appears every week)");
      }
    },
    [onDeleteWindow, onCreateWindow],
  );

  // Delete window
  const handleDeleteEvent = useCallback((event: AvailabilityEvent) => {
    const windowToDelete: AvailabilityWindow = {
      dayOfWeek: event.dayOfWeek,
      startTime: event.startTime,
      endTime: event.endTime,
      recurring: event.recurring,
      specificDate: event.specificDate,
    };

    onDeleteWindow(windowToDelete);
    toast.success("Availability window removed");
  }, [onDeleteWindow]);

  // Handle event drag/drop
  const handleEventDrop = useCallback(
    (data: any) => {
      const { event, start, end } = data;
      const roundedStart = roundToQuarterHour(new Date(start));
      const roundedEnd = roundToQuarterHour(new Date(end));

      if (!isValidDuration(roundedStart, roundedEnd, 15)) {
        toast.error("Availability window must be at least 15 minutes");
        return;
      }

      const oldWindow: AvailabilityWindow = {
        dayOfWeek: event.dayOfWeek,
        startTime: event.startTime,
        endTime: event.endTime,
        recurring: event.recurring,
        specificDate: event.specificDate,
      };
      
      const newWindow = eventToWindow(roundedStart, roundedEnd);
      
      // Check if this is a recurring event being moved from a past time
      const isRecurring = oldWindow.recurring !== false;
      const eventEndTime = new Date(event.end);
      const isEventInPastTime = isEventInPast(eventEndTime);
      
      if (isRecurring && isEventInPastTime) {
        // Convert this specific past instance to a one-time event
        // Keep the old recurring pattern as-is for future weeks
        toast.error("Cannot modify past recurring events. Past instances are preserved.");
        return;
      }
      
      // For current/future events, preserve the recurring status
      newWindow.recurring = oldWindow.recurring;
      newWindow.specificDate = oldWindow.specificDate;

      onUpdateWindow(oldWindow, newWindow);
      // Don't show toast - the UI update itself provides immediate feedback
    },
    [onUpdateWindow, isEventInPast],
  );

  // Handle event resize
  const handleEventResize = useCallback(
    (data: any) => {
      const { event, start, end } = data;
      const roundedStart = roundToQuarterHour(new Date(start));
      const roundedEnd = roundToQuarterHour(new Date(end));

      if (!isValidDuration(roundedStart, roundedEnd, 15)) {
        toast.error("Availability window must be at least 15 minutes");
        return;
      }

      const oldWindow: AvailabilityWindow = {
        dayOfWeek: event.dayOfWeek,
        startTime: event.startTime,
        endTime: event.endTime,
        recurring: event.recurring,
        specificDate: event.specificDate,
      };
      
      const newWindow = eventToWindow(roundedStart, roundedEnd);
      
      // Check if this is a recurring event being resized in the past
      const isRecurring = oldWindow.recurring !== false;
      const eventEndTime = new Date(event.end);
      const isEventInPastTime = isEventInPast(eventEndTime);
      
      if (isRecurring && isEventInPastTime) {
        // Prevent modifying past recurring events
        toast.error("Cannot modify past recurring events. Past instances are preserved.");
        return;
      }
      
      // For current/future events, preserve the recurring status
      newWindow.recurring = oldWindow.recurring;
      newWindow.specificDate = oldWindow.specificDate;

      onUpdateWindow(oldWindow, newWindow);
      // Don't show toast - the UI update itself provides immediate feedback
    },
    [onUpdateWindow, isEventInPast],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
        <div className="space-y-1 text-muted-foreground">
          <p>
            <strong className="text-foreground">Click and drag</strong> on empty slots to
            add recurring availability.
          </p>
          <p>
            <strong className="text-foreground">Right-click blocks</strong> to make them one-time
            only or delete them.
          </p>
          <p>
            <strong className="text-foreground">Drag blocks</strong> to change day/time,
            or resize to adjust duration.
          </p>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(var(--primary))" }} />
              <span className="text-xs">Recurring (every week)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(180 70% 45%)" }} />
              <span className="text-xs">One-time only</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between rounded-lg border bg-background p-3">
        <Button type="button" onClick={goToPreviousWeek} variant="outline" size="sm">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous Week
        </Button>
        <div className="flex flex-col items-center gap-1">
          <Button type="button" onClick={goToToday} variant="outline" size="sm">
            Today
          </Button>
          <p className="text-sm font-medium text-foreground">{weekRangeText}</p>
        </div>
        <Button type="button" onClick={goToNextWeek} variant="outline" size="sm">
          Next Week
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <div className="rounded-lg border bg-background p-4" style={{ height: "600px" }}>
        <Calendar
          localizer={localizer}
          events={events}
          view={view}
          onView={setView}
          views={["week"]}
          defaultView="week"
          date={currentWeekStart}
          onNavigate={(newDate: Date) => {
            // Ensure we store the week start for consistency
            setCurrentDate(getWeekStart(newDate));
          }}
          min={new Date(2024, 0, 1, 0, 0, 0)}
          max={new Date(2024, 0, 1, 23, 59, 59)}
          step={15}
          timeslots={4}
          selectable
          resizable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          toolbar={false}
          formats={{
            dayFormat: (date: Date) => {
              // Show day name and date: "Sunday, Jan 14"
              return format(date, "EEEE, MMM d");
            },
            dayHeaderFormat: (date: Date) => {
              // Same format for header
              return format(date, "EEEE, MMM d");
            },
          }}
          dayPropGetter={(date: Date) => {
            // Add 'past-date' class to past dates for styling
            if (isPastDate(date)) {
              return {
                className: "past-date",
              };
            }
            return {};
          }}
          slotPropGetter={(date: Date) => {
            // Also style time slots in past dates
            if (isPastDate(date)) {
              return {
                className: "past-date",
              };
            }
            return {};
          }}
          eventPropGetter={(event: object) => {
            const availEvent = event as AvailabilityEvent;
            const isRecurring = availEvent.recurring !== false;
            // Use teal/cyan for one-time events (more visible than chart-2)
            const baseColor = isRecurring ? "hsl(var(--primary))" : "hsl(180 70% 45%)"; // teal
            
            const baseStyle = {
              backgroundColor: baseColor,
              borderColor: baseColor,
              color: "hsl(var(--primary-foreground))",
            };

            // Dim events that have already ended (use event.end time, not just date)
            if (isEventInPast(availEvent.end)) {
              return {
                style: {
                  ...baseStyle,
                  opacity: 0.7,
                },
                className: "past-date-event",
              };
            }

            return {
              style: baseStyle,
            };
          }}
          components={{
            event: ({ event }: { event: object }) => {
              const availEvent = event as AvailabilityEvent;
              const isRecurring = availEvent.recurring !== false;
              
              return (
                <ContextMenu>
                  <ContextMenuTrigger asChild>
                    <div className="flex h-full w-full flex-col gap-0.5 px-1 py-0.5 text-left">
                      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide opacity-80">
                        {isRecurring ? (
                          <Repeat className="h-3 w-3 flex-shrink-0" />
                        ) : (
                          <CalendarIcon className="h-3 w-3 flex-shrink-0" />
                        )}
                        <span>{isRecurring ? "Recurring" : "One-time"}</span>
                      </div>
                      <span className="text-xs leading-tight whitespace-normal break-words">
                        {availEvent.title}
                      </span>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => handleToggleRecurring(availEvent)}>
                      {isRecurring ? "Make One-Time Only" : "Make Recurring"}
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleDeleteEvent(availEvent)} className="text-destructive">
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            },
          }}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Times are in your local timezone. All windows snap to 15-minute intervals.
      </p>
    </div>
  );
}
