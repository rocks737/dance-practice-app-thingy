/**
 * Tests for MatchesBrowser component
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MatchesBrowser } from "../MatchesBrowser";
import type { EnrichedMatch } from "@/lib/matches/api";
import { PrimaryRole } from "@/lib/profiles/types";

// Create a mock function that we can control
const mockFetchEnrichedMatches = jest.fn();

// Mock the matches API
jest.mock("@/lib/matches/api", () => ({
  fetchEnrichedMatches: (...args: unknown[]) => mockFetchEnrichedMatches(...args),
}));

// Mock next/link
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

describe("MatchesBrowser", () => {
  const mockProfileId = "test-profile-id";

  const createMockMatch = (overrides: Partial<EnrichedMatch> = {}): EnrichedMatch => ({
    profileId: `profile-${Math.random()}`,
    preferenceId: "test-preference-id",
    score: 85,
    overlappingWindows: 3,
    overlappingMinutes: 180,
    sharedFocusAreas: 2,
    wsdcLevelDiff: 1,
    firstName: "Jane",
    lastName: "Doe",
    displayName: null,
    primaryRole: PrimaryRole.FOLLOWER,
    wsdcLevel: 2,
    competitivenessLevel: 3,
    bio: "I love dancing!",
    danceGoals: "Improve technique",
    focusAreas: ["TECHNIQUE"],
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Loading State", () => {
    it("should display loading indicator while fetching matches", async () => {
      // Create a promise that we control
      let resolvePromise: (value: EnrichedMatch[]) => void;
      const loadingPromise = new Promise<EnrichedMatch[]>((resolve) => {
        resolvePromise = resolve;
      });
      mockFetchEnrichedMatches.mockReturnValue(loadingPromise);

      render(<MatchesBrowser profileId={mockProfileId} />);

      expect(screen.getByText("Finding your matches...")).toBeInTheDocument();

      // Resolve the promise to prevent test timeout
      resolvePromise!([]);
      await waitFor(() => {
        expect(screen.queryByText("Finding your matches...")).not.toBeInTheDocument();
      });
    });
  });

  describe("Error State", () => {
    it("should display error message when fetch fails", async () => {
      mockFetchEnrichedMatches.mockRejectedValue(new Error("Network error"));

      render(<MatchesBrowser profileId={mockProfileId} />);

      await waitFor(() => {
        expect(screen.getByText("Error loading matches")).toBeInTheDocument();
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });

    it("should display generic error message for non-Error objects", async () => {
      mockFetchEnrichedMatches.mockRejectedValue("Something went wrong");

      render(<MatchesBrowser profileId={mockProfileId} />);

      await waitFor(() => {
        expect(screen.getByText("Failed to load matches")).toBeInTheDocument();
      });
    });

    it("should display retry button on error", async () => {
      mockFetchEnrichedMatches.mockRejectedValue(new Error("Network error"));

      render(<MatchesBrowser profileId={mockProfileId} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
      });
    });

    it("should retry fetching when retry button is clicked", async () => {
      const user = userEvent.setup();

      // First call fails
      mockFetchEnrichedMatches.mockRejectedValueOnce(new Error("Network error"));

      render(<MatchesBrowser profileId={mockProfileId} />);

      await waitFor(() => {
        expect(screen.getByText("Error loading matches")).toBeInTheDocument();
      });

      // Second call succeeds
      mockFetchEnrichedMatches.mockResolvedValueOnce([createMockMatch()]);

      await user.click(screen.getByRole("button", { name: /try again/i }));

      await waitFor(() => {
        expect(mockFetchEnrichedMatches).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Empty State", () => {
    it("should display empty state when no matches found", async () => {
      mockFetchEnrichedMatches.mockResolvedValue([]);

      render(<MatchesBrowser profileId={mockProfileId} />);

      await waitFor(() => {
        expect(screen.getByText("No matches found yet")).toBeInTheDocument();
      });
    });

    it("should display helpful suggestions in empty state", async () => {
      mockFetchEnrichedMatches.mockResolvedValue([]);

      render(<MatchesBrowser profileId={mockProfileId} />);

      await waitFor(() => {
        expect(
          screen.getByText(/Your availability windows don't overlap with others/)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/There aren't many dancers in your area yet/)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/Try expanding your available time slots/)
        ).toBeInTheDocument();
      });
    });

    it("should display Update Schedule link in empty state", async () => {
      mockFetchEnrichedMatches.mockResolvedValue([]);

      render(<MatchesBrowser profileId={mockProfileId} />);

      await waitFor(() => {
        const scheduleLink = screen.getByRole("link", { name: /update schedule/i });
        expect(scheduleLink).toHaveAttribute("href", "/schedule");
      });
    });

    it("should display Refresh button in empty state", async () => {
      mockFetchEnrichedMatches.mockResolvedValue([]);

      render(<MatchesBrowser profileId={mockProfileId} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument();
      });
    });
  });

  describe("Matches Display", () => {
    it("should display matches when available", async () => {
      const matches = [
        createMockMatch({ firstName: "Alice", lastName: "Smith" }),
        createMockMatch({ firstName: "Bob", lastName: "Jones" }),
      ];
      mockFetchEnrichedMatches.mockResolvedValue(matches);

      render(<MatchesBrowser profileId={mockProfileId} />);

      await waitFor(() => {
        expect(screen.getByText("Alice Smith")).toBeInTheDocument();
        expect(screen.getByText("Bob Jones")).toBeInTheDocument();
      });
    });

    it("should display match count", async () => {
      const matches = [
        createMockMatch({ firstName: "Alice", lastName: "Smith" }),
        createMockMatch({ firstName: "Bob", lastName: "Jones" }),
        createMockMatch({ firstName: "Charlie", lastName: "Brown" }),
      ];
      mockFetchEnrichedMatches.mockResolvedValue(matches);

      render(<MatchesBrowser profileId={mockProfileId} />);

      await waitFor(() => {
        expect(screen.getByText("Found 3 potential practice partners")).toBeInTheDocument();
      });
    });

    it("should use singular 'partner' for single match", async () => {
      mockFetchEnrichedMatches.mockResolvedValue([createMockMatch()]);

      render(<MatchesBrowser profileId={mockProfileId} />);

      await waitFor(() => {
        expect(screen.getByText("Found 1 potential practice partner")).toBeInTheDocument();
      });
    });

    it("should display refresh button in header", async () => {
      mockFetchEnrichedMatches.mockResolvedValue([createMockMatch()]);

      render(<MatchesBrowser profileId={mockProfileId} />);

      await waitFor(() => {
        const refreshButtons = screen.getAllByRole("button", { name: /refresh/i });
        expect(refreshButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Refresh Functionality", () => {
    it("should refetch matches when refresh is clicked", async () => {
      const user = userEvent.setup();
      mockFetchEnrichedMatches.mockResolvedValue([createMockMatch()]);

      render(<MatchesBrowser profileId={mockProfileId} />);

      await waitFor(() => {
        expect(screen.getByText(/Found 1 potential/)).toBeInTheDocument();
      });

      // Click refresh
      await user.click(screen.getByRole("button", { name: /refresh/i }));

      await waitFor(() => {
        expect(mockFetchEnrichedMatches).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("API Calls", () => {
    it("should call fetchEnrichedMatches with limit of 20", async () => {
      mockFetchEnrichedMatches.mockResolvedValue([]);

      render(<MatchesBrowser profileId={mockProfileId} />);

      await waitFor(() => {
        expect(mockFetchEnrichedMatches).toHaveBeenCalledWith(20);
      });
    });

    it("should fetch matches on initial render", async () => {
      mockFetchEnrichedMatches.mockResolvedValue([]);

      render(<MatchesBrowser profileId={mockProfileId} />);

      await waitFor(() => {
        expect(mockFetchEnrichedMatches).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Grid Layout", () => {
    it("should render matches in a list", async () => {
      mockFetchEnrichedMatches.mockResolvedValue([
        createMockMatch(),
        createMockMatch(),
      ]);

      render(<MatchesBrowser profileId={mockProfileId} />);

      await waitFor(() => {
        const list = screen.getByRole("list");
        expect(list).toBeInTheDocument();
        expect(list).toHaveClass("grid");
      });
    });
  });
});
