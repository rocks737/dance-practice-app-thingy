"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  Loader2,
  MapPin,
  Plus,
  RefreshCcw,
  Search,
  Users,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { dateToDatetimeLocal, datetimeLocalToIso } from "@/lib/datetime";
import { fetchSessions, createSession, updateSession } from "@/lib/sessions/api";
import {
  SESSION_STATUS_OPTIONS,
  SESSION_STATUS_LABELS,
  SESSION_TYPE_OPTIONS,
  SESSION_TYPE_LABELS,
  SESSION_VISIBILITY_OPTIONS,
  SESSION_VISIBILITY_LABELS,
  SessionFilters,
  SessionListItem,
  SessionStatus,
  SessionType,
  SessionVisibility,
  defaultSessionFilters,
} from "@/lib/sessions/types";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface SessionsExplorerProps {
  authUserId: string;
}

const MULTI_FILTER_SECTIONS = [
  { key: "statuses", label: "Status", options: SESSION_STATUS_OPTIONS },
  { key: "sessionTypes", label: "Session type", options: SESSION_TYPE_OPTIONS },
  {
    key: "visibilities",
    label: "Visibility",
    options: SESSION_VISIBILITY_OPTIONS,
  },
] as const;

type MultiFilterKey = (typeof MULTI_FILTER_SECTIONS)[number]["key"];

const DEFAULT_SESSION_TYPE: SessionType = "PARTNER_PRACTICE";
const DEFAULT_SESSION_STATUS: SessionStatus = "PROPOSED";
const DEFAULT_SESSION_VISIBILITY: SessionVisibility = "PARTICIPANTS_ONLY";

