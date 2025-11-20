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
  roundToQuarterHour,
  isValidDuration,
  type AvailabilityEvent,
} from "@/lib/schedule/calendar";
import { Info } from "lucide-react";
import { toast } from "sonner";

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
  const [currentDate, setCurrentDate] = useState(() => getCalendarDateRange().start);
  const events = useMemo(() => windowsToEvents(windows), [windows]);
  const { start: minDate, end: maxDate } = useMemo(() => getCalendarDateRange(), []);

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
          w.endTime === newWindow.endTime
      );
      
      if (isDuplicate) {
        toast.error("This time slot is already added");
        return;
      }

      onCreateWindow(newWindow);
      toast.success("Availability window added");
    },
    [windows, onCreateWindow]
  );

  // Handle event selection (user clicks on existing event)
  const handleSelectEvent = useCallback(
    (event: object) => {
      const availEvent = event as AvailabilityEvent;
      const confirmed = window.confirm(
        `Remove availability on ${DAY_OF_WEEK_LABELS[availEvent.dayOfWeek]} ${availEvent.startTime} - ${availEvent.endTime}?`
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
    [onDeleteWindow]
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
    [onUpdateWindow]
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
    [onUpdateWindow]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
        <div className="space-y-1 text-muted-foreground">
          <p>
            <strong className="text-foreground">Click and drag</strong> on empty slots to add availability windows.
          </p>
          <p>
            <strong className="text-foreground">Click existing blocks</strong> to remove them.
          </p>
          <p>
            <strong className="text-foreground">Drag blocks</strong> to change day/time, or resize to adjust duration.
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-background p-4" style={{ height: "600px" }}>
        <Calendar
          localizer={localizer}
          events={events}
          view={view}
          onView={setView}
          views={["week"]}
          defaultView="week"
          date={currentDate}
          onNavigate={setCurrentDate}
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
              // getDay() returns 0-6 where 0=Sunday
              const jsDay = date.getDay();
              // Map to our enum: Sunday=0, Monday=1, etc.
              const dayMap = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;
              const dayOfWeek = dayMap[jsDay] as typeof DAY_OF_WEEK_VALUES[number];
              return DAY_OF_WEEK_LABELS[dayOfWeek];
            },
          }}
          eventPropGetter={() => ({
            style: {
              backgroundColor: "hsl(var(--primary))",
              borderColor: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
            },
          })}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Times are in your local timezone. All windows snap to 15-minute intervals.
      </p>
    </div>
  );
}

