"use client";

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProposeInviteDialog } from "../ProposeInviteDialog";
import {
  fetchOverlapSuggestions,
  fetchPendingInviteBlocks,
  proposePracticeSession,
} from "@/lib/matches/api";
import { dateToDatetimeLocal } from "@/lib/datetime";

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
  },
}));

import { toast } from "sonner";

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
      <div data-testid="calendar-events">
        {JSON.stringify(
          (props.events ?? []).map((e: any) => ({
            id: e.id,
            title: e.title,
            kind: e.kind,
          })),
        )}
      </div>
      <div data-testid="calendar-date">
        {props.date instanceof Date ? props.date.toISOString() : String(props.date)}
      </div>
      <div data-testid="calendar-header-day-0">
        {typeof props.formats?.dayFormat === "function"
          ? props.formats.dayFormat(props.date)
          : "no-day-format"}
      </div>
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
const mockFetchPendingInviteBlocks = fetchPendingInviteBlocks as jest.Mock;
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
    mockFetchPendingInviteBlocks.mockResolvedValue([]);
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

  it("shows user-visible feedback when the backend rejects a past time", async () => {
    mockProposePracticeSession.mockRejectedValueOnce(new Error("Start time must be in the future"));

    render(<ProposeInviteDialog match={baseMatch} />);

    await userEvent.click(screen.getByRole("button", { name: /propose time/i }));

    await waitFor(() => expect(mockFetchOverlapSuggestions).toHaveBeenCalled());
    await screen.findByRole("heading", { name: /propose a practice time/i });

    const startInput = screen.getByLabelText(/Start time/i) as HTMLInputElement;
    const endInput = screen.getByLabelText(/End time/i) as HTMLInputElement;

    await userEvent.clear(startInput);
    await userEvent.type(startInput, "2020-01-01T10:00");
    await userEvent.clear(endInput);
    await userEvent.type(endInput, "2020-01-01T11:00");

    await userEvent.click(screen.getByRole("button", { name: /send invite/i }));

    // Inline error banner should show (fallback feedback)
    await screen.findByText(/start time must be in the future/i);

    // And a toast should fire so the user gets feedback even if they're scrolled.
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/start time must be in the future/i));
  });

  it("renders pending invite blocks and prevents proposing an overlapping time", async () => {
    const busyStart = new Date(Date.now() + 2 * 60 * 60 * 1000);
    busyStart.setMinutes(0, 0, 0);
    const busyEnd = new Date(busyStart.getTime() + 60 * 60 * 1000);
    const busyStartIso = busyStart.toISOString();
    const busyEndIso = busyEnd.toISOString();

    mockFetchPendingInviteBlocks.mockResolvedValueOnce([
      {
        inviteId: "pending-1",
        status: "PENDING",
        expiresAt: null,
        direction: "SENT",
        otherUser: { id: "u2", firstName: "Grace", lastName: "Hopper", displayName: null },
        session: {
          id: "s2",
          title: "Proposed practice session",
          scheduledStart: busyStartIso,
          scheduledEnd: busyEndIso,
        },
      },
    ]);

    render(<ProposeInviteDialog match={baseMatch} />);

    await userEvent.click(screen.getByRole("button", { name: /propose time/i }));

    await waitFor(() => expect(mockFetchOverlapSuggestions).toHaveBeenCalled());
    // Pending invites are loaded and should show the helper text for gray blocks.
    await screen.findByText(/Gray blocks show your existing pending invites/i);

    // Try to submit an overlapping window
    const startInput = screen.getByLabelText(/Start time/i) as HTMLInputElement;
    const endInput = screen.getByLabelText(/End time/i) as HTMLInputElement;

    const overlapEnd = new Date(busyEnd.getTime() + 30 * 60 * 1000);
    const startLocal = dateToDatetimeLocal(busyStart);
    const endLocal = dateToDatetimeLocal(overlapEnd);

    await userEvent.clear(startInput);
    await userEvent.type(startInput, startLocal);
    await userEvent.clear(endInput);
    await userEvent.type(endInput, endLocal);

    expect(startInput.value).toBe(startLocal);
    expect(endInput.value).toBe(endLocal);

    await userEvent.click(screen.getByRole("button", { name: /send invite/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/overlaps this time/i));
    });
    expect(mockProposePracticeSession).not.toHaveBeenCalled();
  });

  it("warns (but allows) when the selected time overlaps an incoming pending invite", async () => {
    const busyStart = new Date(Date.now() + 2 * 60 * 60 * 1000);
    busyStart.setMinutes(0, 0, 0);
    const busyEnd = new Date(busyStart.getTime() + 60 * 60 * 1000);

    mockFetchPendingInviteBlocks.mockResolvedValueOnce([
      {
        inviteId: "pending-incoming-1",
        status: "PENDING",
        expiresAt: null,
        direction: "RECEIVED",
        otherUser: { id: "u3", firstName: "Linus", lastName: "Torvalds", displayName: null },
        session: {
          id: "s3",
          title: "Proposed practice session",
          scheduledStart: busyStart.toISOString(),
          scheduledEnd: busyEnd.toISOString(),
        },
      },
    ]);

    // Keep the dialog open long enough to assert the warning (submit normally closes on success).
    let resolveInvite: ((v: any) => void) | null = null;
    mockProposePracticeSession.mockImplementationOnce(
      () =>
        new Promise((res) => {
          resolveInvite = res;
        }),
    );

    render(<ProposeInviteDialog match={baseMatch} />);
    await userEvent.click(screen.getByRole("button", { name: /propose time/i }));

    await waitFor(() => expect(mockFetchOverlapSuggestions).toHaveBeenCalled());
    await screen.findByText(/Gray blocks show your existing pending invites/i);

    const startLocal = dateToDatetimeLocal(busyStart);
    const endLocal = dateToDatetimeLocal(busyEnd);

    await userEvent.clear(screen.getByLabelText(/Start time/i));
    await userEvent.type(screen.getByLabelText(/Start time/i), startLocal);
    await userEvent.clear(screen.getByLabelText(/End time/i));
    await userEvent.type(screen.getByLabelText(/End time/i), endLocal);

    await userEvent.click(screen.getByRole("button", { name: /send invite/i }));

    // Warning banner should appear, but the submit should still proceed to the RPC.
    await screen.findByText(/pending invite from linus torvalds/i);
    expect(mockProposePracticeSession).toHaveBeenCalledTimes(1);

    resolveInvite?.({ sessionId: "session-1", inviteId: "invite-1", inviteStatus: "PENDING" });
  });

  it("shows the current week range and updates it when navigating weeks", async () => {
    render(<ProposeInviteDialog match={baseMatch} />);

    await userEvent.click(screen.getByRole("button", { name: /propose time/i }));
    await screen.findByRole("heading", { name: /propose a practice time/i });

    const weekRangeEl = screen.getByText(/[A-Z][a-z]{2} \d{1,2} – [A-Z][a-z]{2} \d{1,2}/);
    const initialWeekRange = weekRangeEl.textContent;
    const initialDateIso = screen.getByTestId("calendar-date").textContent;

    expect(initialWeekRange).toBeTruthy();
    expect(initialDateIso).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: /^Next$/i }));
    await waitFor(() => {
      expect(screen.getByTestId("calendar-date").textContent).not.toBe(initialDateIso);
    });
    expect(screen.getByText(/[A-Z][a-z]{2} \d{1,2} – [A-Z][a-z]{2} \d{1,2}/).textContent).not.toBe(
      initialWeekRange,
    );

    await userEvent.click(screen.getByRole("button", { name: /^Prev$/i }));
    await waitFor(() => {
      expect(screen.getByTestId("calendar-date").textContent).toBe(initialDateIso);
    });
    expect(screen.getByText(/[A-Z][a-z]{2} \d{1,2} – [A-Z][a-z]{2} \d{1,2}/).textContent).toBe(
      initialWeekRange,
    );

    await userEvent.click(screen.getByRole("button", { name: /^Today$/i }));
    await waitFor(() => {
      expect(screen.getByTestId("calendar-date").textContent).not.toBeNull();
    });
    // "Today" always navigates to a Sunday weekStart.
    const todayWeekStart = new Date(screen.getByTestId("calendar-date").textContent as string);
    expect(todayWeekStart.getDay()).toBe(0);
  });

  it("formats the week column header with day name + date (EEEE, MMM d)", async () => {
    render(<ProposeInviteDialog match={baseMatch} />);

    await userEvent.click(screen.getByRole("button", { name: /propose time/i }));
    await waitFor(() => expect(mockFetchOverlapSuggestions).toHaveBeenCalled());

    // Our calendar mock renders dayFormat(props.date) in calendar-header-day-0
    expect(screen.getByTestId("calendar-header-day-0")).toHaveTextContent(
      /^Sunday,\s+[A-Z][a-z]{2}\s+\d{1,2}$/,
    );
  });
});

