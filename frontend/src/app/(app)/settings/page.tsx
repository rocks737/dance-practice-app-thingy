import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl">
      <div className="flex items-center space-x-3 mb-6">
        <Settings className="w-8 h-8 text-gray-700" />
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          Manage your account settings, notifications, privacy preferences, and more.
        </p>
        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            🚧 This page is under construction. Settings management coming soon!
          </p>
        </div>
      </div>
    </div>
  );
}

