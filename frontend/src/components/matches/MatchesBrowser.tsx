"use client";

import { useEffect, useState } from "react";
import { MatchCard } from "./MatchCard";
import { fetchEnrichedMatches, type EnrichedMatch } from "@/lib/matches/api";
import { Button } from "@/components/ui/button";
import { Users, RefreshCw, AlertCircle, Calendar } from "lucide-react";
import Link from "next/link";

interface MatchesBrowserProps {
  profileId: string;
}

export function MatchesBrowser({ profileId }: MatchesBrowserProps) {
  const [matches, setMatches] = useState<EnrichedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEnrichedMatches(20);
      setMatches(data);
    } catch (err) {
      console.error("Error fetching matches:", err);
      setError(err instanceof Error ? err.message : "Failed to load matches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, [profileId]);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Finding your matches...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
        <h3 className="mt-3 text-sm font-semibold text-red-800 dark:text-red-300">
          Error loading matches
        </h3>
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        <Button
          onClick={loadMatches}
          variant="outline"
          size="sm"
          className="mt-4"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      </div>
    );
  }

  // Empty state
  if (matches.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          No matches found yet
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          We couldn&apos;t find any practice partners that match your schedule and
          preferences. This could be because:
        </p>
        <ul className="mt-3 text-sm text-gray-500 dark:text-gray-400 text-left max-w-sm mx-auto space-y-1">
          <li>• Your availability windows don&apos;t overlap with others</li>
          <li>• There aren&apos;t many dancers in your area yet</li>
          <li>• Try expanding your available time slots</li>
        </ul>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/schedule">
              <Calendar className="mr-2 h-4 w-4" />
              Update Schedule
            </Link>
          </Button>
          <Button onClick={loadMatches} variant="secondary">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  // Matches grid
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Found {matches.length} potential practice{" "}
          {matches.length === 1 ? "partner" : "partners"}
        </p>
        <Button onClick={loadMatches} variant="ghost" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      <ul
        role="list"
        className="grid grid-cols-1 gap-6 md:grid-cols-3"
      >
        {matches.map((match) => (
          <MatchCard key={match.profileId} match={match} />
        ))}
      </ul>
    </div>
  );
}
