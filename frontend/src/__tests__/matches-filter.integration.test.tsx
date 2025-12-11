/**
 * Matches filter integration-ish test:
 * Uses real component with mocked data sources to verify the
 * "Hide people you’ve already invited" flow.
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MatchesBrowser } from "@/components/matches/MatchesBrowser";
import type { EnrichedMatch } from "@/lib/matches/api";
import { PrimaryRole } from "@/lib/profiles/types";

const mockFetchEnrichedMatches = jest.fn();
const mockFetchActiveInviteeIds = jest.fn();

jest.mock("@/lib/matches/api", () => ({
  fetchEnrichedMatches: (...args: unknown[]) => mockFetchEnrichedMatches(...args),
  fetchActiveInviteeIds: (...args: unknown[]) => mockFetchActiveInviteeIds(...args),
}));

describe("Matches filter integration (hide invited)", () => {
  const createMatch = (overrides: Partial<EnrichedMatch> = {}): EnrichedMatch => ({
    profileId: `profile-${Math.random()}`,
    preferenceId: "pref-1",
    score: 90,
    overlappingWindows: 2,
    overlappingMinutes: 120,
    sharedFocusAreas: 1,
    wsdcLevelDiff: 0,
    firstName: "Test",
    lastName: "User",
    displayName: null,
    primaryRole: PrimaryRole.FOLLOWER,
    wsdcLevel: 2,
    competitivenessLevel: 3,
    bio: null,
    danceGoals: null,
    focusAreas: [],
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchActiveInviteeIds.mockResolvedValue(new Set());
  });

  it("hides invited partners and shows hidden count", async () => {
    const matches = [
      createMatch({ firstName: "Alice", lastName: "Smith", profileId: "p1" }),
      createMatch({ firstName: "Bob", lastName: "Jones", profileId: "p2" }),
    ];

    mockFetchEnrichedMatches.mockResolvedValue(matches);
    mockFetchActiveInviteeIds.mockResolvedValue(new Set(["p2"]));

    render(<MatchesBrowser profileId="current-user" />);

    await waitFor(() => {
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
      expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    });

    const toggle = screen.getByLabelText(/hide people you’ve already invited/i);
    await userEvent.click(toggle);

    await waitFor(() => {
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
      expect(screen.queryByText("Bob Jones")).not.toBeInTheDocument();
      expect(screen.getByText(/\(1 hidden\)/)).toBeInTheDocument();
    });
  });
});
