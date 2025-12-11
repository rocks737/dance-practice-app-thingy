"use client";

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProposeInviteDialog } from "../ProposeInviteDialog";
import {
  fetchOverlapSuggestions,
  proposePracticeSession,
} from "@/lib/matches/api";

// JSDOM lacks ResizeObserver used by radix primitives
if (typeof (global as any).ResizeObserver === "undefined") {
  (global as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

process.env.TZ = "UTC";

// Mock react-big-calendar to expose onSelectSlot without rendering the real calendar
jest.mock("react-big-calendar", () => {
  const React = require("react");
  const Calendar = (props: any) => (
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
      <button
        onClick={() =>
          props.onEventDrop?.({
            event: { id: "selected-range" },
            start: new Date("2025-01-05T11:00:00Z"),
            end: new Date("2025-01-05T11:30:00Z"),
          }) || props.onSelectSlot?.({
            start: new Date("2025-01-05T11:00:00Z"),
            end: new Date("2025-01-05T12:00:00Z"),
          })
        }
      >
        move-selected
      </button>
    </div>
  );

  return {
    dateFnsLocalizer: () => ({}),
    Calendar,
    withDragAndDrop: () => Calendar,
  };
});

jest.mock("react-big-calendar/lib/addons/dragAndDrop", () => ({
  __esModule: true,
  default: (Comp: any) => Comp,
}));

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

  it("defaults to hiding empty days", async () => {
    render(<ProposeInviteDialog match={baseMatch} />);

    await userEvent.click(screen.getByRole("button", { name: /propose time/i }));

    const checkbox = await screen.findByRole("checkbox", { name: /hide days without overlap/i });
    expect(checkbox).toBeChecked();
  });

  it("lets the user toggle hiding empty days", async () => {
    render(<ProposeInviteDialog match={baseMatch} />);

    await userEvent.click(screen.getByRole("button", { name: /propose time/i }));

    const checkbox = await screen.findByRole("checkbox", { name: /hide days without overlap/i });
    expect(checkbox).toBeChecked();

    await userEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();

    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it("resets hiding empty days to default when the dialog closes", async () => {
    render(<ProposeInviteDialog match={baseMatch} />);

    await userEvent.click(screen.getByRole("button", { name: /propose time/i }));

    const checkbox = await screen.findByRole("checkbox", { name: /hide days without overlap/i });
    await userEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();

    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    await userEvent.click(screen.getByRole("button", { name: /propose time/i }));

    const checkboxAfterReopen = await screen.findByRole("checkbox", { name: /hide days without overlap/i });
    expect(checkboxAfterReopen).toBeChecked();
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

