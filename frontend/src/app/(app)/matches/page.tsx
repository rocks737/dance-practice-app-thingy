import { Users } from "lucide-react";

export default function MatchesPage() {
  return (
    <div className="max-w-6xl">
      <div className="flex items-center space-x-3 mb-6">
        <Users className="w-8 h-8 text-gray-700" />
        <h1 className="text-3xl font-bold text-gray-900">Matches</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          Find your perfect practice partners! View dancers who match your skill level,
          availability, location preferences, and dance goals.
        </p>
        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            🚧 This page is under construction. Partner matching algorithm coming soon!
          </p>
        </div>
      </div>
    </div>
  );
}
