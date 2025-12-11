"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MatchCard } from "./MatchCard";
import {
  fetchActiveInviteeIds,
  fetchEnrichedMatches,
  fetchReceivedInvites,
  fetchSentInvites,
  respondToInvite,
  type EnrichedMatch,
  type ReceivedInviteSummary,
  type SentInviteSummary,
  type InviteResponseAction,
} from "@/lib/matches/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Users, RefreshCw, AlertCircle, Calendar, Inbox, Send, Clock } from "lucide-react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";

interface MatchesBrowserProps {
  profileId: string;
}

export function MatchesBrowser({ profileId }: MatchesBrowserProps) {
  const [matches, setMatches] = useState<EnrichedMatch[]>([]);
  const [activeInviteeIds, setActiveInviteeIds] = useState<Set<string>>(new Set());
  const [sentInvites, setSentInvites] = useState<SentInviteSummary[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<ReceivedInviteSummary[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hideActiveInvites, setHideActiveInvites] = useState(false);
  const [inviteActionId, setInviteActionId] = useState<string | null>(null);

  const loadMatches = useCallback(async () => {
    setLoadingMatches(true);
    setError(null);
    try {
      const data = await fetchEnrichedMatches(20);
      setMatches(data);
    } catch (err) {
      console.error("Error fetching matches:", err);
      setError(err instanceof Error ? err.message : "Failed to load matches");
    } finally {
      setLoadingMatches(false);
    }
  }, []);

  const loadInvites = useCallback(async () => {
    setLoadingInvites(true);
    try {
      const [ids, sent, received] = await Promise.all([
        fetchActiveInviteeIds(),
        fetchSentInvites(),
        fetchReceivedInvites(),
      ]);
      setActiveInviteeIds(ids);
      setSentInvites(sent);
      setReceivedInvites(received);
    } catch (err) {
      console.warn("Unable to load invites", err);
      setActiveInviteeIds(new Set());
      setSentInvites([]);
      setReceivedInvites([]);
    } finally {
      setLoadingInvites(false);
    }
  }, []);

  useEffect(() => {
    // Fetch both matches and active invites on first load
    void loadMatches();
    void loadInvites();
  }, [loadMatches, loadInvites, profileId]);

  const visibleMatches = useMemo(() => {
    return hideActiveInvites
      ? matches.filter((match) => !activeInviteeIds.has(match.profileId))
      : matches;
  }, [hideActiveInvites, matches, activeInviteeIds]);

  const hiddenCount = matches.length - visibleMatches.length;
  const filteredAllHidden =
    hideActiveInvites && matches.length > 0 && visibleMatches.length === 0;

  // Loading state
  if (loadingMatches) {
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

  const handleInviteResponse = async (inviteId: string, action: InviteResponseAction) => {
    setInviteActionId(`${inviteId}-${action}`);
    try {
      await respondToInvite(inviteId, action);
      toast.success(
        action === "ACCEPT"
          ? "Invite accepted"
          : action === "DECLINE"
            ? "Invite declined"
            : "Invite cancelled",
      );
      await loadInvites();
    } catch (err) {
      console.error("Unable to update invite", err);
      toast.error("Unable to update invite. Please try again.");
    } finally {
      setInviteActionId(null);
    }
  };

  const getPersonLabel = (firstName?: string, lastName?: string, displayName?: string | null) => {
    if (displayName && displayName.trim().length > 0) {
      return displayName;
    }
    if (firstName || lastName) {
      return [firstName, lastName].filter(Boolean).join(" ").trim();
    }
    return "Unknown dancer";
  };

  const formatSessionWindow = (session: SentInviteSummary["session"]) => {
    if (!session?.scheduledStart || !session?.scheduledEnd) {
      return "Timing TBD";
    }
    const start = new Date(session.scheduledStart);
    const end = new Date(session.scheduledEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return "Timing TBD";
    }
    return `${format(start, "EEE, MMM d • h:mm a")} – ${format(end, "h:mm a")}`;
  };

  const requestSectionHeader = (title: string, icon: JSX.Element, count: number) => (
    <div className="mb-4 flex items-center gap-2">
      {icon}
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {title} <span className="text-sm font-normal text-gray-500">({count})</span>
      </h2>
    </div>
  );

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Potential partners
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Found {visibleMatches.length} practice{" "}
              {visibleMatches.length === 1 ? "partner" : "partners"}
              {hiddenCount > 0 && hideActiveInvites && (
                <span className="ml-2 text-xs text-amber-600 dark:text-amber-300">
                  ({hiddenCount} hidden)
                </span>
              )}
            </p>
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
      </section>

      <section>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            {requestSectionHeader(
              "Requests sent",
              <Send className="h-5 w-5 text-gray-500" />,
              sentInvites.length,
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Track pending invites and cancel ones you no longer need.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Checkbox
              checked={hideActiveInvites}
              onCheckedChange={async (val) => {
                const next = Boolean(val);
                if (next) {
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
        <div className="mt-4 space-y-4">
          {sentInvites.length === 0 && !loadingInvites && (
            <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
              No outgoing requests yet. Invite someone from the matches list above.
            </div>
          )}
          {loadingInvites && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading your requests...
            </div>
          )}
          {sentInvites.map((invite) => {
            const inviteeName = getPersonLabel(
              invite.invitee?.firstName,
              invite.invitee?.lastName,
              invite.invitee?.displayName,
            );
            return (
              <div
                key={invite.id}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{inviteeName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatSessionWindow(invite.session)}
                    </p>
                  </div>
                  <Badge variant={invite.status === "PENDING" ? "secondary" : "outline"}>
                    {invite.status}
                  </Badge>
                </div>
                {invite.note && (
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Note:</span> {invite.note}
                  </p>
                )}
                {invite.status === "PENDING" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleInviteResponse(invite.id, "CANCEL")}
                      disabled={inviteActionId === `${invite.id}-CANCEL`}
                    >
                      {inviteActionId === `${invite.id}-CANCEL` ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Cancelling…
                        </>
                      ) : (
                        "Cancel invite"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        {requestSectionHeader(
          "Requests received",
          <Inbox className="h-5 w-5 text-gray-500" />,
          receivedInvites.length,
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          These dancers would like to practice with you. Accept or decline to keep things tidy.
        </p>
        <div className="mt-4 space-y-4">
          {receivedInvites.length === 0 && !loadingInvites && (
            <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
              No incoming requests right now. We’ll list them here as soon as someone invites you.
            </div>
          )}
          {loadingInvites && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading incoming requests...
            </div>
          )}
          {receivedInvites.map((invite) => {
            const proposerName = getPersonLabel(
              invite.proposer?.firstName,
              invite.proposer?.lastName,
              invite.proposer?.displayName,
            );
            const isPending = invite.status === "PENDING";
            return (
              <div
                key={invite.id}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{proposerName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatSessionWindow(invite.session)}
                    </p>
                  </div>
                  <Badge variant={isPending ? "secondary" : "outline"}>{invite.status}</Badge>
                </div>
                {invite.note && (
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Their note:</span> {invite.note}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {isPending ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleInviteResponse(invite.id, "ACCEPT")}
                        disabled={inviteActionId === `${invite.id}-ACCEPT`}
                      >
                        {inviteActionId === `${invite.id}-ACCEPT` ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Accepting…
                          </>
                        ) : (
                          "Accept"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleInviteResponse(invite.id, "DECLINE")}
                        disabled={inviteActionId === `${invite.id}-DECLINE`}
                      >
                        {inviteActionId === `${invite.id}-DECLINE` ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Declining…
                          </>
                        ) : (
                          "Decline"
                        )}
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      Response recorded
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

