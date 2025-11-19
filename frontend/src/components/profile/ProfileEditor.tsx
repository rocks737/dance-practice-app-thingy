"use client";

import { User } from "@supabase/supabase-js";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { Loader2, UserCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonalInfoForm } from "@/components/profile/PersonalInfoForm";
import { DancePreferencesForm } from "@/components/profile/DancePreferencesForm";

interface ProfileEditorProps {
  user: User;
}

export function ProfileEditor({ user }: ProfileEditorProps) {
  const { profile, loading, error } = useUserProfile(user.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-300">Error loading profile: {error.message}</p>
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
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <UserCircle className="w-8 h-8 text-gray-700 dark:text-gray-300" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your personal information and preferences</p>
        </div>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="dance">Dance</TabsTrigger>
          <TabsTrigger value="bio">Biography</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <PersonalInfoForm profile={profile} />
        </TabsContent>

        <TabsContent value="dance">
          <DancePreferencesForm profile={profile} />
        </TabsContent>

        <TabsContent value="bio">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Biography</h2>
            <p className="text-gray-600 dark:text-gray-400">🚧 Coming soon</p>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Profile Settings</h2>
            <p className="text-gray-600 dark:text-gray-400">🚧 Coming soon</p>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Security</h2>
            <p className="text-gray-600 dark:text-gray-400">🚧 Coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

