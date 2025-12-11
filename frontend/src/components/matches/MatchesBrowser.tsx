"use client";

import { useEffect, useState } from "react";
import { MatchCard } from "./MatchCard";
import { fetchActiveInviteeIds, fetchEnrichedMatches, type EnrichedMatch } from "@/lib/matches/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, RefreshCw, AlertCircle, Calendar } from "lucide-react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";

interface MatchesBrowserProps {
  profileId: string;
}

export function MatchesBrowser({ profileId }: MatchesBrowserProps) {
  const [matches, setMatches] = useState<EnrichedMatch[]>([]);
  const [activeInviteeIds, setActiveInviteeIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hideActiveInvites, setHideActiveInvites] = useState(false);

  const loadInvites = async (): Promise<Set<string>> => {
    setLoadingInvites(true);
    try {
      const ids = await fetchActiveInviteeIds();
      setActiveInviteeIds(ids);
      return ids;
    } catch (err) {
      console.warn("Unable to load active invites", err);
      setActiveInviteeIds(new Set());
      return new Set();
    } finally {
      setLoadingInvites(false);
    }
  };

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
    // Fetch both matches and active invites on first load
    void loadMatches();
    void loadInvites();
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

  const visibleMatches = hideActiveInvites
    ? matches.filter((match) => !activeInviteeIds.has(match.profileId))
    : matches;
  const hiddenCount = matches.length - visibleMatches.length;

  const filteredAllHidden = hideActiveInvites && matches.length > 0 && visibleMatches.length === 0;

  // Empty state (based on visible matches)
  if (visibleMatches.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {filteredAllHidden ? "All matches are hidden" : "No matches found yet"}
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          {filteredAllHidden
            ? "You’re currently hiding people you’ve already invited. Uncheck the filter to see them again."
            : "We couldn’t find any practice partners that match your schedule and preferences. This could be because:"}
        </p>
        {!filteredAllHidden && (
          <ul className="mt-3 text-sm text-gray-500 dark:text-gray-400 text-left max-w-sm mx-auto space-y-1">
            <li>• Your availability windows don&apos;t overlap with others</li>
            <li>• There aren&apos;t many dancers in your area yet</li>
            <li>• Try expanding your available time slots</li>
          </ul>
        )}
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
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Found {visibleMatches.length} potential practice{" "}
            {visibleMatches.length === 1 ? "partner" : "partners"}
            {hiddenCount > 0 && hideActiveInvites && (
              <span className="ml-2 text-xs text-amber-600 dark:text-amber-300">
                ({hiddenCount} hidden)
              </span>
            )}
          </p>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Checkbox
              checked={hideActiveInvites}
              onCheckedChange={async (val) => {
                const next = Boolean(val);
                if (next) {
                  // Refresh invite data when enabling the filter so newly invited partners are hidden immediately
                  await loadInvites();
                }
                setHideActiveInvites(next);
              }}
              aria-label="Hide people you have active invites out to"
            />
            <span>Hide people you’ve already invited</span>
            {loadingInvites && (
              <span className="text-xs text-gray-400">(updating invites...)</span>
            )}
          </label>
        </div>
        <Button
          onClick={() => {
            void loadMatches();
            void loadInvites();
          }}
          variant="ghost"
          size="sm"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      <ul
        role="list"
        className="grid grid-cols-1 gap-6 md:grid-cols-3"
      >
        <AnimatePresence>
          {visibleMatches.map((match) => (
            <MatchCard key={match.profileId} match={match} />
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

