"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MatchCard } from "./MatchCard";
import {
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
  const [sentInvites, setSentInvites] = useState<SentInviteSummary[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<ReceivedInviteSummary[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      const [sent, received] = await Promise.all([fetchSentInvites(), fetchReceivedInvites()]);
      setSentInvites(sent);
      setReceivedInvites(received);
    } catch (err) {
      console.warn("Unable to load invites", err);
      setSentInvites([]);
      setReceivedInvites([]);
    } finally {
      setLoadingInvites(false);
    }
  }, []);

  useEffect(() => {
    // Fetch matches + invite inbox/outbox on first load
    void loadMatches();
    void loadInvites();
  }, [loadMatches, loadInvites, profileId]);

  const hasMatches = matches.length > 0;

  const handleInviteSent = useCallback(async () => {
    await Promise.all([loadInvites(), loadMatches()]);
  }, [loadInvites, loadMatches]);

  const isInviteExpired = (status?: string, expiresAt?: string | null) => {
    if ((status ?? "").toUpperCase() === "EXPIRED") return true;
    // Fallback during cron lag (or if expires_at is set but status hasn’t been swept yet)
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const relationshipCountsByProfileId = useMemo(() => {
    const now = new Date();
    const counts = new Map<string, { sent: number; received: number; scheduled: number }>();

    const ensure = (id: string) => {
      const existing = counts.get(id);
      if (existing) return existing;
      const created = { sent: 0, received: 0, scheduled: 0 };
      counts.set(id, created);
      return created;
    };

    for (const invite of sentInvites) {
      const otherId = invite.invitee?.id;
      if (!otherId) continue;
      const entry = ensure(otherId);

      if (invite.status === "PENDING" && !isInviteExpired(invite.status, invite.expiresAt)) {
        entry.sent += 1;
      }

      if (invite.status === "ACCEPTED") {
        const status = (invite.session?.status ?? "").toUpperCase();
        const start = invite.session?.scheduledStart ? new Date(invite.session.scheduledStart) : null;
        if (status === "SCHEDULED" && start && !Number.isNaN(start.getTime()) && start > now) {
          entry.scheduled += 1;
        }
      }
    }

    for (const invite of receivedInvites) {
      const otherId = invite.proposer?.id;
      if (!otherId) continue;
      const entry = ensure(otherId);

      if (invite.status === "PENDING" && !isInviteExpired(invite.status, invite.expiresAt)) {
        entry.received += 1;
      }

      if (invite.status === "ACCEPTED") {
        const status = (invite.session?.status ?? "").toUpperCase();
        const start = invite.session?.scheduledStart ? new Date(invite.session.scheduledStart) : null;
        if (status === "SCHEDULED" && start && !Number.isNaN(start.getTime()) && start > now) {
          entry.scheduled += 1;
        }
      }
    }

    return counts;
  }, [sentInvites, receivedInvites]);

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

  const matchesEmptyState = (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center">
      <Users className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
        No matches found yet
      </h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
        We couldn’t find any practice partners that match your schedule and preferences. This could be because:
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

  const handleInviteResponse = async (
    inviteId: string,
    action: InviteResponseAction,
    inviteUpdatedAt?: string,
  ) => {
    setInviteActionId(`${inviteId}-${action}`);
    try {
      const result = await respondToInvite(inviteId, action);
      if (action === "CANCEL" && inviteUpdatedAt && result.inviteStatus === "PENDING") {
        // Invite was already processed server-side; treat as no-op
        toast.info("That invite was already handled.");
        return;
      }
      toast.success(
        action === "ACCEPT"
          ? "Invite accepted"
          : action === "DECLINE"
            ? "Invite declined"
            : "Invite cancelled",
      );
      await loadInvites();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (/invite expired/i.test(message)) {
        toast.info("That invite has already expired.");
        await loadInvites();
        return;
      }
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
            const inviteExpired = isInviteExpired(invite.status, invite.expiresAt);
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
                {inviteExpired && (
                  <p className="mt-3 text-xs text-amber-600 dark:text-amber-300">
                    This invite expired before it could be accepted.
                  </p>
                )}

                {invite.status === "PENDING" && !inviteExpired && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleInviteResponse(invite.id, "CANCEL", invite.updatedAt)}
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
            const inviteExpired = isInviteExpired(invite.status, invite.expiresAt);
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
                  {isPending && !inviteExpired ? (
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

      <section>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Potential partners
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Found {matches.length} practice {matches.length === 1 ? "partner" : "partners"}
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
        {matches.length === 0 ? (
          matchesEmptyState
        ) : (
          <ul
            role="list"
            className="grid grid-cols-1 gap-6 md:grid-cols-3"
          >
            <AnimatePresence>
              {matches.map((match) => (
                <MatchCard
                  key={match.profileId}
                  match={match}
                  onInviteSent={handleInviteSent}
                  relationshipCounts={relationshipCountsByProfileId.get(match.profileId)}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>
    </div>
  );
}

