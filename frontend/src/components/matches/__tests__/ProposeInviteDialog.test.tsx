"use client";

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProposeInviteDialog } from "../ProposeInviteDialog";
import {
  fetchOverlapSuggestions,
  proposePracticeSession,
} from "@/lib/matches/api";

process.env.TZ = "UTC";

// Mock react-big-calendar to expose onSelectSlot without rendering the real calendar
jest.mock("react-big-calendar", () => {
  const React = require("react");
  return {
    dateFnsLocalizer: () => ({}),
    Calendar: (props: any) => (
      <div data-testid="mock-calendar">
        <button
          onClick={() =>
            props.onSelectSlot?.({
              start: new Date("2025-01-05T10:00:00Z"),
              end: new Date("2025-01-05T10:30:00Z"),
            })
          }
        >
          trigger-slot
        </button>
      </div>
    ),
  };
});

jest.mock("@/lib/matches/api");

const mockFetchOverlapSuggestions = fetchOverlapSuggestions as jest.Mock;
const mockProposePracticeSession = proposePracticeSession as jest.Mock;

const baseMatch = {
  profileId: "invitee-1",
  preferenceId: "pref-1",
  score: 90,
  overlappingWindows: 1,
  overlappingMinutes: 30,
  sharedFocusAreas: 1,
  wsdcLevelDiff: 0,
  firstName: "Ada",
  lastName: "Lovelace",
  displayName: null,
  primaryRole: 0,
  wsdcLevel: 2,
  competitivenessLevel: 3,
  bio: null,
  danceGoals: null,
  focusAreas: [],
};

describe("ProposeInviteDialog", () => {
  beforeEach(() => {
    mockFetchOverlapSuggestions.mockResolvedValue([
      {
        dayOfWeek: "SUNDAY",
        startTime: "10:00",
        endTime: "10:30",
        overlapMinutes: 30,
      },
    ]);
    mockProposePracticeSession.mockResolvedValue({
      sessionId: "session-1",
      inviteId: "invite-1",
      inviteStatus: "PENDING",
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("prefills suggestion chip and updates inputs when clicked", async () => {
    render(<ProposeInviteDialog match={baseMatch} />);

    await userEvent.click(screen.getByRole("button", { name: /propose time/i }));

    await waitFor(() => expect(mockFetchOverlapSuggestions).toHaveBeenCalled());
    const chip = await screen.findByRole("button", { name: /Sunday 10:00–10:30/i });
    await userEvent.click(chip);

    const startInput = screen.getByLabelText(/Start time/i) as HTMLInputElement;
    const endInput = screen.getByLabelText(/End time/i) as HTMLInputElement;

    expect(startInput.value).toContain("T10:00");
    expect(endInput.value).toContain("T10:30");
  });

  it("defaults to a 1-hour slot on open when the window is long enough", async () => {
    mockFetchOverlapSuggestions.mockResolvedValueOnce([
      {
        dayOfWeek: "TUESDAY",
        startTime: "18:00",
        endTime: "21:00",
        overlapMinutes: 180,
      },
    ]);

    render(<ProposeInviteDialog match={baseMatch} />);
    await userEvent.click(screen.getByRole("button", { name: /propose time/i }));
    await waitFor(() => expect(mockFetchOverlapSuggestions).toHaveBeenCalled());

    const startInput = await screen.findByLabelText(/Start time/i);
    const endInput = await screen.findByLabelText(/End time/i);

    expect((startInput as HTMLInputElement).value).toContain("T18:00");
    expect((endInput as HTMLInputElement).value).toContain("T19:00");
  });

  it("clamps to the end of a short window on open (less than 1 hour)", async () => {
    mockFetchOverlapSuggestions.mockResolvedValueOnce([
      {
        dayOfWeek: "TUESDAY",
        startTime: "18:00",
        endTime: "18:30",
        overlapMinutes: 30,
      },
    ]);

    render(<ProposeInviteDialog match={baseMatch} />);
    await userEvent.click(screen.getByRole("button", { name: /propose time/i }));
    await waitFor(() => expect(mockFetchOverlapSuggestions).toHaveBeenCalled());

    const startInput = await screen.findByLabelText(/Start time/i);
    const endInput = await screen.findByLabelText(/End time/i);

    expect((startInput as HTMLInputElement).value).toContain("T18:00");
    expect((endInput as HTMLInputElement).value).toContain("T18:30");
  });

  it("selects a slot from the calendar and submits", async () => {
    render(<ProposeInviteDialog match={baseMatch} />);

    await userEvent.click(screen.getByRole("button", { name: /propose time/i }));

    // Wait for suggestions to resolve so the calendar renders
    await waitFor(() => expect(mockFetchOverlapSuggestions).toHaveBeenCalled());

    // Ensure dialog content is visible
    await screen.findByRole("heading", { name: /propose a practice time/i });
    const sendButton = await screen.findByRole("button", { name: /send invite/i });

    // Trigger the mocked calendar slot selection
    await userEvent.click(screen.getByText("trigger-slot"));

    // Submit
    await userEvent.click(sendButton);

    expect(mockProposePracticeSession).toHaveBeenCalledTimes(1);
    const payload = mockProposePracticeSession.mock.calls[0][0];
    expect(payload.inviteeProfileId).toBe("invitee-1");
    expect(typeof payload.start).toBe("string");
    expect(typeof payload.end).toBe("string");
    expect(payload.note).toBeNull();
  });
});

