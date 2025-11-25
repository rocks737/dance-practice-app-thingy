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
import { Info, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { addWeeks, addDays, startOfToday } from "date-fns";
import { Button } from "@/components/ui/button";

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

  // Handle slot selection (user clicks/drags on empty calendar space)
  const handleSelectSlot = useCallback(
    (slotInfo: SlotInfo) => {
      const start = roundToQuarterHour(slotInfo.start);
      const end = roundToQuarterHour(slotInfo.end);

      if (!isValidDuration(start, end, 15)) {
        toast.error("Availability window must be at least 15 minutes");
        return;
      }

      const newWindow = eventToWindow(start, end);

      // Check for duplicate
      const isDuplicate = windows.some(
        (w) =>
          w.dayOfWeek === newWindow.dayOfWeek &&
          w.startTime === newWindow.startTime &&
          w.endTime === newWindow.endTime,
      );

      if (isDuplicate) {
        toast.error("This time slot is already added");
        return;
      }

      onCreateWindow(newWindow);
      toast.success("Availability window added");
    },
    [windows, onCreateWindow],
  );

  // Handle event selection (user clicks on existing event)
  const handleSelectEvent = useCallback(
    (event: object) => {
      const availEvent = event as AvailabilityEvent;
      const confirmed = window.confirm(
        `Remove availability on ${DAY_OF_WEEK_LABELS[availEvent.dayOfWeek]} ${availEvent.startTime} - ${availEvent.endTime}?`,
      );

      if (confirmed) {
        const windowToDelete: AvailabilityWindow = {
          dayOfWeek: availEvent.dayOfWeek,
          startTime: availEvent.startTime,
          endTime: availEvent.endTime,
        };
        onDeleteWindow(windowToDelete);
        toast.success("Availability window removed");
      }
    },
    [onDeleteWindow],
  );

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
      };
      const newWindow = eventToWindow(roundedStart, roundedEnd);

      onUpdateWindow(oldWindow, newWindow);
      toast.success("Availability window updated");
    },
    [onUpdateWindow],
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
      };
      const newWindow = eventToWindow(roundedStart, roundedEnd);

      onUpdateWindow(oldWindow, newWindow);
      toast.success("Availability window updated");
    },
    [onUpdateWindow],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
        <div className="space-y-1 text-muted-foreground">
          <p>
            <strong className="text-foreground">Click and drag</strong> on empty slots to
            add availability windows.
          </p>
          <p>
            <strong className="text-foreground">Click existing blocks</strong> to remove
            them.
          </p>
          <p>
            <strong className="text-foreground">Drag blocks</strong> to change day/time,
            or resize to adjust duration.
          </p>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between rounded-lg border bg-background p-3">
        <Button onClick={goToPreviousWeek} variant="outline" size="sm">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous Week
        </Button>
        <div className="flex flex-col items-center gap-1">
          <Button onClick={goToToday} variant="ghost" size="sm">
            Today
          </Button>
          <p className="text-sm font-medium text-foreground">{weekRangeText}</p>
        </div>
        <Button onClick={goToNextWeek} variant="outline" size="sm">
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
            const baseStyle = {
              backgroundColor: "hsl(var(--primary))",
              borderColor: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
            };

            // Dim events in past dates slightly
            if (isPastDate(availEvent.start)) {
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
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Times are in your local timezone. All windows snap to 15-minute intervals.
      </p>
    </div>
  );
}
