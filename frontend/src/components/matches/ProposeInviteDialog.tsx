"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarClock, ChevronLeft, ChevronRight, Loader2, Send, Sparkles } from "lucide-react";
import { addDays, addWeeks, format, startOfDay, startOfToday } from "date-fns";
import { Calendar as BigCalendar, type SlotInfo } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "@/components/schedule/calendar-custom.css";
import {
  getWeekStart,
  isValidDuration,
  localizer,
  roundToQuarterHour,
  windowsToEvents,
} from "@/lib/schedule/calendar";
import { DAY_OF_WEEK_VALUES, type AvailabilityWindow } from "@/lib/schedule/types";
import { toast } from "sonner";
import {
  type EnrichedMatch,
  type OverlapSuggestion,
  fetchOverlapSuggestions,
  fetchPendingInviteBlocks,
  type PendingInviteBlock,
  proposePracticeSession,
} from "@/lib/matches/api";
import { dateToDatetimeLocal, datetimeLocalToIso } from "@/lib/datetime";

const DAY_INDEX: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

const DAY_LABEL: Record<string, string> = {
  SUNDAY: "Sunday",
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
};

const DnDCalendar = withDragAndDrop(BigCalendar as any);

function formatWeekRange(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  // e.g. "Dec 24 – Dec 30"
  return `${format(weekStart, "MMM d")} – ${format(end, "MMM d")}`;
}

function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(":").map((v) => parseInt(v, 10));
  return { hour: h ?? 0, minute: m ?? 0 };
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function nextOccurrence(day: string, time: string): Date {
  const now = new Date();
  const targetDay = DAY_INDEX[day] ?? 0;
  const { hour, minute } = parseTime(time);

  const candidate = new Date(now);
  const delta = (targetDay - now.getDay() + 7) % 7;
  candidate.setDate(now.getDate() + delta);
  candidate.setHours(hour, minute, 0, 0);

  // If time has already passed today, jump a week
  if (candidate <= now) {
    candidate.setDate(candidate.getDate() + 7);
  }

  return candidate;
}

interface ProposeInviteDialogProps {
  match: EnrichedMatch;
  onInviteSent?: () => void;
}

