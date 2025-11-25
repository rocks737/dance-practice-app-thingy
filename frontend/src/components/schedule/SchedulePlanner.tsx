"use client";

import { useMemo, useState } from "react";
import {
  CalendarCheck,
  Edit3,
  Loader2,
  MapPin,
  Plus,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSchedulePreferences } from "@/lib/hooks/useSchedulePreferences";
import {
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_VALUES,
  FOCUS_AREA_LABELS,
  PREFERRED_ROLE_LABELS,
  WSDC_SKILL_LEVEL_LABELS,
  type AvailabilityWindow,
  type SchedulePreference,
  formatLocationSummary,
} from "@/lib/schedule/types";
import { PreferenceForm } from "@/components/schedule/PreferenceForm";
import { deleteSchedulePreference } from "@/lib/schedule/api";

interface SchedulePlannerProps {
  profileId: string;
}

export function SchedulePlanner({ profileId }: SchedulePlannerProps) {
  const { preferences, loading, refreshing, error, refresh } =
    useSchedulePreferences(profileId);
  const [editorState, setEditorState] = useState<{
    mode: "create" | "edit";
    preference?: SchedulePreference;
  } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleRefresh = () => {
    void refresh();
  };

  const handleDelete = async (preference: SchedulePreference) => {
    setDeletingId(preference.id);
    try {
      await deleteSchedulePreference({
        userId: profileId,
        preferenceId: preference.id,
      });
      toast.success("Schedule preference deleted");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to delete preference");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
        <Button size="sm" onClick={() => setEditorState({ mode: "create" })}>
          <Plus className="mr-2 h-4 w-4" />
          New preference
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Unable to load preferences</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="flex items-center gap-2 rounded-lg border bg-card p-4 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Fetching schedule preferences...
        </div>
      )}

      {!loading && !error && preferences.length === 0 && (
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <CalendarCheck className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No preferences yet</h3>
              <p className="text-sm text-muted-foreground">
                Add your availability, preferred roles, and practice focus to start
                getting matched with compatible partners.
              </p>
              <Button size="sm" disabled>
                <Plus className="mr-2 h-4 w-4" />
                Plan my schedule
              </Button>
            </div>
          </div>
        </div>
      )}

      {preferences.length > 0 && (
        <div className="space-y-4">
          {preferences.map((preference) => (
            <PreferenceCard
              key={preference.id}
              preference={preference}
              onEdit={(pref) => setEditorState({ mode: "edit", preference: pref })}
              onDelete={handleDelete}
              deleting={deletingId === preference.id}
            />
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(editorState)}
        onOpenChange={(open) => {
          if (!open) {
            setEditorState(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>
              {editorState?.mode === "edit" ? "Edit preference" : "Create preference"}
            </DialogTitle>
          </DialogHeader>
          {editorState && (
            <PreferenceForm
              profileId={profileId}
              mode={editorState.mode}
              preference={editorState.preference}
              onSuccess={async (_saved) => {
                await refresh();
              }}
              onClose={() => setEditorState(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface PreferenceCardProps {
  preference: SchedulePreference;
  onEdit?: (preference: SchedulePreference) => void;
  onDelete?: (preference: SchedulePreference) => void;
  deleting?: boolean;
}

function PreferenceCard({ preference, onEdit, onDelete, deleting }: PreferenceCardProps) {
  const dailySummaries = useMemo(
    () => summarizeAvailability(preference.availabilityWindows),
    [preference.availabilityWindows],
  );

  const locationSummaries = useMemo(() => {
    if (!preference.preferredLocations.length) {
      return ["Any location"];
    }
    return preference.preferredLocations.map(formatLocationSummary);
  }, [preference.preferredLocations]);

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase text-muted-foreground">Availability</p>
          <div className="flex flex-wrap gap-2">
            {dailySummaries.length === 0 ? (
              <Badge variant="outline">No hours specified</Badge>
            ) : (
              dailySummaries.map((summary) => (
                <Badge key={summary} variant="outline">
                  {summary}
                </Badge>
              ))
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 text-right text-xs text-muted-foreground">
          <PreferenceActions
            preference={preference}
            onEdit={onEdit}
            onDelete={onDelete}
            deleting={deleting}
          />
          <span>Updated {new Date(preference.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs uppercase text-muted-foreground">Preferred roles</p>
          <div className="flex flex-wrap gap-2">
            {preference.preferredRoles.length === 0 ? (
              <Badge variant="secondary">Any role</Badge>
            ) : (
              preference.preferredRoles.map((role) => (
                <Badge key={role} variant="secondary">
                  {PREFERRED_ROLE_LABELS[role]}
                </Badge>
              ))
            )}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase text-muted-foreground">Skill levels</p>
          <div className="flex flex-wrap gap-2">
            {preference.preferredLevels.length === 0 ? (
              <Badge variant="secondary">All levels</Badge>
            ) : (
              preference.preferredLevels.map((level) => (
                <Badge key={level} variant="secondary">
                  {WSDC_SKILL_LEVEL_LABELS[level]}
                </Badge>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs uppercase text-muted-foreground">Focus areas</p>
          <div className="flex flex-wrap gap-2">
            {preference.preferredFocusAreas.length === 0 ? (
              <Badge variant="outline">General practice</Badge>
            ) : (
              preference.preferredFocusAreas.map((focus) => (
                <Badge key={focus} variant="outline">
                  {FOCUS_AREA_LABELS[focus]}
                </Badge>
              ))
            )}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase text-muted-foreground">Locations & travel</p>
          <div className="flex flex-wrap gap-2">
            {locationSummaries.slice(0, 3).map((location) => (
              <Badge key={location} variant="outline" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {location}
              </Badge>
            ))}
            {locationSummaries.length > 3 && (
              <Badge variant="outline">+{locationSummaries.length - 3} more</Badge>
            )}
          </div>
          {typeof preference.maxTravelDistanceKm === "number" && (
            <p className="text-xs text-muted-foreground">
              Will travel up to {preference.maxTravelDistanceKm} km
            </p>
          )}
          {preference.locationNote && (
            <p className="text-xs italic text-muted-foreground">
              {preference.locationNote}
            </p>
          )}
        </div>
      </div>

      {preference.notes && (
        <div className="mt-4 rounded-md bg-muted/30 p-3 text-sm text-muted-foreground">
          {preference.notes}
        </div>
      )}
    </div>
  );
}

function summarizeAvailability(windows: AvailabilityWindow[]): string[] {
  if (windows.length === 0) {
    return [];
  }

  const byDay = new Map<string, AvailabilityWindow[]>();
  for (const day of DAY_OF_WEEK_VALUES) {
    byDay.set(day, []);
  }
  for (const window of windows) {
    const bucket = byDay.get(window.dayOfWeek);
    if (bucket) {
      bucket.push(window);
    } else {
      byDay.set(window.dayOfWeek, [window]);
    }
  }

  const summaries: string[] = [];
  for (const day of DAY_OF_WEEK_VALUES) {
    const dayWindows = byDay.get(day);
    if (!dayWindows || dayWindows.length === 0) {
      continue;
    }
    const sorted = [...dayWindows].sort((a, b) => a.startTime.localeCompare(b.startTime));
    const ranges = sorted.map((window) => `${window.startTime}–${window.endTime}`);
    summaries.push(`${DAY_OF_WEEK_LABELS[day]} ${ranges.join(", ")}`);
    if (summaries.length >= 6) {
      break;
    }
  }

  return summaries;
}

interface PreferenceActionsProps {
  preference: SchedulePreference;
  onEdit?: (preference: SchedulePreference) => void;
  onDelete?: (preference: SchedulePreference) => void;
  deleting?: boolean;
}

function PreferenceActions({
  preference,
  onEdit,
  onDelete,
  deleting,
}: PreferenceActionsProps) {
  const handleEdit = () => {
    onEdit?.(preference);
  };

  const handleDelete = () => {
    onDelete?.(preference);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="icon"
        variant="ghost"
        onClick={handleEdit}
        aria-label="Edit preference"
      >
        <Edit3 className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={handleDelete}
        disabled={deleting}
        aria-label="Delete preference"
      >
        {deleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4 text-destructive" />
        )}
      </Button>
    </div>
  );
}
