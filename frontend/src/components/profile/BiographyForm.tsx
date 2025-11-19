"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { UserProfile } from "@/lib/profiles/types";
import { biographySchema, type BiographyFormData } from "@/lib/profiles/validation";
import { updateProfile } from "@/lib/profiles/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BiographyFormProps {
  profile: UserProfile;
}

export function BiographyForm({ profile }: BiographyFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<BiographyFormData>({
    resolver: zodResolver(biographySchema),
    defaultValues: {
      bio: profile.bio || "",
      dance_goals: profile.danceGoals || "",
    },
  });

  const bio = watch("bio") || "";
  const danceGoals = watch("dance_goals") || "";

  const onSubmit = async (data: BiographyFormData) => {
    setIsSaving(true);
    try {
      await updateProfile(profile.id, {
        bio: data.bio || null,
        dance_goals: data.dance_goals || null,
      });
      
      toast.success("Biography updated successfully");
      setIsEditing(false);
      reset(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update biography");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    reset({
      bio: profile.bio || "",
      dance_goals: profile.danceGoals || "",
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Biography
          </h2>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
              Edit
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Bio */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="bio">About You</Label>
              <span className={`text-xs ${bio.length > 1000 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                {bio.length} / 1000
              </span>
            </div>
            <Textarea
              id="bio"
              {...register("bio")}
              disabled={!isEditing || isSaving}
              placeholder="Tell us about yourself, your dance journey, what you love about dancing..."
              rows={6}
              className={errors.bio ? "border-red-500" : ""}
            />
            {errors.bio && (
              <p className="mt-1 text-sm text-red-500">{errors.bio.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Share your story, experience level, or anything you'd like potential practice partners to know
            </p>
          </div>

          {/* Dance Goals */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="dance_goals">Dance Goals</Label>
              <span className={`text-xs ${danceGoals.length > 500 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                {danceGoals.length} / 500
              </span>
            </div>
            <Textarea
              id="dance_goals"
              {...register("dance_goals")}
              disabled={!isEditing || isSaving}
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

          {/* Display when not editing */}
          {!isEditing && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              {!bio && !danceGoals && (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No biography or goals added yet. Click Edit to add information about yourself!
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
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
          )}
        </form>
      </div>
    </div>
  );
}

