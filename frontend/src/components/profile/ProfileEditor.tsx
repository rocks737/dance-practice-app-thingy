"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { Loader2, UserCircle, User as UserIcon, Music, Settings as SettingsIcon, Shield, ChevronDown } from "lucide-react";
import { PersonalInfoForm } from "@/components/profile/PersonalInfoForm";
import { DancePreferencesForm } from "@/components/profile/DancePreferencesForm";
import { PasswordChangeForm } from "@/components/profile/PasswordChangeForm";
import { ProfileSettings } from "@/components/profile/ProfileSettings";
import { cn } from "@/lib/utils";

interface ProfileEditorProps {
  user: User;
}

type TabValue = "personal" | "dance" | "settings" | "security";

interface TabItem {
  name: string;
  value: TabValue;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: TabItem[] = [
  { name: "Personal", value: "personal", icon: UserIcon },
  { name: "Dance", value: "dance", icon: Music },
  { name: "Settings", value: "settings", icon: SettingsIcon },
  { name: "Security", value: "security", icon: Shield },
];

export function ProfileEditor({ user }: ProfileEditorProps) {
  const { profile, loading, error, refetch } = useUserProfile(user.id);
  const [activeTab, setActiveTab] = useState<TabValue>("personal");

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
      <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
        <UserCircle className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700 dark:text-gray-300 flex-shrink-0" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Manage your information and preferences
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="mb-6">
        {/* Mobile dropdown */}
        <div className="grid grid-cols-1 sm:hidden">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as TabValue)}
            aria-label="Select a tab"
            className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 py-2 pr-8 pl-3 text-base text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            {tabs.map((tab) => (
              <option key={tab.value} value={tab.value}>
                {tab.name}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end fill-gray-500 dark:fill-gray-400"
          />
        </div>

        {/* Desktop tabs */}
        <div className="hidden sm:block">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav aria-label="Tabs" className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group inline-flex items-center border-b-2 px-1 py-4 text-sm font-medium transition-colors",
                      isActive
                        ? "border-primary text-primary"
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300"
                    )}
                  >
                    <Icon
                      aria-hidden="true"
                      className={cn(
                        "mr-2 -ml-0.5 size-5",
                        isActive
                          ? "text-primary"
                          : "text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400"
                      )}
                    />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px] sm:min-h-[640px]">
        {activeTab === "personal" && <PersonalInfoForm profile={profile} onUpdate={refetch} />}
        {activeTab === "dance" && <DancePreferencesForm profile={profile} onUpdate={refetch} />}
        {activeTab === "settings" && <ProfileSettings profile={profile} onUpdate={refetch} />}
        {activeTab === "security" && <PasswordChangeForm />}
      </div>
    </div>
  );
}