export function SessionsExplorer({ authUserId }: SessionsExplorerProps) {
  const [draftFilters, setDraftFilters] = useState<SessionFilters>(defaultSessionFilters);
  const [activeFilters, setActiveFilters] =
    useState<SessionFilters>(defaultSessionFilters);
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const fetchIdRef = useRef(0);
  const focusAfterFetchRef = useRef<string | null>(null);
  const {
    profile,
    loading: profileLoading,
    error: profileError,
  } = useUserProfile(authUserId);
  const organizerId = profile?.id ?? null;

  useEffect(() => {
    const handler = setTimeout(() => setActiveFilters(draftFilters), 300);
    return () => clearTimeout(handler);
  }, [draftFilters]);

  const loadSessions = useCallback(async (filters: SessionFilters) => {
    setLoading(true);
    setError(null);
    const fetchId = ++fetchIdRef.current;
    try {
      const { sessions: data, total: count } = await fetchSessions({ filters });
      if (fetchId !== fetchIdRef.current) {
        return;
      }
      setSessions(data);
      setTotal(count);
      if (focusAfterFetchRef.current) {
        const match = data.find((session) => session.id === focusAfterFetchRef.current);
        if (match) {
          setExpandedId(match.id);
          focusAfterFetchRef.current = null;
        }
      }
    } catch (e) {
      if (fetchId !== fetchIdRef.current) {
        return;
      }
      console.error("Error loading sessions:", e);
      setError(
        e instanceof Error
          ? e.message
          : "Unable to load sessions. Please check your connection and try again.",
      );
    } finally {
      if (fetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadSessions(activeFilters);
  }, [activeFilters, loadSessions]);

  const appliedFiltersCount = useMemo(() => {
    return [
      draftFilters.searchText ? 1 : 0,
      draftFilters.statuses?.length ?? 0,
      draftFilters.sessionTypes?.length ?? 0,
      draftFilters.visibilities?.length ?? 0,
      draftFilters.fromDate ? 1 : 0,
      draftFilters.toDate ? 1 : 0,
    ].reduce((sum, value) => sum + value, 0);
  }, [draftFilters]);

  const toggleMultiFilter = (
    key: MultiFilterKey,
    value: SessionStatus | SessionType | SessionVisibility,
    checked: boolean,
  ) => {
    setDraftFilters((prev) => {
      const current = new Set<string>(
        ((prev[key] as string[] | undefined) ?? []) as string[],
      );
      if (checked) {
        current.add(value);
      } else {
        current.delete(value);
      }
      const nextValues = Array.from(current) as SessionFilters[MultiFilterKey];
      return { ...prev, [key]: nextValues };
    });
  };

  const handleDateChange = (field: "fromDate" | "toDate", value: string) => {
    setDraftFilters((prev) => ({ ...prev, [field]: value || undefined }));
  };

  const handleResetFilters = () => {
    setDraftFilters(defaultSessionFilters);
  };

  const handleRefresh = useCallback(
    () => loadSessions(activeFilters),
    [activeFilters, loadSessions],
  );

  const handleSessionCreated = useCallback(
    (sessionId: string) => {
      focusAfterFetchRef.current = sessionId;
      handleRefresh();
    },
    [handleRefresh],
  );

  const handleSessionUpdated = useCallback((updated: SessionListItem) => {
    setSessions((prev) =>
      prev.map((session) => (session.id === updated.id ? updated : session)),
    );
  }, []);

  const createDisabledReason = !organizerId
    ? "Complete your profile to create sessions."
    : profileLoading
      ? "Loading profile..."
      : undefined;

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {loading
            ? "Loading sessions..."
            : `Showing ${sessions.length} of ${total} sessions`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <CreateSessionDialog
            organizerId={organizerId}
            disabled={!organizerId || profileLoading}
            disabledReason={createDisabledReason}
            onSessionCreated={handleSessionCreated}
          />
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {!profileLoading && !organizerId && (
        <Alert variant="destructive">
          <AlertTitle>Profile required</AlertTitle>
          <AlertDescription>
            Create a dancer profile so we know who is organizing the session.
          </AlertDescription>
        </Alert>
      )}

      {profileError && (
        <Alert variant="destructive">
          <AlertTitle>Unable to load your profile</AlertTitle>
          <AlertDescription>{profileError.message}</AlertDescription>
        </Alert>
      )}

      {/* Collapsible horizontal filters */}
      <div className="rounded-lg border bg-card shadow-sm w-full">
        {/* Expanded state - full filters */}
        {filtersExpanded && (
          <div className="p-4 w-full">
            <button
              onClick={() => setFiltersExpanded(false)}
              className="w-full flex items-center justify-between mb-4 hover:opacity-70 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters</span>
                {appliedFiltersCount > 0 && (
                  <Badge variant="secondary">{appliedFiltersCount} active</Badge>
                )}
              </div>
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            </button>

            <div className="space-y-4 w-full">
              {/* Search and date range row */}
              <div className="grid gap-4 md:grid-cols-[1fr,auto,auto] w-full">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={draftFilters.searchText ?? ""}
                      onChange={(event) =>
                        setDraftFilters((prev) => ({
                          ...prev,
                          searchText: event.target.value,
                        }))
                      }
                      placeholder="Search by title, location..."
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">From date</label>
                  <Input
                    type="date"
                    value={draftFilters.fromDate ?? ""}
                    onChange={(event) => handleDateChange("fromDate", event.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">To date</label>
                  <Input
                    type="date"
                    value={draftFilters.toDate ?? ""}
                    onChange={(event) => handleDateChange("toDate", event.target.value)}
                  />
                </div>
              </div>

              {/* Filter chips row */}
              <div className="flex flex-wrap items-center gap-4">
                {MULTI_FILTER_SECTIONS.map((section) => (
                  <div key={section.key} className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {section.label}:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {section.options.map((option) => {
                        const isSelected =
                          (draftFilters[section.key] as string[] | undefined)?.includes(
                            option.value,
                          ) ?? false;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              toggleMultiFilter(section.key, option.value, !isSelected)
                            }
                            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background hover:bg-muted border-border"
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {appliedFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                    Clear all ({appliedFiltersCount})
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Collapsed state - thin bar */}
        {!filtersExpanded && (
          <button
            onClick={() => setFiltersExpanded(true)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors min-h-[52px]"
          >
            <div className="flex items-center gap-2 text-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Filters</span>
              {appliedFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {appliedFiltersCount} active
                </Badge>
              )}
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Sessions grid */}
      <div className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Unable to load sessions</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="flex items-center gap-2 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Fetching sessions...
          </div>
        )}

        {!loading && sessions.length === 0 && !error && (
          <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
            No sessions found matching your filters.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              expanded={expandedId === session.id}
              onToggle={() =>
                setExpandedId((current) => (current === session.id ? null : session.id))
              }
              canEdit={Boolean(organizerId) && session.organizer?.id === organizerId}
              onSessionUpdated={handleSessionUpdated}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface SessionCardProps {
  session: SessionListItem;
  expanded: boolean;
  onToggle: () => void;
  canEdit: boolean;
  onSessionUpdated: (session: SessionListItem) => void;
}

function SessionCard({
  session,
  expanded,
  onToggle,
  canEdit,
  onSessionUpdated,
}: SessionCardProps) {
  const startDate = new Date(session.scheduledStart);
  const endDate = new Date(session.scheduledEnd);
  const typeLabel = SESSION_TYPE_LABELS[session.sessionType] ?? session.sessionType;
  const statusLabel = SESSION_STATUS_LABELS[session.status] ?? session.status;
  const visibilityLabel =
    SESSION_VISIBILITY_LABELS[session.visibility] ?? session.visibility;

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">{session.title}</h3>
            <Badge variant="secondary">{typeLabel}</Badge>
            <Badge variant="outline">{statusLabel}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {format(startDate, "EEE, MMM d • h:mm a")} — {format(endDate, "h:mm a")} (
            {formatDistanceToNow(startDate, {
              addSuffix: true,
            })}
            )
          </p>
          {session.location && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="mr-1 h-4 w-4" />
              <span>
                {session.location.name ||
                  [session.location.city, session.location.state]
                    .filter(Boolean)
                    .join(", ") ||
                  "Location TBD"}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {session.participantCount}
              {session.capacity ? ` / ${session.capacity} spots` : " participants"}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between"
            onClick={onToggle}
          >
            {expanded ? "Hide details" : "View details"}
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 border-t pt-4 text-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <DetailRow
              icon={<Calendar className="h-4 w-4" />}
              label="Scheduled window"
              value={`${format(startDate, "PPpp")} → ${format(endDate, "PPpp")}`}
            />
            <DetailRow
              icon={<Eye className="h-4 w-4" />}
              label="Visibility"
              value={visibilityLabel}
            />
            <DetailRow
              icon={<Users className="h-4 w-4" />}
              label="Organizer"
              value={
                session.organizer
                  ? (session.organizer.displayName ??
                    `${session.organizer.firstName} ${session.organizer.lastName}`)
                  : "Unknown organizer"
              }
            />
          </div>
          <div className="mt-2">
            <DetailRow
              icon={<Clock className="h-4 w-4" />}
              label="Last updated"
              value={formatDistanceToNow(new Date(session.updatedAt), {
                addSuffix: true,
              })}
            />
          </div>

          {canEdit ? (
            <SessionQuickEdit session={session} onSessionUpdated={onSessionUpdated} />
          ) : (
            <p className="mt-4 text-xs text-muted-foreground">
              Only the session organizer can edit these details.
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/sessions/${session.id}`}>
              <Button size="sm">Open session</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

interface SessionQuickEditProps {
  session: SessionListItem;
  onSessionUpdated: (session: SessionListItem) => void;
}

function SessionQuickEdit({ session, onSessionUpdated }: SessionQuickEditProps) {
  const [statusValue, setStatusValue] = useState<SessionStatus>(session.status);
  const [visibilityValue, setVisibilityValue] = useState<SessionVisibility>(
    session.visibility,
  );
  const [capacityValue, setCapacityValue] = useState(
    session.capacity != null ? String(session.capacity) : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatusValue(session.status);
    setVisibilityValue(session.visibility);
    setCapacityValue(session.capacity != null ? String(session.capacity) : "");
    setError(null);
  }, [session.id, session.status, session.visibility, session.capacity]);

  const dirty =
    statusValue !== session.status ||
    visibilityValue !== session.visibility ||
    capacityValue !== (session.capacity?.toString() ?? "");

  const handleReset = () => {
    setStatusValue(session.status);
    setVisibilityValue(session.visibility);
    setCapacityValue(session.capacity != null ? String(session.capacity) : "");
    setError(null);
  };

  const handleSave = async () => {
    if (!dirty || saving) {
      return;
    }
    let capacityNumber: number | null = null;
    if (capacityValue.trim().length > 0) {
      capacityNumber = Number(capacityValue);
      if (!Number.isFinite(capacityNumber) || capacityNumber < 0) {
        setError("Capacity must be a positive number.");
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await updateSession({
        id: session.id,
        patch: {
          status: statusValue,
          visibility: visibilityValue,
          capacity: capacityNumber,
        },
      });
      onSessionUpdated(updated);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to save session updates right now.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 rounded-lg border bg-muted/30 p-4">
      <p className="mb-3 text-sm font-semibold">Quick edit</p>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={statusValue}
            onValueChange={(value) => setStatusValue(value as SessionStatus)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {SESSION_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Visibility</Label>
          <Select
            value={visibilityValue}
            onValueChange={(value) => setVisibilityValue(value as SessionVisibility)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select visibility" />
            </SelectTrigger>
            <SelectContent>
              {SESSION_VISIBILITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`capacity-${session.id}`}>Capacity</Label>
          <Input
            id={`capacity-${session.id}`}
            type="number"
            min={0}
            value={capacityValue}
            onChange={(event) => setCapacityValue(event.target.value)}
          />
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="flex items-center gap-2"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleReset}
          disabled={!dirty || saving}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}

interface DetailRowProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-1 text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

interface CreateSessionDialogProps {
  organizerId: string | null;
  disabled?: boolean;
  disabledReason?: string;
  onSessionCreated: (sessionId: string) => void;
}

interface SessionFormState {
  title: string;
  sessionType: SessionType;
  status: SessionStatus;
  visibility: SessionVisibility;
  scheduledStart: string;
  scheduledEnd: string;
  capacity: string;
}

function CreateSessionDialog({
  organizerId,
  disabled,
  disabledReason,
  onSessionCreated,
}: CreateSessionDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SessionFormState>(() => createInitialSessionForm());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setForm(createInitialSessionForm());
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!organizerId) {
      setError("You need a profile before creating sessions.");
      return;
    }

    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!form.scheduledStart || !form.scheduledEnd) {
      setError("Start and end times are required.");
      return;
    }

    let startIso: string;
    let endIso: string;
    try {
      startIso = datetimeLocalToIso(form.scheduledStart);
      endIso = datetimeLocalToIso(form.scheduledEnd);
    } catch {
      setError("Provide a valid time range.");
      return;
    }

    const startDate = new Date(startIso);
    const endDate = new Date(endIso);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      endDate <= startDate
    ) {
      setError("Provide a valid time range.");
      return;
    }

    let capacityNumber: number | null = null;
    if (form.capacity.trim().length > 0) {
      capacityNumber = Number(form.capacity);
      if (!Number.isFinite(capacityNumber) || capacityNumber < 0) {
        setError("Capacity must be a positive number.");
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    try {
      const created = await createSession({
        title: form.title.trim(),
        sessionType: form.sessionType,
        status: form.status,
        visibility: form.visibility,
        scheduledStart: startIso,
        scheduledEnd: endIso,
        organizerId,
        capacity: capacityNumber,
      });
      onSessionCreated(created.id);
      setOpen(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to create the session right now.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          disabled={disabled || submitting}
          title={disabledReason}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New session
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create session</DialogTitle>
          <DialogDescription>
            Set up a quick practice session. You can fine-tune details later.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="session-title">Title</Label>
            <Input
              id="session-title"
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="e.g. Tuesday partner practice"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Session type</Label>
              <Select
                value={form.sessionType}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    sessionType: value as SessionType,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    status: value as SessionStatus,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="session-start">Starts</Label>
              <Input
                id="session-start"
                type="datetime-local"
                value={form.scheduledStart}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    scheduledStart: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-end">Ends</Label>
              <Input
                id="session-end"
                type="datetime-local"
                value={form.scheduledEnd}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    scheduledEnd: event.target.value,
                  }))
                }
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select
                value={form.visibility}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    visibility: value as SessionVisibility,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_VISIBILITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-capacity">Capacity (optional)</Label>
              <Input
                id="session-capacity"
                type="number"
                min={0}
                value={form.capacity}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    capacity: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const createInitialSessionForm = (): SessionFormState => {
  const start = roundDate(new Date());
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    title: "",
    sessionType: DEFAULT_SESSION_TYPE,
    status: DEFAULT_SESSION_STATUS,
    visibility: DEFAULT_SESSION_VISIBILITY,
    scheduledStart: dateToDatetimeLocal(start),
    scheduledEnd: dateToDatetimeLocal(end),
    capacity: "",
  };
};

const roundDate = (date: Date) => {
  const rounded = new Date(date);
  rounded.setMinutes(rounded.getMinutes() + 15 - (rounded.getMinutes() % 15));
  rounded.setSeconds(0, 0);
  return rounded;
};
