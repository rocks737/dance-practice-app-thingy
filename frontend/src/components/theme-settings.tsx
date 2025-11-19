"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="animate-pulse h-24 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Appearance
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Customize how the app looks on your device
      </p>

      <div className="space-y-3">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="radio"
            name="theme"
            value="light"
            checked={theme === "light"}
            onChange={(e) => setTheme(e.target.value)}
            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              Light
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Clean and bright interface
            </div>
          </div>
        </label>

        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="radio"
            name="theme"
            value="dark"
            checked={theme === "dark"}
            onChange={(e) => setTheme(e.target.value)}
            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              Dark
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Easy on the eyes in low light
            </div>
          </div>
        </label>

        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="radio"
            name="theme"
            value="system"
            checked={theme === "system"}
            onChange={(e) => setTheme(e.target.value)}
            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              System
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Matches your device theme
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}

