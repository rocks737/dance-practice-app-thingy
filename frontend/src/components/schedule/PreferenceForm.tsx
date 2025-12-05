"use client";

import { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CalendarPlus, Loader2, Plus, Trash2, X, List, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_VALUES,
  FOCUS_AREA_LABELS,
  FOCUS_AREA_VALUES,
  PREFERRED_ROLE_LABELS,
  PREFERRED_ROLE_VALUES,
  SchedulePreference,
  type AvailabilityWindow,
  type FocusArea,
  type PreferredRole,
  type WsdcSkillLevel,
  WSDC_SKILL_LEVEL_LABELS,
  WSDC_SKILL_LEVEL_VALUES,
} from "@/lib/schedule/types";
import {
  schedulePreferenceSchema,
  type SchedulePreferenceFormData,
} from "@/lib/schedule/validation";
import { createSchedulePreference, updateSchedulePreference } from "@/lib/schedule/api";

// Dynamically import the calendar to avoid SSR issues
const ScheduleAvailabilityCalendar = dynamic(
  () =>
    import("@/components/schedule/ScheduleAvailabilityCalendar").then(
      (mod) => mod.ScheduleAvailabilityCalendar,
    ),
  { ssr: false },
);

interface PreferenceFormProps {
  profileId: string;
  mode: "create" | "edit";
  preference?: SchedulePreference;
  onSuccess: (preference: SchedulePreference) => void;
  onClose: () => void;
}

