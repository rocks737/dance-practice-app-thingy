"use client";

import { User } from "@supabase/supabase-js";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { Loader2, UserCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonalInfoForm } from "@/components/profile/PersonalInfoForm";
import { DancePreferencesForm } from "@/components/profile/DancePreferencesForm";
import { PasswordChangeForm } from "@/components/profile/PasswordChangeForm";
import { ProfileSettings } from "@/components/profile/ProfileSettings";

interface ProfileEditorProps {
  user: User;
}

export function ProfileEditor({ user }: ProfileEditorProps) {
  const { profile, loading, error, refetch } = useUserProfile(user.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6"
        role="alert"
        aria-live="polite"
      >
        <p className="text-red-800 dark:text-red-300 font-semibold">
          Error loading profile
        </p>
        <p className="text-red-700 dark:text-red-200 mt-1">{error.message}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <p className="text-yellow-800 dark:text-yellow-300">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <UserCircle className="w-8 h-8 text-gray-700 dark:text-gray-300" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your personal information and preferences
          </p>
        </div>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="dance">Dance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <div className="min-h-[640px]">
          <TabsContent value="personal" className="h-full">
            <PersonalInfoForm profile={profile} onUpdate={refetch} />
          </TabsContent>

          <TabsContent value="dance" className="h-full">
            <DancePreferencesForm profile={profile} onUpdate={refetch} />
          </TabsContent>

          <TabsContent value="settings" className="h-full">
            <ProfileSettings profile={profile} onUpdate={refetch} />
          </TabsContent>

          <TabsContent value="security" className="h-full">
            <PasswordChangeForm />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
