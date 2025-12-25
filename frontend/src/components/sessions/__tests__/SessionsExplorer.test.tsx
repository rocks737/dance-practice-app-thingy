import "@testing-library/jest-dom";

import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionsExplorer } from "../SessionsExplorer";

jest.mock("@/lib/hooks/useUserProfile", () => ({
  useUserProfile: jest.fn(() => ({
    profile: { id: "profile-1" },
    loading: false,
    error: null,
  })),
}));

const mockFetchSessions = jest.fn();
const mockUpdateSession = jest.fn();
const mockCreateSession = jest.fn();
const mockFetchSessionParticipantSummaries = jest.fn();
const mockFetchLocationOptions = jest.fn();
const mockJoinSession = jest.fn();
const mockLeaveSession = jest.fn();

jest.mock("@/lib/sessions/api", () => ({
  fetchSessions: (...args: any[]) => mockFetchSessions(...args),
  updateSession: (...args: any[]) => mockUpdateSession(...args),
  createSession: (...args: any[]) => mockCreateSession(...args),
  fetchSessionParticipantSummaries: (...args: any[]) =>
    mockFetchSessionParticipantSummaries(...args),
  fetchLocationOptions: (...args: any[]) => mockFetchLocationOptions(...args),
  joinSession: (...args: any[]) => mockJoinSession(...args),
  leaveSession: (...args: any[]) => mockLeaveSession(...args),
}));

describe("SessionsExplorer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchSessions.mockResolvedValue({
      sessions: [
        {
          id: "s1",
          title: "Test Session",
          sessionType: "PARTNER_PRACTICE",
          status: "SCHEDULED",
          visibility: "PUBLIC",
          scheduledStart: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          scheduledEnd: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          capacity: null,
          location: null,
          organizer: { id: "profile-1", displayName: null, firstName: "A", lastName: "B" },
          participantCount: 2,
        },
      ],
      total: 1,
    });
    mockFetchSessionParticipantSummaries.mockResolvedValue([
      { id: "profile-1", displayName: "You", firstName: "Test", lastName: "User" },
      { id: "profile-2", displayName: null, firstName: "Sam", lastName: "Lee" },
    ]);
  });

  it("opens a modal with details when the card icon is clicked", async () => {
    const user = userEvent.setup();
    render(<SessionsExplorer authUserId="auth-user-1" />);

    await waitFor(() => expect(screen.getByText("Test Session")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /^Open session details$/i }));

    const dialog = await screen.findByRole("dialog");
    const scoped = within(dialog);
    expect(scoped.getByText("Test Session")).toBeInTheDocument();
    expect(scoped.getByText(/^Participants$/i)).toBeInTheDocument();
    expect(scoped.getByText(/Signed up participants/i)).toBeInTheDocument();
    expect(scoped.getByText("You")).toBeInTheDocument();
    expect(scoped.getByText("Sam Lee")).toBeInTheDocument();
    expect(scoped.getAllByRole("button", { name: /close/i }).length).toBeGreaterThan(0);
  });
});


