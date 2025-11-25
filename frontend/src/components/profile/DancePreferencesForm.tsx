"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import {
  UserProfile,
  PrimaryRole,
  WsdcSkillLevel,
  PRIMARY_ROLE_OPTIONS,
  WSDC_SKILL_LEVEL_OPTIONS,
} from "@/lib/profiles/types";
import {
  dancePreferencesSchema,
  type DancePreferencesFormData,
} from "@/lib/profiles/validation";
import { updateProfile } from "@/lib/profiles/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

interface DancePreferencesFormProps {
  profile: UserProfile;
  onUpdate?: () => void;
}

export function DancePreferencesForm({ profile, onUpdate }: DancePreferencesFormProps) {
  const [isSaving, setIsSaving] = useState(false);

  const {
    setValue,
    watch,
    handleSubmit,
    register,
    formState: { errors, isDirty },
    reset,
  } = useForm<DancePreferencesFormData>({
    resolver: zodResolver(dancePreferencesSchema),
    defaultValues: {
      primary_role: profile.primaryRole,
      wsdc_level: profile.wsdcLevel ?? undefined,
      competitiveness_level: profile.competitivenessLevel,
      bio: profile.bio ?? "",
      dance_goals: profile.danceGoals ?? "",
    },
  });

  const primaryRole = watch("primary_role");
  const wsdcLevel = watch("wsdc_level");
  const competitivenessLevel = watch("competitiveness_level");
  const bio = watch("bio") || "";
  const danceGoals = watch("dance_goals") || "";

  // Update form values when profile changes (e.g., after refetch)
  useEffect(() => {
    reset({
      primary_role: profile.primaryRole,
      wsdc_level: profile.wsdcLevel ?? undefined,
      competitiveness_level: profile.competitivenessLevel,
      bio: profile.bio ?? "",
      dance_goals: profile.danceGoals ?? "",
    });
  }, [
    profile.primaryRole,
    profile.wsdcLevel,
    profile.competitivenessLevel,
    profile.bio,
    profile.danceGoals,
    reset,
  ]);

  const onSubmit = async (data: DancePreferencesFormData) => {
    setIsSaving(true);
    try {
      await updateProfile(profile.id, {
        primary_role: data.primary_role,
        wsdc_level: data.wsdc_level ?? null,
        competitiveness_level: data.competitiveness_level,
        bio: data.bio || null,
        dance_goals: data.dance_goals || null,
      });

      toast.success("Dance preferences updated successfully");
      reset(data);

      // Refetch profile to get latest data
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update preferences",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const roleOption = PRIMARY_ROLE_OPTIONS.find((opt) => opt.value === primaryRole);
  const levelOption = WSDC_SKILL_LEVEL_OPTIONS.find((opt) => opt.value === wsdcLevel);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Dance Preferences
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Primary Role */}
          <div>
            <Label htmlFor="primary_role">Primary Dance Role</Label>
            <Select
              value={primaryRole?.toString()}
              onValueChange={(value) =>
                setValue("primary_role", parseInt(value) as PrimaryRole, {
                  shouldDirty: true,
                })
              }
              disabled={isSaving}
            >
              <SelectTrigger
                id="primary_role"
                className={errors.primary_role ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select your primary role" />
              </SelectTrigger>
              <SelectContent>
                {PRIMARY_ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.primary_role && (
              <p className="mt-1 text-sm text-red-500">{errors.primary_role.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Your preferred role when dancing
            </p>
          </div>

          {/* WSDC Skill Level */}
          <div>
            <Label htmlFor="wsdc_level">WSDC Skill Level (optional)</Label>
            <Select
              value={wsdcLevel?.toString() ?? "unranked"}
              onValueChange={(value) => {
                const level = value === "unranked" ? undefined : parseInt(value);
                setValue("wsdc_level", level as WsdcSkillLevel, { shouldDirty: true });
              }}
              disabled={isSaving}
            >
              <SelectTrigger
                id="wsdc_level"
                className={errors.wsdc_level ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select your skill level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unranked">Unranked</SelectItem>
                {WSDC_SKILL_LEVEL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.wsdc_level && (
              <p className="mt-1 text-sm text-red-500">{errors.wsdc_level.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Your current West Coast Swing skill division
            </p>
          </div>

          {/* Competitiveness Level */}
          <div>
            <Label htmlFor="competitiveness_level">
              Competitiveness Level: {competitivenessLevel}
            </Label>
            <div className="pt-2">
              <Slider
                id="competitiveness_level"
                min={1}
                max={5}
                step={1}
                value={[competitivenessLevel]}
                onValueChange={(value) =>
                  setValue("competitiveness_level", value[0], { shouldDirty: true })
                }
                disabled={isSaving}
                className={errors.competitiveness_level ? "border-red-500" : ""}
              />
            </div>
            {errors.competitiveness_level && (
              <p className="mt-1 text-sm text-red-500">
                {errors.competitiveness_level.message}
              </p>
            )}
            <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>1 - Social</span>
              <span>3 - Balanced</span>
              <span>5 - Competitive</span>
            </div>
          </div>

          {/* Biography Fields */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="bio">About You</Label>
              <span
                className={`text-xs ${bio.length > 1000 ? "text-red-500" : "text-gray-500 dark:text-gray-400"}`}
              >
                {bio.length} / 1000
              </span>
            </div>
            <Textarea
              id="bio"
              {...register("bio")}
              disabled={isSaving}
              placeholder="Tell us about yourself"
              rows={6}
              className={errors.bio ? "border-red-500" : ""}
            />
            {errors.bio && (
              <p className="mt-1 text-sm text-red-500">{errors.bio.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Share your story, experience level, or anything you'd like potential
              practice partners to know
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="dance_goals">Dance Goals</Label>
              <span
                className={`text-xs ${danceGoals.length > 500 ? "text-red-500" : "text-gray-500 dark:text-gray-400"}`}
              >
                {danceGoals.length} / 500
              </span>
            </div>
            <Textarea
              id="dance_goals"
              {...register("dance_goals")}
              disabled={isSaving}
              placeholder="What are your dance goals? What do you want to work on or achieve?"
              rows={4}
              className={errors.dance_goals ? "border-red-500" : ""}
            />
            {errors.dance_goals && (
              <p className="mt-1 text-sm text-red-500">{errors.dance_goals.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              What you're working towards (competitions, social dancing, technique, etc.)
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="submit" disabled={!isDirty || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
