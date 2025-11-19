import { Calendar } from "lucide-react";

export default function SchedulePage() {
  return (
    <div className="max-w-4xl">
      <div className="flex items-center space-x-3 mb-6">
        <Calendar className="w-8 h-8 text-gray-700" />
        <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          Manage your practice schedule, set your availability windows, preferred locations,
          and practice preferences to help find the perfect practice partners.
        </p>
        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            🚧 This page is under construction. Schedule management features coming soon!
          </p>
        </div>
      </div>
    </div>
  );
}

