/**
 * MatchesBrowser tests
 */

import "@testing-library/jest-dom/jest-globals";

import { describe, it, expect, beforeEach } from "@jest/globals";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MatchesBrowser } from "../MatchesBrowser";
import type {
  EnrichedMatch,
  ReceivedInviteSummary,
  SentInviteSummary,
} from "@/lib/matches/api";
import { PrimaryRole } from "@/lib/profiles/types";

const mockFetchEnrichedMatches = jest.fn();
const mockFetchSentInvites = jest.fn();
const mockFetchReceivedInvites = jest.fn();
const mockRespondToInvite = jest.fn();

jest.mock("@/lib/matches/api", () => ({
  fetchEnrichedMatches: (...args: unknown[]) => mockFetchEnrichedMatches(...args),
  fetchSentInvites: (...args: unknown[]) => mockFetchSentInvites(...args),
  fetchReceivedInvites: (...args: unknown[]) => mockFetchReceivedInvites(...args),
  respondToInvite: (...args: unknown[]) => mockRespondToInvite(...args),
}));

jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

const mockProfileId = "test-profile-id";

const createMatch = (overrides: Partial<EnrichedMatch> = {}): EnrichedMatch => ({
  profileId: `profile-${Math.random()}`,
  preferenceId: "pref-1",
  score: 80,
  overlappingWindows: 2,
  overlappingMinutes: 120,
  sharedFocusAreas: 1,
  wsdcLevelDiff: 0,
  firstName: "Alex",
  lastName: "Rivera",
  displayName: null,
  primaryRole: PrimaryRole.LEADER,
  wsdcLevel: 2,
  competitivenessLevel: 3,
  bio: null,
  danceGoals: null,
  focusAreas: [],
  ...overrides,
});

const createSentInvite = (overrides: Partial<SentInviteSummary> = {}): SentInviteSummary => ({
  id: `sent-${Math.random()}`,
  status: "PENDING",
  note: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  expiresAt: null,
  invitee: {
    id: "invitee-1",
    firstName: "Taylor",
    lastName: "Smith",
    displayName: null,
  },
  session: {
    id: "session-1",
    title: "Practice",
    scheduledStart: null,
    scheduledEnd: null,
    status: "PROPOSED",
  },
  ...overrides,
});

const createReceivedInvite = (
  overrides: Partial<ReceivedInviteSummary> = {},
): ReceivedInviteSummary => ({
  id: `received-${Math.random()}`,
  status: "PENDING",
  note: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  expiresAt: null,
  proposer: {
    id: "proposer-1",
    firstName: "Morgan",
    lastName: "Lee",
    displayName: null,
  },
  session: {
    id: "session-2",
    title: "Session",
    scheduledStart: null,
    scheduledEnd: null,
    status: "PROPOSED",
  },
  ...overrides,
});

