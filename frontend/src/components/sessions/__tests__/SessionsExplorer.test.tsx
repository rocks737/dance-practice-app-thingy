import "@testing-library/jest-dom";

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
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

jest.mock("@/lib/sessions/api", () => ({
  fetchSessions: (...args: any[]) => mockFetchSessions(...args),
  updateSession: (...args: any[]) => mockUpdateSession(...args),
  createSession: (...args: any[]) => mockCreateSession(...args),
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
  });

  it("opens a modal with details when the card icon is clicked", async () => {
    const user = userEvent.setup();
    render(<SessionsExplorer authUserId="auth-user-1" />);

    await waitFor(() => expect(screen.getByText("Test Session")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /open session details/i }));

    await screen.findByRole("dialog");
    expect(screen.getByText("Test Session")).toBeInTheDocument();
    expect(screen.getByText(/Participants/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });
});


