import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SchedulePlanner } from "../SchedulePlanner";
import { useSchedulePreferences } from "@/lib/hooks/useSchedulePreferences";
import { deleteSchedulePreference } from "@/lib/schedule/api";
import { toast } from "sonner";

jest.mock("@/lib/hooks/useSchedulePreferences");
jest.mock("@/components/schedule/PreferenceForm", () => ({
  PreferenceForm: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="preference-form">
      <button onClick={onClose}>close</button>
    </div>
  ),
}));
jest.mock("@/lib/schedule/api", () => ({
  deleteSchedulePreference: jest.fn(),
}));
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock("@/components/ui/dialog", () => {
  const passthrough = ({ children }: { children?: ReactNode }) => <div>{children}</div>;

  const Dialog = ({ open, children }: { open?: boolean; children?: ReactNode }) => (
    <div data-testid="dialog-root" data-open={open}>
      {open ? children : null}
    </div>
  );

  return {
    Dialog,
    DialogContent: passthrough,
    DialogHeader: passthrough,
    DialogTitle: passthrough,
  };
});

const mockUseSchedulePreferences = useSchedulePreferences as jest.MockedFunction<
  typeof useSchedulePreferences
>;

const baseHookState = () => ({
  preferences: [],
  loading: false,
  refreshing: false,
  error: null,
  refresh: jest.fn().mockResolvedValue(undefined),
});

const samplePreference = {
  id: "pref-1",
  userId: "user-1",
  locationNote: null,
  maxTravelDistanceKm: 10,
  preferredLocations: [
    { id: "loc-1", name: "Studio HQ", city: "Austin", state: "TX", country: "USA" },
  ],
  availabilityWindows: [{ dayOfWeek: "MONDAY", startTime: "10:00", endTime: "12:00" }],
  preferredRoles: ["LEAD"],
  preferredLevels: ["NOVICE"],
  preferredFocusAreas: ["TECHNIQUE"],
  notes: "Lets drill turns",
  createdAt: "2024-05-01T00:00:00.000Z",
  updatedAt: "2024-05-02T00:00:00.000Z",
};

describe("SchedulePlanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders empty state when no preferences exist", () => {
    mockUseSchedulePreferences.mockReturnValue(baseHookState());

    render(<SchedulePlanner profileId="profile-1" />);

    expect(screen.getByText(/No schedule preference yet/i)).toBeInTheDocument();
  });

  it("opens the preference dialog when clicking new preference", async () => {
    mockUseSchedulePreferences.mockReturnValue(baseHookState());

    render(<SchedulePlanner profileId="profile-1" />);

    await userEvent.click(screen.getByRole("button", { name: /New preference/i }));

    expect(screen.getByTestId("preference-form")).toBeInTheDocument();
  });

  it("deletes a preference and refreshes data", async () => {
    const hookState = {
      ...baseHookState(),
      preferences: [{ ...samplePreference, userId: "profile-1" }],
    };
    mockUseSchedulePreferences.mockReturnValue(hookState);
    (deleteSchedulePreference as jest.Mock).mockResolvedValue(undefined);

    render(<SchedulePlanner profileId="profile-1" />);

    await userEvent.click(screen.getByRole("button", { name: /Delete preference/i }));

    await waitFor(() => {
      expect(deleteSchedulePreference).toHaveBeenCalledWith({
        userId: "profile-1",
        preferenceId: "pref-1",
      });
    });
    expect(hookState.refresh).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Schedule preference deleted");
  });
});