export function ProposeInviteDialog({ match, onInviteSent }: ProposeInviteDialogProps) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [note, setNote] = useState("");
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<OverlapSuggestion[]>([]);
  const [loadingPendingInvites, setLoadingPendingInvites] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<PendingInviteBlock[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [hideEmptyDays, setHideEmptyDays] = useState(true);
  const today = useMemo(() => startOfToday(), []);

  const isPastDate = (date: Date) => startOfDay(date) < today;

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayName = useMemo(() => {
    return match.displayName || `${match.firstName} ${match.lastName}`.trim() || "your match";
  }, [match.displayName, match.firstName, match.lastName]);

  useEffect(() => {
    if (!open) {
      setError(null);
      setWarning(null);
      setSuccess(null);
      setStart("");
      setEnd("");
      setNote("");
      setSelectedRange(null);
      setHideEmptyDays(true);
      setPendingInvites([]);
      return;
    }

    const load = async () => {
      setLoadingSuggestions(true);
      setLoadingPendingInvites(true);
      setError(null);
      try {
        const [rows, pending] = await Promise.all([
          fetchOverlapSuggestions(match.profileId),
          fetchPendingInviteBlocks().catch((e) => {
            console.warn("Failed to load pending invites for overlap blocks", e);
            return [] as PendingInviteBlock[];
          }),
        ]);

        setSuggestions(rows);
        setPendingInvites(pending);
        setWarning(null);

        // Prefill the first suggestion that doesn't overlap an existing pending invite (if any).
        if (rows.length > 0 && !start && !end) {
          const overlapErrorMessage =
            "You already have a proposed session that overlaps this time. Please pick a different slot.";

          const overlapsOutgoingPending = (startDate: Date, endDate: Date) =>
            pending.some((inv) => {
              if (inv.direction !== "SENT") return false;
              const s = inv.session?.scheduledStart ? new Date(inv.session.scheduledStart) : null;
              const e = inv.session?.scheduledEnd ? new Date(inv.session.scheduledEnd) : null;
              if (!s || !e) return false;
              return startDate < e && endDate > s;
            });

          let applied = false;
          for (const sugg of rows) {
            const startDate = nextOccurrence(sugg.dayOfWeek, sugg.startTime);
            const endDate = new Date(startDate);
            const endParts = parseTime(sugg.endTime);
            endDate.setHours(endParts.hour, endParts.minute, 0, 0);
            const preferredEnd = addMinutes(startDate, 60);
            const clampedEnd =
              preferredEnd <= endDate
                ? preferredEnd
                : endDate > startDate
                  ? endDate
                  : preferredEnd;

            if (!overlapsOutgoingPending(startDate, clampedEnd)) {
              applySuggestion(sugg);
              applied = true;
              break;
            }
          }

          // If every suggested window overlaps an existing pending invite, don't prefill.
          if (!applied && pending.length > 0) {
            toast.info(overlapErrorMessage);
          }
        }
      } catch (err) {
        console.error("Failed to load overlap suggestions", err);
        setSuggestions([]);
        setError(err instanceof Error ? err.message : "Unable to load suggestions");
      } finally {
        setLoadingSuggestions(false);
        setLoadingPendingInvites(false);
      }
    };

    void load();
  }, [open, match.profileId]); // eslint-disable-line react-hooks/exhaustive-deps

  function applySuggestion(suggestion: OverlapSuggestion) {
    const startDate = nextOccurrence(suggestion.dayOfWeek, suggestion.startTime);
    const endDate = new Date(startDate);
    const endParts = parseTime(suggestion.endTime);
    endDate.setHours(endParts.hour, endParts.minute, 0, 0);

    // Default to a 1-hour slot inside the suggested window
    const preferredEnd = addMinutes(startDate, 60);
    const clampedEnd = preferredEnd <= endDate ? preferredEnd : endDate > startDate ? endDate : preferredEnd;

    setStart(dateToDatetimeLocal(startDate));
    setEnd(dateToDatetimeLocal(clampedEnd));
    setSelectedRange({ start: startDate, end: clampedEnd });
    setWeekStart(getWeekStart(startDate));
  }

  const overlapWindows: AvailabilityWindow[] = useMemo(() => {
    const mapped: AvailabilityWindow[] = [];

    for (const sugg of suggestions) {
      const normalizedDay = (sugg.dayOfWeek ?? "").trim().toUpperCase();
      if (!DAY_OF_WEEK_VALUES.includes(normalizedDay as any)) {
        continue;
      }
      // Normalize times to HH:mm for calendar utilities
      const startTime = sugg.startTime?.slice(0, 5);
      const endTime = sugg.endTime?.slice(0, 5);
      if (!startTime || !endTime) {
        continue;
      }
      mapped.push({
        dayOfWeek: normalizedDay as AvailabilityWindow["dayOfWeek"],
        startTime,
        endTime,
        recurring: true,
      });
    }

    return mapped;
  }, [suggestions]);

  const overlapEvents = useMemo(() => {
    const now = new Date();
    // windowsToEvents already hides recurring windows in past weeks; additionally hide
    // events that have fully ended (past time) within the current week/day.
    return windowsToEvents(overlapWindows, weekStart)
      .map((e) => ({ ...e, kind: "overlap" as const }))
      .filter((event) => event.end > now);
  }, [overlapWindows, weekStart]);

  const pendingInviteIntervals = useMemo(() => {
    return pendingInvites
      .map((inv) => {
        const s = inv.session?.scheduledStart ? new Date(inv.session.scheduledStart) : null;
        const e = inv.session?.scheduledEnd ? new Date(inv.session.scheduledEnd) : null;
        if (!s || !e) return null;
        return { start: s, end: e, inv };
      })
      .filter(Boolean) as { start: Date; end: Date; inv: PendingInviteBlock }[];
  }, [pendingInvites]);

  const pendingInviteEvents = useMemo(() => {
    const now = new Date();
    const rangeStart = weekStart;
    const rangeEnd = addDays(weekStart, 7);

    return pendingInviteIntervals
      .filter(({ start, end }) => end > now)
      .filter(({ start, end }) => start < rangeEnd && end > rangeStart)
      .map(({ start, end, inv }) => {
        const other = inv.otherUser?.displayName || `${inv.otherUser?.firstName ?? ""} ${inv.otherUser?.lastName ?? ""}`.trim();
        const title = other ? `Pending invite (${other})` : "Pending invite";
        return {
          id: `pending-${inv.inviteId}`,
          title,
          start,
          end,
          kind: "pending-invite" as const,
        };
      });
  }, [pendingInviteIntervals, weekStart]);

  const overlapDays = useMemo(() => {
    const days = new Set<number>();
    overlapEvents.forEach((e) => days.add(e.start.getDay()));
    pendingInviteEvents.forEach((e) => days.add(e.start.getDay()));
    return days;
  }, [overlapEvents, pendingInviteEvents]);

  const isWithinOverlap = useMemo(
    () => (startDate: Date, endDate: Date) =>
      overlapEvents.some((event) => {
        const sameDay = event.start.getDay() === startDate.getDay();
        if (!sameDay) return false;

        const toMinutes = (d: Date) => d.getHours() * 60 + d.getMinutes();
        const startMin = toMinutes(startDate);
        const endMin = toMinutes(endDate);
        const eventStart = toMinutes(event.start);
        const eventEnd = toMinutes(event.end);

        return startMin >= eventStart && endMin <= eventEnd;
      }),
    [overlapEvents],
  );

  const overlapsOutgoingPendingInvite = useMemo(
    () => (startDate: Date, endDate: Date) =>
      pendingInviteIntervals.some(
        ({ start, end, inv }) => inv.direction === "SENT" && startDate < end && endDate > start,
      ),
    [pendingInviteIntervals],
  );

  const overlapsIncomingPendingInvite = useMemo(
    () => (startDate: Date, endDate: Date) =>
      pendingInviteIntervals.some(
        ({ start, end, inv }) =>
          inv.direction === "RECEIVED" && startDate < end && endDate > start,
      ),
    [pendingInviteIntervals],
  );

  const incomingOverlapWarning = useMemo(
    () => (startDate: Date, endDate: Date) => {
      const match = pendingInviteIntervals.find(
        ({ start, end, inv }) =>
          inv.direction === "RECEIVED" && startDate < end && endDate > start,
      );
      if (!match) return null;

      const who =
        match.inv.otherUser?.displayName ||
        `${match.inv.otherUser?.firstName ?? ""} ${match.inv.otherUser?.lastName ?? ""}`.trim();
      return who
        ? `Heads up: you have a pending invite from ${who} that overlaps this time. You can still propose, but you may want to decline/cancel that invite first.`
        : "Heads up: you have a pending incoming invite that overlaps this time. You can still propose, but you may want to decline it first.";
    },
    [pendingInviteIntervals],
  );

  const calendarEvents = useMemo(() => {
    if (!selectedRange) {
      return [...overlapEvents, ...pendingInviteEvents];
    }
    return [
      ...overlapEvents,
      ...pendingInviteEvents,
      {
        id: "selected-range",
        title: "Selected time",
        start: selectedRange.start,
        end: selectedRange.end,
        kind: "selected" as const,
      },
    ];
  }, [overlapEvents, pendingInviteEvents, selectedRange]);

  const handleSelectSlot = (slot: SlotInfo) => {
    const slotStart = roundToQuarterHour(new Date(slot.start));
    const slotEnd = roundToQuarterHour(new Date(slot.end));

    if (!isValidDuration(slotStart, slotEnd, 15)) {
      toast.error("Please select at least 15 minutes.");
      return;
    }

    if (!isWithinOverlap(slotStart, slotEnd)) {
      toast.error("Pick a time inside the overlapping availability blocks.");
      return;
    }

    if (overlapsOutgoingPendingInvite(slotStart, slotEnd)) {
      toast.error(
        "You already have a proposed session that overlaps this time. Please pick a different slot.",
      );
      return;
    }

    // Soft-block incoming overlaps: warn but allow.
    setWarning(incomingOverlapWarning(slotStart, slotEnd));

    setSelectedRange({ start: slotStart, end: slotEnd });
    setStart(dateToDatetimeLocal(slotStart));
    setEnd(dateToDatetimeLocal(slotEnd));
  };

  const handleEventDrop = (data: any) => {
    if (!data?.event || !selectedRange) return;

    const durationMs = selectedRange.end.getTime() - selectedRange.start.getTime();
    const newStart = roundToQuarterHour(new Date(data.start));
    const proposedEnd = new Date(newStart.getTime() + durationMs);

    if (!isWithinOverlap(newStart, proposedEnd)) {
      toast.error("Move the selected time inside overlapping availability.");
      return;
    }

    if (overlapsOutgoingPendingInvite(newStart, proposedEnd)) {
      toast.error(
        "You already have a proposed session that overlaps this time. Please pick a different slot.",
      );
      return;
    }

    setWarning(incomingOverlapWarning(newStart, proposedEnd));

    setSelectedRange({ start: newStart, end: proposedEnd });
    setStart(dateToDatetimeLocal(newStart));
    setEnd(dateToDatetimeLocal(proposedEnd));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (!start || !end) {
        throw new Error("Please choose a start and end time.");
      }

      const startIso = datetimeLocalToIso(start);
      const endIso = datetimeLocalToIso(end);

      const startDate = new Date(startIso);
      const endDate = new Date(endIso);
      if (overlapsOutgoingPendingInvite(startDate, endDate)) {
        throw new Error(
          "You already have a proposed session that overlaps this time. Please pick a different slot.",
        );
      }

      // Soft-block incoming overlaps: warn but allow (covers manual datetime input too).
      setWarning(incomingOverlapWarning(startDate, endDate));

      await proposePracticeSession({
        inviteeProfileId: match.profileId,
        start: startIso,
        end: endIso,
        note: note.trim() || null,
      });

      setSuccess("Invite sent! They can accept or decline from their invites.");
      if (onInviteSent) {
        await onInviteSent();
      }
      setOpen(false);
    } catch (err) {
      console.error("Failed to propose session", err);
      const message = err instanceof Error ? err.message : "Unable to send invite";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          className="group relative w-full overflow-hidden transform-gpu transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-2 hover:ring-primary/30"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 [box-shadow:0_0_0_1px_hsl(var(--primary)/0.18),0_0_28px_hsl(var(--primary)/0.35)]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-y-6 -left-16 w-24 rotate-12 bg-white/20 blur-md opacity-0 transition-all duration-300 group-hover:left-[120%] group-hover:opacity-100 dark:bg-white/10"
          />
          <CalendarClock className="relative mr-2 h-4 w-4 transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-110" />
          <span className="relative">Propose time</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Propose a practice time</DialogTitle>
          <DialogDescription>
            Send {displayName} a proposed session based on your overlapping availability.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-200">
              {error}
            </div>
          )}
          {warning && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-900/30 p-3 text-sm text-amber-800 dark:text-amber-100">
              {warning}
            </div>
          )}
          {success && (
            <div className="rounded-md bg-emerald-50 dark:bg-emerald-900/30 p-3 text-sm text-emerald-700 dark:text-emerald-200">
              {success}
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="start">Start time</Label>
              <Input
                id="start"
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="end">End time</Label>
              <Input
                id="end"
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              placeholder="What do you want to work on?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {note.length}/500
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-medium">Suggested overlapping windows</p>
            </div>
            {loadingSuggestions ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading suggestions...
              </div>
            ) : suggestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No overlapping recurring windows found. You can still propose any time.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((sugg, idx) => {
                  const label = `${DAY_LABEL[sugg.dayOfWeek] ?? sugg.dayOfWeek} ${sugg.startTime.slice(0, 5)}–${sugg.endTime.slice(0, 5)}`;
                  return (
                    <Button
                      key={`${sugg.dayOfWeek}-${idx}-${sugg.startTime}`}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applySuggestion(sugg)}
                    >
                      <Badge variant="secondary" className="mr-2">
                        {DAY_LABEL[sugg.dayOfWeek] ?? sugg.dayOfWeek}
                      </Badge>
                      {sugg.startTime.slice(0, 5)}–{sugg.endTime.slice(0, 5)}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Pick a time inside the overlapping blocks</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Showing overlapping availability for this week. Drag on a block to set start/end.
            </p>
            {(loadingPendingInvites || pendingInvites.length > 0) && (
              <p className="text-xs text-muted-foreground">
                {loadingPendingInvites
                  ? "Loading your pending invites..."
                  : "Gray blocks show your existing pending invites (to avoid double-booking)."}
              </p>
            )}
            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setWeekStart(getWeekStart(addWeeks(weekStart, -1)))}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Prev
              </Button>
              <div className="text-center">
                <div className="text-xs font-medium text-muted-foreground">{formatWeekRange(weekStart)}</div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setWeekStart(getWeekStart(new Date()))}
                >
                  Today
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setWeekStart(getWeekStart(addWeeks(weekStart, 1)))}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                id="hide-empty-days"
                checked={hideEmptyDays}
                onCheckedChange={(v) => setHideEmptyDays(Boolean(v))}
              />
              <Label htmlFor="hide-empty-days" className="text-xs font-normal">
                Hide days without overlap
              </Label>
            </div>
            <div className="h-[420px] rounded-md border bg-muted/20 p-2">
              {mounted ? (
                <DnDCalendar
                  localizer={localizer}
                  events={calendarEvents}
                  date={weekStart}
                  view="week"
                  toolbar={false}
                  selectable="ignoreEvents"
                  resizable={false}
                  draggableAccessor={(event: any) => event?.id === "selected-range"}
                  resizableAccessor={() => false}
                  onEventDrop={handleEventDrop}
                  onSelectSlot={handleSelectSlot}
                  onNavigate={(date) => setWeekStart(getWeekStart(date))}
                  min={
                    new Date(
                      weekStart.getFullYear(),
                      weekStart.getMonth(),
                      weekStart.getDate(),
                      6,
                      0,
                      0,
                    )
                  }
                  max={
                    new Date(
                      weekStart.getFullYear(),
                      weekStart.getMonth(),
                      weekStart.getDate(),
                      23,
                      59,
                      59,
                    )
                  }
                  step={15}
                  timeslots={4}
                  eventPropGetter={(event) => {
                    const kind = (event as any)?.kind as string | undefined;
                    const eventId = String((event as any)?.id ?? "");
                    const isSelected = kind === "selected" || eventId === "selected-range";
                    const isPending = kind === "pending-invite" || eventId.startsWith("pending-");
                    const overlapBg = "rgba(59, 130, 246, 0.35)"; // blue-500, translucent
                    const overlapBorder = "rgba(59, 130, 246, 0.95)";
                    const selectedBg = "rgba(52, 211, 153, 0.6)"; // emerald-400
                    const selectedBorder = "rgba(52, 211, 153, 1)";
                    const pendingBg = "rgba(107, 114, 128, 0.35)"; // gray-500
                    const pendingBorder = "rgba(107, 114, 128, 0.95)";

                    if (isSelected) {
                      return {
                        className: "selected-range-event",
                        style: {
                          backgroundColor: selectedBg,
                          borderColor: selectedBorder,
                          color: "#0b0f19",
                          boxShadow: `0 0 0 1px ${selectedBorder}`,
                        },
                      };
                    }

                    if (isPending) {
                      return {
                        className: "existing-proposal-event",
                        style: {
                          backgroundColor: pendingBg,
                          borderColor: pendingBorder,
                          color: "#0b0f19",
                          boxShadow: `inset 0 0 0 1px ${pendingBorder}, 0 0 0 1px ${pendingBorder}`,
                          backgroundImage:
                            "repeating-linear-gradient(45deg, rgba(107,114,128,0.35), rgba(107,114,128,0.35) 6px, rgba(107,114,128,0.15) 6px, rgba(107,114,128,0.15) 12px)",
                        },
                      };
                    }

                    return {
                      className: "overlap-availability-event",
                      style: {
                        backgroundColor: overlapBg,
                        borderColor: overlapBorder,
                        color: "#0b0f19",
                        boxShadow: `inset 0 0 0 1px ${overlapBorder}, 0 0 0 1px ${overlapBorder}`,
                        backgroundImage:
                          "repeating-linear-gradient(45deg, rgba(59,130,246,0.45), rgba(59,130,246,0.45) 6px, rgba(59,130,246,0.2) 6px, rgba(59,130,246,0.2) 12px)",
                        // Make overlap windows thinner so there is click/drag space to the right
                        // for selecting a new slot.
                        width: "80%",
                        left: "0%",
                      },
                    };
                  }}
                  dayPropGetter={(date: Date) => {
                    const classes: string[] = [];
                    if (isPastDate(date)) {
                      classes.push("past-date");
                    }
                    if (hideEmptyDays && !overlapDays.has(date.getDay())) {
                      classes.push("no-overlap-day");
                    }
                    return classes.length ? { className: classes.join(" ") } : {};
                  }}
                  slotPropGetter={(date: Date) => {
                    const classes: string[] = [];
                    if (isPastDate(date)) {
                      classes.push("past-date");
                    }
                    if (hideEmptyDays && !overlapDays.has(date.getDay())) {
                      classes.push("no-overlap-day");
                    }
                    return classes.length ? { className: classes.join(" ") } : {};
                  }}
                  formats={{
                    // Week view headers (top of each day column)
                    dayFormat: (date: Date) => format(date, "EEEE, MMM d"),
                    dayHeaderFormat: (date: Date) => format(date, "EEEE, MMM d"),
                    timeGutterFormat: "h a",
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Loading calendar...
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Send invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

