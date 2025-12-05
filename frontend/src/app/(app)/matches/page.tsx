import { Users } from "lucide-react";

export default function MatchesPage() {
  return (
    <div className="max-w-6xl">
      <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
        <Users className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700 dark:text-gray-300 flex-shrink-0" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Matches</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Find your perfect practice partners! View dancers who match your skill level,
          availability, location preferences, and dance goals.
        </p>
        <div className="mt-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">
            🚧 This page is under construction. Partner matching algorithm coming soon!
          </p>
        </div>
      </div>
    </div>
  );
}
