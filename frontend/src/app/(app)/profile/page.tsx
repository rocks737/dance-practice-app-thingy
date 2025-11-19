import { UserCircle } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="max-w-4xl">
      <div className="flex items-center space-x-3 mb-6">
        <UserCircle className="w-8 h-8 text-gray-700" />
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          Your profile page will display and allow editing of your personal information,
          dance preferences, skill level, and more.
        </p>
        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            🚧 This page is under construction. Profile editing features coming soon!
          </p>
        </div>
      </div>
    </div>
  );
}

