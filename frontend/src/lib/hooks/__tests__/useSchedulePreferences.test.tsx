import { renderHook } from "@testing-library/react";
import useSWR from "swr";
import { useSchedulePreferences } from "../useSchedulePreferences";

jest.mock("swr", () => jest.fn());

describe("useSchedulePreferences", () => {
  const mutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mutate.mockResolvedValue(undefined);
  });

  it("returns default state when no user id provided", () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: null,
      isLoading: false,
      isValidating: false,
      mutate,
    });

    const { result } = renderHook(() => useSchedulePreferences());

    expect(useSWR).toHaveBeenCalledWith(null, expect.any(Function));
    expect(result.current.preferences).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.refreshing).toBe(false);
  });

  it("maps SWR output into hook contract", () => {
    const preferences = [
      {
        id: "pref-1",
        userId: "user-1",
        availabilityWindows: [],
        preferredRoles: [],
        preferredLevels: [],
        preferredFocusAreas: [],
        preferredLocations: [],
        createdAt: "",
        updatedAt: "",
        locationNote: null,
        maxTravelDistanceKm: null,
        notes: null,
      },
    ];

    (useSWR as jest.Mock).mockReturnValue({
      data: preferences,
      error: null,
      isLoading: false,
      isValidating: true,
      mutate,
    });

    const { result } = renderHook(() => useSchedulePreferences("user-1"));

    expect(useSWR).toHaveBeenCalledWith(
      ["schedule-preferences", "user-1"],
      expect.any(Function),
    );
    expect(result.current.preferences).toEqual(preferences);
    expect(result.current.loading).toBe(false);
    expect(result.current.refreshing).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("exposes refresh helper that proxies to mutate", async () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: [],
      error: null,
      isLoading: false,
      isValidating: false,
      mutate,
    });

    const { result } = renderHook(() => useSchedulePreferences("user-2"));
    await result.current.refresh();

    expect(mutate).toHaveBeenCalled();
  });
});
