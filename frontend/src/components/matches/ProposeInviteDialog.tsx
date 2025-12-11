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
import { CalendarClock, Loader2, Send, Sparkles } from "lucide-react";
import { Calendar as BigCalendar, type SlotInfo } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
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
  proposePracticeSession,
} from "@/lib/matches/api";

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

function toInputValue(date: Date): string {
  const pad = (v: number) => v.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(":").map((v) => parseInt(v, 10));
  return { hour: h ?? 0, minute: m ?? 0 };
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
}

export function ProposeInviteDialog({ match }: ProposeInviteDialogProps) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [note, setNote] = useState("");
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<OverlapSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayName = useMemo(() => {
    return match.displayName || `${match.firstName} ${match.lastName}`.trim() || "your match";
  }, [match.displayName, match.firstName, match.lastName]);

  useEffect(() => {
    if (!open) {
      setError(null);
      setSuccess(null);
      setStart("");
      setEnd("");
      setNote("");
      setSelectedRange(null);
      return;
    }

    const load = async () => {
      setLoadingSuggestions(true);
      setError(null);
      try {
        const rows = await fetchOverlapSuggestions(match.profileId);
        setSuggestions(rows);

        // Prefill the first suggestion if none chosen yet
        if (rows.length > 0 && !start && !end) {
          applySuggestion(rows[0]);
        }
      } catch (err) {
        console.error("Failed to load overlap suggestions", err);
        setSuggestions([]);
        setError(err instanceof Error ? err.message : "Unable to load suggestions");
      } finally {
        setLoadingSuggestions(false);
      }
    };

    void load();
  }, [open, match.profileId]); // eslint-disable-line react-hooks/exhaustive-deps

  function applySuggestion(suggestion: OverlapSuggestion) {
    const startDate = nextOccurrence(suggestion.dayOfWeek, suggestion.startTime);
    const endDate = new Date(startDate);
    const endParts = parseTime(suggestion.endTime);
    endDate.setHours(endParts.hour, endParts.minute, 0, 0);

    // If end is before start (shouldn't happen), push by a day
    if (endDate <= startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }

    setStart(toInputValue(startDate));
    setEnd(toInputValue(endDate));
    setSelectedRange({ start: startDate, end: endDate });
    setWeekStart(getWeekStart(startDate));
  }

  const overlapWindows: AvailabilityWindow[] = useMemo(() => {
    const mapped: AvailabilityWindow[] = [];

    for (const sugg of suggestions) {
      const normalizedDay = (sugg.dayOfWeek ?? "").toUpperCase();
      if (!DAY_OF_WEEK_VALUES.includes(normalizedDay as any)) {
        continue;
      }
      mapped.push({
        dayOfWeek: normalizedDay as AvailabilityWindow["dayOfWeek"],
        startTime: sugg.startTime,
        endTime: sugg.endTime,
        recurring: true,
      });
    }

    return mapped;
  }, [suggestions]);

  const overlapEvents = useMemo(
    () => windowsToEvents(overlapWindows, weekStart),
    [overlapWindows, weekStart],
  );

  const calendarEvents = useMemo(() => {
    if (!selectedRange) {
      return overlapEvents;
    }
    return [
      ...overlapEvents,
      {
        id: "selected-range",
        title: "Selected time",
        start: selectedRange.start,
        end: selectedRange.end,
      },
    ];
  }, [overlapEvents, selectedRange]);

  const handleSelectSlot = (slot: SlotInfo) => {
    const slotStart = roundToQuarterHour(new Date(slot.start));
    const slotEnd = roundToQuarterHour(new Date(slot.end));

    if (!isValidDuration(slotStart, slotEnd, 15)) {
      toast.error("Please select at least 15 minutes.");
      return;
    }

    const isInsideOverlap = overlapEvents.some(
      (event) =>
        slotStart >= event.start &&
        slotEnd <= event.end &&
        event.start.toDateString() === slotStart.toDateString(),
    );

    if (!isInsideOverlap) {
      toast.error("Pick a time inside the overlapping availability blocks.");
      return;
    }

    setSelectedRange({ start: slotStart, end: slotEnd });
    setStart(toInputValue(slotStart));
    setEnd(toInputValue(slotEnd));
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

      const startIso = new Date(start).toISOString();
      const endIso = new Date(end).toISOString();

      await proposePracticeSession({
        inviteeProfileId: match.profileId,
        start: startIso,
        end: endIso,
        note: note.trim() || null,
      });

      setSuccess("Invite sent! They can accept or decline from their invites.");
      setOpen(false);
    } catch (err) {
      console.error("Failed to propose session", err);
      setError(err instanceof Error ? err.message : "Unable to send invite");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full">
          <CalendarClock className="mr-2 h-4 w-4" />
          Propose time
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
              Overlap blocks: {overlapEvents.length} • Selected: {selectedRange ? "Yes" : "No"}
            </p>
            <div className="h-[420px] rounded-md border bg-muted/20 p-2">
              {mounted ? (
                <BigCalendar
                  localizer={localizer}
                  events={calendarEvents}
                  date={weekStart}
                  view="week"
                  toolbar={false}
                  selectable
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
                    const isSelected = (event as any)?.id === "selected-range";
                    const overlapBg = "rgba(59, 130, 246, 0.35)"; // blue-500, translucent
                    const overlapBorder = "rgba(59, 130, 246, 0.95)";
                    const selectedBg = "rgba(52, 211, 153, 0.6)"; // emerald-400
                    const selectedBorder = "rgba(52, 211, 153, 1)";

                    if (isSelected) {
                      return {
                        style: {
                          backgroundColor: selectedBg,
                          borderColor: selectedBorder,
                          color: "#0b0f19",
                          boxShadow: `0 0 0 1px ${selectedBorder}`,
                        },
                      };
                    }

                    return {
                      style: {
                        backgroundColor: overlapBg,
                        borderColor: overlapBorder,
                        color: "#0b0f19",
                        boxShadow: `inset 0 0 0 1px ${overlapBorder}, 0 0 0 1px ${overlapBorder}`,
                        backgroundImage:
                          "repeating-linear-gradient(45deg, rgba(59,130,246,0.45), rgba(59,130,246,0.45) 6px, rgba(59,130,246,0.2) 6px, rgba(59,130,246,0.2) 12px)",
                      },
                    };
                  }}
                  formats={{
                    dayFormat: (date: Date) =>
                      date.toLocaleDateString("en-US", {
                        weekday: "long",
                      }),
                    dayHeaderFormat: "EEEE, MMM d",
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

