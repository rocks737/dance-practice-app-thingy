"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Check, ArrowLeft, Plus, Trash2, Calendar } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { createSchedulePreference } from "@/lib/schedule/api";
import {
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_VALUES,
  FOCUS_AREA_LABELS,
  FOCUS_AREA_VALUES,
  PREFERRED_ROLE_VALUES,
  PREFERRED_ROLE_LABELS,
  type FocusArea,
  type PreferredRole,
} from "@/lib/schedule/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Simplified validation for onboarding - just require at least one availability window
const onboardingScheduleSchema = z.object({
  availabilityWindows: z
    .array(
      z.object({
        dayOfWeek: z.enum(DAY_OF_WEEK_VALUES),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
        recurring: z.boolean(),
      })
    )
    .min(1, "Please add at least one availability window"),
  preferredRoles: z.array(z.enum(PREFERRED_ROLE_VALUES)).default(["LEAD", "FOLLOW"]),
  preferredFocusAreas: z.array(z.enum(FOCUS_AREA_VALUES)).default([]),
  notes: z.string().max(500).optional(),
});

type OnboardingScheduleFormData = z.infer<typeof onboardingScheduleSchema>;

interface SchedulePreferenceStepProps {
  profileId: string;
  onComplete: () => void;
  onBack: () => void;
}

export function SchedulePreferenceStep({
  profileId,
  onComplete,
  onBack,
}: SchedulePreferenceStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingScheduleFormData>({
    resolver: zodResolver(onboardingScheduleSchema),
    defaultValues: {
      availabilityWindows: [
        {
          dayOfWeek: "MONDAY",
          startTime: "18:00",
          endTime: "20:00",
          recurring: true,
        },
      ],
      preferredRoles: ["LEAD", "FOLLOW"],
      preferredFocusAreas: [],
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "availabilityWindows",
  });

  const preferredRoles = watch("preferredRoles");
  const preferredFocusAreas = watch("preferredFocusAreas");

  const onSubmit = async (data: OnboardingScheduleFormData) => {
    setIsSubmitting(true);

    try {
      console.log("[SCHEDULE PREFERENCE] Creating schedule preference for user:", profileId);

      // Create schedule preference with minimal required fields
      await createSchedulePreference({
        userId: profileId,
        data: {
          availabilityWindows: data.availabilityWindows,
          preferredRoles: data.preferredRoles,
          preferredLevels: [], // Can be set later in full schedule page
          preferredFocusAreas: data.preferredFocusAreas,
          preferredLocationIds: [], // Can be set later
          maxTravelDistanceKm: null,
          locationNote: null,
          notes: data.notes || null,
        },
      });

      console.log("[SCHEDULE PREFERENCE] Schedule preference created successfully");
      toast.success("Schedule preference created! You're all set!");

      // Complete onboarding
      onComplete();
    } catch (error) {
      console.error("[SCHEDULE PREFERENCE ERROR]", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create schedule preference"
      );
    } finally {
      setIsSubmitting(false);
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

  const handleFocusToggle = (value: FocusArea, checked: boolean) => {
    const current = new Set(preferredFocusAreas ?? []);
    if (checked) {
      current.add(value);
    } else {
      current.delete(value);
    }
    setValue("preferredFocusAreas", Array.from(current), { shouldDirty: true });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Set Your Availability
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Let us know when you're available to practice. You can add more details later!
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Availability Windows */}
        <section className="space-y-3 rounded-lg border bg-muted/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">When can you practice?</p>
              <p className="text-xs text-muted-foreground">
                Add at least one time slot when you're typically available
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addAvailabilityWindow}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add time slot
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
                        { shouldDirty: true }
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
                  <Label className="text-xs text-muted-foreground">Start time</Label>
                  <Input
                    type="time"
                    step={900}
                    {...register(`availabilityWindows.${index}.startTime`)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">End time</Label>
                  <Input
                    type="time"
                    step={900}
                    {...register(`availabilityWindows.${index}.endTime`)}
                  />
                </div>
                {fields.length > 1 && (
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
                )}
              </div>
            ))}
          </div>

          {errors.availabilityWindows && (
            <p className="text-sm text-red-500">{errors.availabilityWindows.message}</p>
          )}
        </section>

        {/* Preferred Roles */}
        <section className="space-y-3 rounded-lg border bg-muted/20 p-4">
          <div>
            <p className="text-sm font-semibold">Which roles are you open to?</p>
            <p className="text-xs text-muted-foreground">Select all that apply</p>
          </div>
          <div className="space-y-2">
            {PREFERRED_ROLE_VALUES.map((role) => (
              <label key={role} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={preferredRoles.includes(role)}
                  onCheckedChange={(checked) =>
                    handleRoleToggle(role, Boolean(checked))
                  }
                />
                <span>{PREFERRED_ROLE_LABELS[role]}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Focus Areas (Optional) */}
        <section className="space-y-3 rounded-lg border bg-muted/20 p-4">
          <div>
            <p className="text-sm font-semibold">Focus areas (optional)</p>
            <p className="text-xs text-muted-foreground">
              What do you want to work on? You can change this later
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {FOCUS_AREA_VALUES.map((focus) => (
              <label key={focus} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={preferredFocusAreas.includes(focus)}
                  onCheckedChange={(checked) =>
                    handleFocusToggle(focus, Boolean(checked))
                  }
                />
                <span>{FOCUS_AREA_LABELS[focus]}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Additional Notes (Optional) */}
        <section className="space-y-2">
          <Label className="text-sm font-semibold">Additional notes (optional)</Label>
          <Input
            placeholder="Any specific requirements or preferences?"
            {...register("notes")}
            maxLength={500}
          />
          {errors.notes && (
            <p className="text-sm text-red-500">{errors.notes.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Don't worry, you can add more details like locations and skill levels in your
            schedule page later!
          </p>
        </section>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Completing Setup...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Complete Setup
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

