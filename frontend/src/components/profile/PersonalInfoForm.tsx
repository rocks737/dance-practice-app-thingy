"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { UserProfile } from "@/lib/profiles/types";
import { personalInfoSchema, type PersonalInfoFormData } from "@/lib/profiles/validation";
import { updateProfile } from "@/lib/profiles/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PersonalInfoFormProps {
  profile: UserProfile;
}

export function PersonalInfoForm({ profile }: PersonalInfoFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      first_name: profile.firstName,
      last_name: profile.lastName,
      display_name: profile.displayName || "",
      birth_date: profile.birthDate || "",
    },
  });

  const onSubmit = async (data: PersonalInfoFormData) => {
    setIsSaving(true);
    try {
      await updateProfile(profile.id, {
        first_name: data.first_name,
        last_name: data.last_name,
        display_name: data.display_name || null,
        birth_date: data.birth_date || null,
      });
      
      toast.success("Personal information updated successfully");
      setIsEditing(false);
      
      // Update the form with new values
      reset(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    reset({
      first_name: profile.firstName,
      last_name: profile.lastName,
      display_name: profile.displayName || "",
      birth_date: profile.birthDate || "",
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Personal Information
          </h2>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
              Edit
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* First Name */}
          <div>
            <Label htmlFor="first_name">
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="first_name"
              {...register("first_name")}
              disabled={!isEditing || isSaving}
              className={errors.first_name ? "border-red-500" : ""}
            />
            {errors.first_name && (
              <p className="mt-1 text-sm text-red-500">{errors.first_name.message}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <Label htmlFor="last_name">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="last_name"
              {...register("last_name")}
              disabled={!isEditing || isSaving}
              className={errors.last_name ? "border-red-500" : ""}
            />
            {errors.last_name && (
              <p className="mt-1 text-sm text-red-500">{errors.last_name.message}</p>
            )}
          </div>

          {/* Display Name */}
          <div>
            <Label htmlFor="display_name">Display Name (optional)</Label>
            <Input
              id="display_name"
              {...register("display_name")}
              disabled={!isEditing || isSaving}
              placeholder="How you'd like to be called"
              className={errors.display_name ? "border-red-500" : ""}
            />
            {errors.display_name && (
              <p className="mt-1 text-sm text-red-500">{errors.display_name.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Leave blank to use your first name
            </p>
          </div>

          {/* Email (read-only) */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={profile.email}
              disabled
              className="bg-gray-50 dark:bg-gray-900"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Email cannot be changed here. Contact support if needed.
            </p>
          </div>

          {/* Birth Date */}
          <div>
            <Label htmlFor="birth_date">Birth Date (optional)</Label>
            <Input
              id="birth_date"
              type="date"
              {...register("birth_date")}
              disabled={!isEditing || isSaving}
              className={errors.birth_date ? "border-red-500" : ""}
            />
            {errors.birth_date && (
              <p className="mt-1 text-sm text-red-500">{errors.birth_date.message}</p>
            )}
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