export function PreferenceForm({
  profileId,
  mode,
  preference,
  onSuccess,
  onClose,
}: PreferenceFormProps) {
  const defaultValues = useMemo(() => toFormData(preference), [preference]);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SchedulePreferenceFormData>({
    resolver: zodResolver(schedulePreferenceSchema) as any,
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "availabilityWindows",
  });

  const preferredRoles = watch("preferredRoles");
  const preferredLevels = watch("preferredLevels");
  const preferredFocusAreas = watch("preferredFocusAreas");
  const preferredLocationIds = watch("preferredLocationIds");
  const [locationIdInput, setLocationIdInput] = useState("");

  // Manage availability input mode (list or calendar)
  const [availabilityMode, setAvailabilityMode] = useState<"list" | "calendar">("list");

  // Persist user's last-used view in localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem("availability-mode");
    if (savedMode === "calendar" || savedMode === "list") {
      setAvailabilityMode(savedMode);
    }
  }, []);

  const handleModeChange = (mode: string) => {
    if (mode === "list" || mode === "calendar") {
      setAvailabilityMode(mode);
      localStorage.setItem("availability-mode", mode);
    }
  };

  // Calendar handlers - auto-save for immediate feedback
  const handleCalendarCreate = async (window: AvailabilityWindow) => {
    // Ensure recurring is always set
    const normalizedWindow = {
      ...window,
      recurring: window.recurring ?? true,
    };
    
    // If editing existing preference, auto-save
    if (mode === "edit" && preference) {
      try {
        // Get current windows BEFORE optimistic update
        const currentWindows = watch("availabilityWindows");
        
        // Optimistically add to UI
        append(normalizedWindow);
        
        const updatedData = {
          ...watch(),
          availabilityWindows: [...currentWindows, normalizedWindow],
        };
        
        const result = await updateSchedulePreference({
          userId: profileId,
          preferenceId: preference.id,
          data: updatedData as SchedulePreferenceFormData,
        });
        
        // Sync with server response
        const freshData = toFormData(result);
        reset(freshData, { keepDirty: false });
        
        onSuccess(result);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save");
        console.error(error);
        // Rollback the optimistic update
        remove(fields.length);
      }
    } else {
      // In create mode, just append (will be saved on form submit)
      append(normalizedWindow);
    }
  };

  const handleCalendarUpdate = async (
    oldWindow: AvailabilityWindow,
    newWindow: AvailabilityWindow,
  ) => {
    // Ensure recurring is always set
    const normalizedNewWindow = {
      ...newWindow,
      recurring: newWindow.recurring ?? true,
    };
    
    const index = fields.findIndex(
      (f) =>
        f.dayOfWeek === oldWindow.dayOfWeek &&
        f.startTime === oldWindow.startTime &&
        f.endTime === oldWindow.endTime &&
        (f.recurring ?? true) === (oldWindow.recurring ?? true) &&
        f.specificDate === oldWindow.specificDate,
    );
    
    if (index < 0) return;
    
    const oldValue = fields[index];
    
    // Optimistically update the UI
    setValue(`availabilityWindows.${index}`, normalizedNewWindow, { shouldDirty: false });
    
    // If editing existing preference, auto-save
    if (mode === "edit" && preference) {
      try {
        const currentWindows = watch("availabilityWindows");
        const updatedWindows = [...currentWindows];
        updatedWindows[index] = normalizedNewWindow;
        
        const updatedData = {
          ...watch(),
          availabilityWindows: updatedWindows,
        };
        
        const result = await updateSchedulePreference({
          userId: profileId,
          preferenceId: preference.id,
          data: updatedData as SchedulePreferenceFormData,
        });
        
        // Sync the entire form with server response to ensure consistency
        // This shouldn't cause a flash since the data should match our optimistic update
        const freshData = toFormData(result);
        reset(freshData, { keepDirty: false });
        
        onSuccess(result);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save");
        console.error(error);
        // Rollback the optimistic update
        setValue(`availabilityWindows.${index}`, oldValue, { shouldDirty: false });
      }
    }
  };

  const handleCalendarDelete = async (window: AvailabilityWindow) => {
    const index = fields.findIndex(
      (f) =>
        f.dayOfWeek === window.dayOfWeek &&
        f.startTime === window.startTime &&
        f.endTime === window.endTime &&
        (f.recurring ?? true) === (window.recurring ?? true) &&
        f.specificDate === window.specificDate,
    );
    
    if (index < 0) return;
    
    const deletedWindow = fields[index];
    
    // Optimistically remove from UI
    remove(index);
    
    // If editing existing preference, auto-save
    if (mode === "edit" && preference) {
      try {
        const currentWindows = watch("availabilityWindows");
        const updatedWindows = currentWindows.filter((_, i) => i !== index);
        
        const updatedData = {
          ...watch(),
          availabilityWindows: updatedWindows,
        };
        
        const result = await updateSchedulePreference({
          userId: profileId,
          preferenceId: preference.id,
          data: updatedData as SchedulePreferenceFormData,
        });
        
        // Sync with server response
        const freshData = toFormData(result);
        reset(freshData, { keepDirty: false });
        
        onSuccess(result);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save");
        // Rollback the optimistic update
        append(deletedWindow);
      }
    }
  };

  const onSubmit = async (formData: SchedulePreferenceFormData) => {
    try {
      const result =
        mode === "create"
          ? await createSchedulePreference({ userId: profileId, data: formData })
          : await updateSchedulePreference({
              userId: profileId,
              preferenceId: preference!.id,
              data: formData,
            });
      toast.success(
        mode === "create" ? "Schedule preference created" : "Schedule preference updated",
      );
      onSuccess(result);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save preference");
    }
  };

  const addAvailabilityWindow = () => {
    append({
      dayOfWeek:
        DAY_OF_WEEK_VALUES[Math.min(fields.length, DAY_OF_WEEK_VALUES.length - 1)],
      startTime: "18:00",
      endTime: "20:00",
      recurring: true,
    });
  };

  const handleRoleToggle = (value: PreferredRole, checked: boolean) => {
    const current = new Set(preferredRoles ?? []);
    if (checked) {
      current.add(value);
    } else {
      current.delete(value);
    }
    setValue("preferredRoles", Array.from(current), { shouldDirty: true });
  };

  const handleLevelToggle = (value: WsdcSkillLevel, checked: boolean) => {
    const current = new Set(preferredLevels ?? []);
    if (checked) {
      current.add(value);
    } else {
      current.delete(value);
    }
    setValue("preferredLevels", Array.from(current), { shouldDirty: true });
  };

  const handleFocusToggle = (value: FocusArea, checked: boolean) => {
    const current = new Set(preferredFocusAreas ?? []);
    if (checked) {
      current.add(value);
    } else {
      current.delete(value);
    }
    setValue("preferredFocusAreas", Array.from(current), { shouldDirty: true });
  };

  const handleAddLocationId = () => {
    const trimmed = locationIdInput.trim();
    if (!trimmed) {
      return;
    }
    if (!isValidUuid(trimmed)) {
      toast.error("Location ID must be a valid UUID");
      return;
    }
    const next = Array.from(new Set([...(preferredLocationIds ?? []), trimmed]));
    setValue("preferredLocationIds", next, { shouldDirty: true });
    setLocationIdInput("");
  };

  const handleRemoveLocationId = (id: string) => {
    const next = (preferredLocationIds ?? []).filter((value) => value !== id);
    setValue("preferredLocationIds", next, { shouldDirty: true });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit as any)}>
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <CalendarPlus className="h-4 w-4" />
          </div>
          <div>
            <p className="text-lg font-semibold">
              {mode === "create"
                ? "Create schedule preference"
                : "Edit schedule preference"}
            </p>
            <p className="text-sm text-muted-foreground">
              Add availability windows, partner preferences, and travel notes.
            </p>
          </div>
        </div>
      </div>

      <section className="space-y-3 rounded-lg border bg-muted/20 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Availability windows</p>
            <p className="text-xs text-muted-foreground">
              Specify day of week and time ranges you can practice.
            </p>
          </div>
        </div>

        <Tabs value={availabilityMode} onValueChange={handleModeChange}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="list">
              <List className="mr-2 h-4 w-4" />
              List view
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <Calendar className="mr-2 h-4 w-4" />
              Calendar view
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-3 mt-4">
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addAvailabilityWindow}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add window
              </Button>
            </div>
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex flex-wrap items-center gap-3 rounded-md border bg-background p-3"
                >
                  <div className="w-36">
                    <Label className="text-xs text-muted-foreground">Day</Label>
                    <Select
                      value={watch(`availabilityWindows.${index}.dayOfWeek`)}
                      onValueChange={(value) =>
                        setValue(
                          `availabilityWindows.${index}.dayOfWeek`,
                          value as (typeof DAY_OF_WEEK_VALUES)[number],
                          {
                          shouldDirty: true,
                          },
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Day" />
                      </SelectTrigger>
                      <SelectContent>
                        {DAY_OF_WEEK_VALUES.map((day) => (
                          <SelectItem key={day} value={day}>
                            {DAY_OF_WEEK_LABELS[day]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Start</Label>
                    <Input
                      type="time"
                      step={900}
                      {...register(`availabilityWindows.${index}.startTime`)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">End</Label>
                    <Input
                      type="time"
                      step={900}
                      {...register(`availabilityWindows.${index}.endTime`)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="ml-auto"
                    onClick={() => remove(index)}
                    aria-label="Remove window"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No windows yet. Add your first availability.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="mt-4">
            <ScheduleAvailabilityCalendar
              windows={fields}
              onCreateWindow={handleCalendarCreate}
              onUpdateWindow={handleCalendarUpdate}
              onDeleteWindow={handleCalendarDelete}
            />
          </TabsContent>
        </Tabs>

        {"message" in (errors.availabilityWindows ?? {}) &&
          errors.availabilityWindows?.message && (
            <p className="text-sm text-destructive">
              {errors.availabilityWindows?.message}
            </p>
          )}
      </section>

      <section className="space-y-4 rounded-lg border bg-muted/20 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <PreferenceCheckboxGroup
            title="I want to dance as"
            description="Select the role(s) you'll take during practice sessions."
            options={PREFERRED_ROLE_VALUES.map((value) => ({
              value,
              label: PREFERRED_ROLE_LABELS[value],
            }))}
            selected={preferredRoles ?? []}
            onToggle={(value, checked) =>
              handleRoleToggle(value as PreferredRole, checked)
            }
            error={errors.preferredRoles?.message}
          />
          <PreferenceCheckboxGroup
            title="Preferred WSDC levels"
            description="Select all experience levels you want to jam with."
            options={WSDC_SKILL_LEVEL_VALUES.map((value) => ({
              value,
              label: WSDC_SKILL_LEVEL_LABELS[value],
            }))}
            selected={preferredLevels ?? []}
            onToggle={(value, checked) =>
              handleLevelToggle(value as WsdcSkillLevel, checked)
            }
          />
        </div>
        <PreferenceCheckboxGroup
          title="Focus areas"
          description="Tell people what you want to drill."
          options={FOCUS_AREA_VALUES.map((value) => ({
            value,
            label: FOCUS_AREA_LABELS[value],
          }))}
          selected={preferredFocusAreas ?? []}
          onToggle={(value, checked) => handleFocusToggle(value as FocusArea, checked)}
        />
      </section>

      <section className="space-y-4 rounded-lg border bg-muted/20 p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label className="text-sm font-semibold">Max travel distance (km)</Label>
            <Input
              type="number"
              min={0}
              max={500}
              placeholder="e.g. 25"
              {...register("maxTravelDistanceKm", { valueAsNumber: true })}
            />
            {errors.maxTravelDistanceKm && (
              <p className="text-xs text-destructive mt-1">
                {errors.maxTravelDistanceKm.message}
              </p>
            )}
          </div>
          <div className="md:col-span-2">
            <Label className="text-sm font-semibold">Location note</Label>
            <Input
              placeholder="Home studio, preferred neighborhoods, etc."
              {...register("locationNote")}
            />
            {errors.locationNote && (
              <p className="text-xs text-destructive mt-1">
                {errors.locationNote.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label className="text-sm font-semibold">
            Preferred location IDs (optional)
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            Paste Supabase location UUIDs to narrow down matches.
          </p>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="00000000-0000-0000-0000-000000000000"
              value={locationIdInput}
              onChange={(event) => setLocationIdInput(event.target.value)}
              className="max-w-xs"
            />
            <Button type="button" variant="outline" onClick={handleAddLocationId}>
              Add
            </Button>
          </div>
          {preferredLocationIds && preferredLocationIds.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {preferredLocationIds.map((id) => (
                <Badge key={id} variant="outline" className="flex items-center gap-2">
                  <span className="text-[11px]">{id}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLocationId(id)}
                    aria-label="Remove location"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          {errors.preferredLocationIds && (
            <p className="text-xs text-destructive mt-1">
              {errors.preferredLocationIds.message}
            </p>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <Label className="text-sm font-semibold">Notes for potential partners</Label>
        <Textarea
          rows={4}
          placeholder="Share goals, practice preferences, or anything else that's helpful."
          {...register("notes")}
        />
        {errors.notes && (
          <p className="text-xs text-destructive">{errors.notes.message}</p>
        )}
      </section>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save preference"
          )}
        </Button>
      </div>
    </form>
  );
}


interface PreferenceCheckboxGroupProps {
  title: string;
  description?: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string, checked: boolean) => void;
  error?: string;
}

function PreferenceCheckboxGroup({
  title,
  description,
  options,
  selected,
  onToggle,
  error,
}: PreferenceCheckboxGroupProps) {
  return (
    <div className="space-y-2 rounded-md border bg-background p-3">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="space-y-2">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={selected.includes(option.value)}
              onCheckedChange={(checked) => onToggle(option.value, Boolean(checked))}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function toFormData(preference?: SchedulePreference): SchedulePreferenceFormData {
  if (!preference) {
    return {
      availabilityWindows: [],
      preferredRoles: [PREFERRED_ROLE_VALUES[0]],
      preferredLevels: [],
      preferredFocusAreas: [],
      preferredLocationIds: [],
      maxTravelDistanceKm: null,
      locationNote: "",
      notes: "",
    };
  }

  return {
    availabilityWindows: preference.availabilityWindows.map((window) => ({
      dayOfWeek: window.dayOfWeek,
      startTime: window.startTime,
      endTime: window.endTime,
      recurring: window.recurring ?? true,
      specificDate: window.specificDate,
    })),
    preferredRoles: preference.preferredRoles,
    preferredLevels: preference.preferredLevels,
    preferredFocusAreas: preference.preferredFocusAreas,
    preferredLocationIds: preference.preferredLocations.map((location) => location.id),
    maxTravelDistanceKm: preference.maxTravelDistanceKm,
    locationNote: preference.locationNote ?? "",
    notes: preference.notes ?? "",
  };
}

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
