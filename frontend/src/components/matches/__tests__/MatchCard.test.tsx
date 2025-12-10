/**
 * Tests for MatchCard component
 */

import { describe, it, expect } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { MatchCard } from "../MatchCard";
import type { EnrichedMatch } from "@/lib/matches/api";
import { PrimaryRole } from "@/lib/profiles/types";

describe("MatchCard", () => {
  const createMockMatch = (overrides: Partial<EnrichedMatch> = {}): EnrichedMatch => ({
    profileId: "test-profile-id",
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
    wsdcLevel: 2, // INTERMEDIATE
    competitivenessLevel: 3,
    bio: "I love dancing West Coast Swing!",
    danceGoals: "Improve my musicality and styling",
    focusAreas: ["TECHNIQUE", "MUSICALITY"],
    ...overrides,
  });

  describe("Display Name", () => {
    it("should display displayName when provided", () => {
      const match = createMockMatch({ displayName: "DanceQueen" });
      render(<MatchCard match={match} />);

      expect(screen.getByText("DanceQueen")).toBeInTheDocument();
    });

    it("should display firstName lastName when no displayName", () => {
      const match = createMockMatch({ displayName: null });
      render(<MatchCard match={match} />);

      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });

    it("should display 'Unknown' when name fields are empty", () => {
      const match = createMockMatch({
        displayName: null,
        firstName: "",
        lastName: "",
      });
      render(<MatchCard match={match} />);

      expect(screen.getByText("Unknown")).toBeInTheDocument();
    });
  });

  describe("Role Display", () => {
    it("should display 'L' for leader role", () => {
      const match = createMockMatch({ primaryRole: PrimaryRole.LEADER });
      render(<MatchCard match={match} />);

      expect(screen.getByText("L")).toBeInTheDocument();
    });

    it("should display 'F' for follower role", () => {
      const match = createMockMatch({ primaryRole: PrimaryRole.FOLLOWER });
      render(<MatchCard match={match} />);

      expect(screen.getByText("F")).toBeInTheDocument();
    });
  });

  describe("WSDC Level", () => {
    it("should display WSDC level label when provided", () => {
      const match = createMockMatch({ wsdcLevel: 2 }); // INTERMEDIATE
      render(<MatchCard match={match} />);

      expect(screen.getByText("Intermediate")).toBeInTheDocument();
    });

    it("should display 'Not specified' when wsdcLevel is null", () => {
      const match = createMockMatch({ wsdcLevel: null });
      render(<MatchCard match={match} />);

      expect(screen.getByText("Not specified")).toBeInTheDocument();
    });
  });

  describe("Competitiveness Level", () => {
    it("should display competitiveness label", () => {
      const match = createMockMatch({ competitivenessLevel: 3 });
      render(<MatchCard match={match} />);

      expect(screen.getByText("Balanced")).toBeInTheDocument();
    });

    it("should display 'Very Casual' for level 1", () => {
      const match = createMockMatch({ competitivenessLevel: 1 });
      render(<MatchCard match={match} />);

      expect(screen.getByText("Very Casual")).toBeInTheDocument();
    });

    it("should display 'Very Competitive' for level 5", () => {
      const match = createMockMatch({ competitivenessLevel: 5 });
      render(<MatchCard match={match} />);

      expect(screen.getByText("Very Competitive")).toBeInTheDocument();
    });
  });

  describe("Bio Section", () => {
    it("should display bio when provided", () => {
      const match = createMockMatch({ bio: "I love dancing West Coast Swing!" });
      render(<MatchCard match={match} />);

      expect(screen.getByText("About")).toBeInTheDocument();
      expect(screen.getByText("I love dancing West Coast Swing!")).toBeInTheDocument();
    });

    it("should not display bio section when bio is null", () => {
      const match = createMockMatch({ bio: null });
      render(<MatchCard match={match} />);

      expect(screen.queryByText("About")).not.toBeInTheDocument();
    });
  });

  describe("Dance Goals Section", () => {
    it("should display dance goals when provided", () => {
      const match = createMockMatch({ danceGoals: "Improve my musicality and styling" });
      render(<MatchCard match={match} />);

      expect(screen.getByText("Dance Goals")).toBeInTheDocument();
      expect(screen.getByText("Improve my musicality and styling")).toBeInTheDocument();
    });

    it("should not display dance goals section when danceGoals is null", () => {
      const match = createMockMatch({ danceGoals: null });
      render(<MatchCard match={match} />);

      expect(screen.queryByText("Dance Goals")).not.toBeInTheDocument();
    });
  });

  describe("Focus Areas", () => {
    it("should display focus areas when provided", () => {
      const match = createMockMatch({ focusAreas: ["TECHNIQUE", "MUSICALITY"] });
      render(<MatchCard match={match} />);

      expect(screen.getByText("Technique")).toBeInTheDocument();
      expect(screen.getByText("Musicality")).toBeInTheDocument();
    });

    it("should not display focus areas section when array is empty", () => {
      const match = createMockMatch({ focusAreas: [] });
      render(<MatchCard match={match} />);

      // Focus areas badges should not be present when array is empty
      expect(screen.queryByText("Technique")).not.toBeInTheDocument();
      expect(screen.queryByText("Musicality")).not.toBeInTheDocument();
    });
  });

  describe("Match Score Footer", () => {
    it("should display match score as percentage", () => {
      const match = createMockMatch({ score: 85.7 });
      render(<MatchCard match={match} />);

      expect(screen.getByText("86%")).toBeInTheDocument();
      expect(screen.getByText("match")).toBeInTheDocument();
    });

    it("should display singular 'window' for 1 overlapping window", () => {
      const match = createMockMatch({ overlappingWindows: 1 });
      render(<MatchCard match={match} />);

      expect(screen.getByText(/1 overlapping window$/)).toBeInTheDocument();
    });

    it("should display plural 'windows' for multiple overlapping windows", () => {
      const match = createMockMatch({ overlappingWindows: 3 });
      render(<MatchCard match={match} />);

      expect(screen.getByText(/3 overlapping windows$/)).toBeInTheDocument();
    });
  });

  describe("Rendering", () => {
    it("should render as a list item", () => {
      const match = createMockMatch();
      const { container } = render(<MatchCard match={match} />);

      expect(container.querySelector("li")).toBeInTheDocument();
    });

    it("should apply correct styling for leader role", () => {
      const match = createMockMatch({ primaryRole: PrimaryRole.LEADER });
      render(<MatchCard match={match} />);

      const roleIcon = screen.getByText("L").closest("div");
      expect(roleIcon).toHaveClass("bg-blue-100");
    });

    it("should apply correct styling for follower role", () => {
      const match = createMockMatch({ primaryRole: PrimaryRole.FOLLOWER });
      render(<MatchCard match={match} />);

      const roleIcon = screen.getByText("F").closest("div");
      expect(roleIcon).toHaveClass("bg-pink-100");
    });
  });
});
