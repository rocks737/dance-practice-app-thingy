"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
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
import { Info, ChevronLeft, ChevronRight, Repeat, Loader2 } from "lucide-react";
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
  onCreateWindow: (window: AvailabilityWindow) => Promise<void> | void;
  /**
   * Callback when an existing window is updated via drag/resize
   */
  onUpdateWindow: (oldWindow: AvailabilityWindow, newWindow: AvailabilityWindow) => Promise<void> | void;
  /**
   * Callback when a window is deleted
   */
  onDeleteWindow: (window: AvailabilityWindow) => Promise<void> | void;
}

export function ScheduleAvailabilityCalendar({
  windows,
  onCreateWindow,
  onUpdateWindow,
  onDeleteWindow,
}: ScheduleAvailabilityCalendarProps) {
  // Determine if mobile based on window width
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<View>("week");
  // Start with current date, calendar will show the week containing this date
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Combine mobile detection and view update in a single effect
  // to prevent race condition where view="week" but views=["day"]
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 640; // sm breakpoint
      setIsMobile(mobile);
      // Update view immediately when mobile state changes
      // This ensures view is always consistent with the views array
      setView(mobile ? "day" : "week");
    };
    
    checkMobile();
    setMounted(true);
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Calculate the Sunday of the current week being displayed
  const currentWeekStart = useMemo(() => getWeekStart(currentDate), [currentDate]);

  // Calculate events - use currentWeekStart for both views to ensure proper event generation
  // The calendar will filter events to show only the relevant day in day view
  const events = useMemo(
    () => {
      try {
        // Ensure windows is an array
        if (!Array.isArray(windows)) {
          console.warn("Windows is not an array:", windows);
          return [];
        }
        
        console.log("[CALENDAR] Generating events for windows:", windows.length, "weekStart:", currentWeekStart);
        
        const allEvents = windowsToEvents(windows, currentWeekStart);
        
        console.log("[CALENDAR] Generated events:", allEvents.length);
        
        // Filter out any invalid events and log them
        const validEvents = allEvents.filter((event) => {
          if (!event) {
            console.warn("Undefined event found");
            return false;
          }
          if (!event.title) {
            console.warn("Event missing title:", event);
            return false;
          }
          if (!event.start || !event.end) {
            console.warn("Event missing start/end:", event);
            return false;
          }
          if (!event.id) {
            console.warn("Event missing id:", event);
            return false;
          }
          return true;
        });
        
        console.log("[CALENDAR] Valid events:", validEvents.length, validEvents);
        
        return validEvents;
      } catch (error) {
        console.error("Error generating calendar events:", error);
        return [];
      }
    },
    [windows, currentWeekStart],
  );

  // Calculate date range for the current week
  const { start: minDate, end: maxDate } = useMemo(
    () => getCalendarDateRange(currentDate),
    [currentDate],
  );

  // Today's date for comparison (start of day)
  const today = useMemo(() => startOfToday(), []);

  // Navigation handlers - work for both day and week views
  const goToPrevious = useCallback(() => {
    setCurrentDate((prev) => isMobile ? addDays(prev, -1) : addWeeks(prev, -1));
  }, [isMobile]);

  const goToNext = useCallback(() => {
    setCurrentDate((prev) => isMobile ? addDays(prev, 1) : addWeeks(prev, 1));
  }, [isMobile]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Format date range for display
  const dateRangeText = useMemo(() => {
    if (isMobile) {
      // Show single day: "Monday, Jan 15, 2024"
      return format(currentDate, "EEEE, MMM d, yyyy");
    } else {
      // Show week range: "Jan 14 - Jan 20, 2024"
      const endDate = addDays(currentWeekStart, 6);
      return `${format(currentWeekStart, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
    }
  }, [currentDate, currentWeekStart, isMobile]);

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
          (w.recurring ?? true) === (newWindow.recurring ?? true) &&
          w.specificDate === newWindow.specificDate,
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

        try {
          // Delete recurring pattern first and wait for it to complete
          await onDeleteWindow(oldWindow);
          // Then create the one-time window
          await onCreateWindow(oneTimeWindow);
          toast.success("Converted to one-time availability for this date only");
        } catch (error) {
          toast.error("Failed to convert to one-time");
          console.error(error);
        }
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

        try {
          // Delete one-time window first and wait for it to complete
          await onDeleteWindow(oldWindow);
          // Then create the recurring pattern
          await onCreateWindow(recurringWindow);
          toast.success("Converted to recurring (appears every week)");
        } catch (error) {
          toast.error("Failed to convert to recurring");
          console.error(error);
        }
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
      
      // Add defensive check
      if (!event || !start || !end) {
        console.error("Invalid event drop data:", data);
        toast.error("Invalid event data");
        return;
      }
      
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
      
      // Add defensive check
      if (!event || !start || !end) {
        console.error("Invalid event resize data:", data);
        toast.error("Invalid event data");
        return;
      }
      
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

  // Don't render calendar until component is mounted and we have valid events
  if (!mounted || !events) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-xs sm:text-sm">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
        <div className="space-y-1 text-muted-foreground">
          <p>
            <strong className="text-foreground">Click and drag</strong> on empty slots to
            add recurring availability.
          </p>
          <p>
            <strong className="text-foreground">Right-click blocks</strong> to delete them.
          </p>
          <p className="hidden sm:block">
            <strong className="text-foreground">Drag blocks</strong> to change day/time,
            or resize to adjust duration.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded flex-shrink-0" style={{ backgroundColor: "hsl(var(--primary))" }} />
              <span className="text-xs">Recurring (every week)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between rounded-lg border bg-background p-3">
        <Button type="button" onClick={goToPrevious} variant="outline" size="sm" className="flex-shrink-0">
          <ChevronLeft className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">{isMobile ? "Previous" : "Previous Week"}</span>
        </Button>
        <div className="flex flex-col items-center gap-1 px-2">
          <Button type="button" onClick={goToToday} variant="outline" size="sm" className="text-xs sm:text-sm">
            Today
          </Button>
          <p className="text-xs sm:text-sm font-medium text-foreground text-center">{dateRangeText}</p>
        </div>
        <Button type="button" onClick={goToNext} variant="outline" size="sm" className="flex-shrink-0">
          <span className="hidden sm:inline">{isMobile ? "Next" : "Next Week"}</span>
          <ChevronRight className="h-4 w-4 sm:ml-1" />
        </Button>
      </div>

      <div className="rounded-lg border bg-background p-2 sm:p-4" style={{ height: isMobile ? "500px" : "600px" }}>
        <Calendar
          key={`${view}-${currentDate.toISOString()}`}
          localizer={localizer}
          events={events || []}
          view={view}
          onView={setView}
          views={isMobile ? ["day"] : ["week", "day"]}
          defaultView={isMobile ? "day" : "week"}
          date={isMobile ? currentDate : currentWeekStart}
          onNavigate={(newDate: Date) => {
            if (isMobile) {
              setCurrentDate(newDate);
            } else {
              // Ensure we store the week start for consistency in week view
              setCurrentDate(getWeekStart(newDate));
            }
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
              // For day view, show just the day name
              if (isMobile) {
                return format(date, "EEEE");
              }
              // For week view, show day name and date
              return format(date, "EEEE, MMM d");
            },
            dayHeaderFormat: (date: Date) => {
              if (isMobile) {
                return format(date, "EEEE");
              }
              return format(date, "EEEE, MMM d");
            },
            timeGutterFormat: (date: Date) => {
              // Shorter time format on mobile
              return format(date, isMobile ? "ha" : "h:mm a");
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
            // Add defensive check
            if (!event) {
              return {
                style: {
                  backgroundColor: "hsl(var(--primary))",
                  borderColor: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                },
              };
            }
            
            const availEvent = event as AvailabilityEvent;
            
            // Check if required properties exist
            if (!availEvent.end) {
              console.warn("Event missing end time:", availEvent);
              return {
                style: {
                  backgroundColor: "hsl(var(--primary))",
                  borderColor: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                },
              };
            }
            
            const baseColor = "hsl(var(--primary))";
            
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
              // Add defensive check
              if (!event) return null;
              
              const availEvent = event as AvailabilityEvent;
              
              // Add another defensive check for required properties
              if (!availEvent.title) {
                console.warn("Event missing title:", availEvent);
                return null;
              }

              return (
                <ContextMenu>
                  <ContextMenuTrigger asChild>
                    <div className="flex h-full w-full flex-col gap-0.5 px-1 py-0.5 text-left">
                      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide opacity-80">
                        <Repeat className="h-3 w-3 flex-shrink-0" />
                        <span>Recurring</span>
                      </div>
                      <span className="text-xs leading-tight whitespace-normal break-words">
                        {availEvent.title}
                      </span>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem
                      onClick={() => handleDeleteEvent(availEvent)}
                      className="text-destructive"
                    >
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
