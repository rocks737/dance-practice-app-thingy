"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Save, Settings as SettingsIcon, X } from "lucide-react";
import { toast } from "sonner";
import { UserProfile } from "@/lib/profiles/types";
import { profileSettingsSchema, type ProfileSettingsFormData } from "@/lib/profiles/validation";
import { updateProfile } from "@/lib/profiles/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ProfileSettingsProps {
  profile: UserProfile;
}

export function ProfileSettings({ profile }: ProfileSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    setValue,
    watch,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileSettingsFormData>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      profile_visible: profile.profileVisible,
      home_location_id: profile.homeLocationId,
    },
  });

  const profileVisible = watch("profile_visible");

  const onSubmit = async (data: ProfileSettingsFormData) => {
    setIsSaving(true);
    try {
      await updateProfile(profile.id, {
        profile_visible: data.profile_visible,
        home_location_id: data.home_location_id,
      });
      
      toast.success("Settings updated successfully");
      setIsEditing(false);
      reset(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    reset({
      profile_visible: profile.profileVisible,
      home_location_id: profile.homeLocationId,
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <SettingsIcon className="w-5 h-5 mr-2" />
              Profile Settings
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Control your profile visibility and preferences
            </p>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
              Edit
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Visibility */}
          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="profile_visible" className="text-base font-medium">
                {profileVisible ? <Eye className="w-4 h-4 inline mr-2" /> : <EyeOff className="w-4 h-4 inline mr-2" />}
                Profile Visibility
              </Label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {profileVisible 
                  ? "Your profile is visible to other users. They can see your information and send you practice requests."
                  : "Your profile is hidden. Other users won't be able to find or view your profile."}
              </p>
            </div>
            <Switch
              id="profile_visible"
              checked={profileVisible}
              onCheckedChange={(checked) => setValue("profile_visible", checked, { shouldDirty: true })}
              disabled={!isEditing || isSaving}
            />
          </div>

          {errors.profile_visible && (
            <p className="mt-1 text-sm text-red-500">{errors.profile_visible.message}</p>
          )}

          {/* Additional Settings Placeholder */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Additional Settings
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Notifications
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Receive emails about practice requests and messages
                  </p>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Coming soon</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Home Location
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Set your primary dance location for better matches
                  </p>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Coming soon</span>
              </div>
            </div>
          </div>

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