describe("MatchesBrowser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchSentInvites.mockResolvedValue([]);
    mockFetchReceivedInvites.mockResolvedValue([]);
    mockFetchEnrichedMatches.mockResolvedValue([]);
    mockRespondToInvite.mockResolvedValue({
      sessionId: "session-id",
      inviteId: "invite-id",
      inviteStatus: "PENDING",
    });
  });

  it("shows loading indicator while matches load", async () => {
    let resolvePromise: (value: EnrichedMatch[]) => void;
    mockFetchEnrichedMatches.mockReturnValue(
      new Promise<EnrichedMatch[]>((resolve) => {
        resolvePromise = resolve;
      }),
    );

    render(<MatchesBrowser profileId={mockProfileId} />);
    expect(screen.getByText("Finding your matches...")).toBeInTheDocument();

    resolvePromise!([]);
    await waitFor(() =>
      expect(screen.queryByText("Finding your matches...")).not.toBeInTheDocument(),
    );
  });

  it("displays error state when matches fail to load", async () => {
    mockFetchEnrichedMatches.mockRejectedValue(new Error("Network error"));

    render(<MatchesBrowser profileId={mockProfileId} />);

    await waitFor(() => {
      expect(screen.getByText("Error loading matches")).toBeInTheDocument();
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("shows matches and counts in potential partners section", async () => {
    mockFetchEnrichedMatches.mockResolvedValue([
      createMatch({ firstName: "Alice", lastName: "Smith" }),
      createMatch({ firstName: "Bob", lastName: "Jones" }),
    ]);

    render(<MatchesBrowser profileId={mockProfileId} />);

    await waitFor(() => {
      expect(screen.getByText("Potential partners")).toBeInTheDocument();
    });
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    expect(screen.getByText("Found 2 practice partners")).toBeInTheDocument();
  });

  it("shows per-person request counts on potential partner cards", async () => {
    const matchId = "person-1";
    mockFetchEnrichedMatches.mockResolvedValue([
      createMatch({ profileId: matchId, firstName: "Casey", lastName: "Ng" }),
    ]);

    const now = Date.now();
    mockFetchSentInvites.mockResolvedValue([
      createSentInvite({
        status: "PENDING",
        invitee: { id: matchId, firstName: "Casey", lastName: "Ng", displayName: null },
      }),
      createSentInvite({
        status: "ACCEPTED",
        invitee: { id: matchId, firstName: "Casey", lastName: "Ng", displayName: null },
        session: {
          id: "session-accepted",
          title: "Practice",
          scheduledStart: new Date(now + 60 * 60 * 1000).toISOString(),
          scheduledEnd: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
          status: "SCHEDULED",
        },
      }),
    ]);
    mockFetchReceivedInvites.mockResolvedValue([
      createReceivedInvite({
        status: "PENDING",
        proposer: { id: matchId, firstName: "Casey", lastName: "Ng", displayName: null },
      }),
    ]);

    render(<MatchesBrowser profileId={mockProfileId} />);

    await waitFor(() => expect(screen.getByText("Potential partners")).toBeInTheDocument());
    const heading = screen.getByRole("heading", { name: "Potential partners" });
    const section = heading.closest("section");
    expect(section).not.toBeNull();
    const scoped = within(section!);

    expect(scoped.getByText("Casey Ng")).toBeInTheDocument();
    await waitFor(() => expect(scoped.getByText(/\bsent\b/i)).toBeInTheDocument());
    const bar = scoped.getByText(/\bsent\b/i).closest("div");
    expect(bar).not.toBeNull();
    expect(bar!).toHaveTextContent(/1\s*sent/i);
    expect(bar!).toHaveTextContent(/1\s*received/i);
    expect(bar!).toHaveTextContent(/1\s*scheduled/i);
  });

  it("renders sent invite cards with cancel action", async () => {
    const sent = [
      createSentInvite({
        id: "invite-1",
        invitee: { id: "inv-1", firstName: "Sam", lastName: "Green", displayName: null },
      }),
    ];
    mockFetchSentInvites.mockResolvedValue(sent);
    mockFetchEnrichedMatches.mockResolvedValue([createMatch()]);

    const user = userEvent.setup();
    render(<MatchesBrowser profileId={mockProfileId} />);

    await waitFor(() => expect(screen.getByText("Requests sent")).toBeInTheDocument());
    expect(screen.getByText("Sam Green")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cancel invite/i }));
    await waitFor(() =>
      expect(mockRespondToInvite).toHaveBeenCalledWith("invite-1", "CANCEL"),
    );
  });

  it("renders received invites with accept/decline actions", async () => {
    const received = [
      createReceivedInvite({
        id: "rec-1",
        proposer: { id: "p1", firstName: "Jamie", lastName: "Fox", displayName: null },
      }),
    ];
    mockFetchReceivedInvites.mockResolvedValue(received);
    mockFetchEnrichedMatches.mockResolvedValue([createMatch()]);

    const user = userEvent.setup();
    render(<MatchesBrowser profileId={mockProfileId} />);

    await waitFor(() => expect(screen.getByText("Requests received")).toBeInTheDocument());
    expect(screen.getByText("Jamie Fox")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Accept/i }));
    await waitFor(() =>
      expect(mockRespondToInvite).toHaveBeenCalledWith("rec-1", "ACCEPT"),
    );
  });

  it("refresh button reloads matches and invites", async () => {
    mockFetchEnrichedMatches.mockResolvedValue([createMatch()]);

    const user = userEvent.setup();
    render(<MatchesBrowser profileId={mockProfileId} />);

    await waitFor(() => expect(screen.getByText("Potential partners")).toBeInTheDocument());
    await user.click(screen.getAllByRole("button", { name: /refresh/i })[0]);

    await waitFor(() => {
      expect(mockFetchEnrichedMatches).toHaveBeenCalledTimes(2);
      expect(mockFetchSentInvites).toHaveBeenCalledTimes(2);
      expect(mockFetchReceivedInvites).toHaveBeenCalledTimes(2);
    });
  });
});
