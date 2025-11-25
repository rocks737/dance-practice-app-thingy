import { Settings } from "lucide-react";
import { ThemeSettings } from "@/components/theme-settings";

export default function SettingsPage() {
  return (
    <div className="w-full max-w-4xl">
      <div className="flex items-center space-x-3 mb-6">
        <Settings className="w-8 h-8 text-gray-700 dark:text-gray-300" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
      </div>

      <div className="space-y-6">
        <ThemeSettings />

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Account Settings
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account settings, notifications, privacy preferences, and more.
          </p>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              🚧 Additional settings options coming soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
