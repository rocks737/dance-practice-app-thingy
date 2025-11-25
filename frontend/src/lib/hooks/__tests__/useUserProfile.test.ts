import { renderHook, waitFor } from "@testing-library/react";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { getProfileByAuthUserId } from "@/lib/profiles/client";
import type { UserProfile } from "@/lib/profiles/types";

jest.mock("@/lib/profiles/client");

const mockGetProfileByAuthUserId = getProfileByAuthUserId as jest.MockedFunction<
  typeof getProfileByAuthUserId
>;

const mockProfileData: UserProfile = {
  id: "profile-123",
  authUserId: "user-123",
  firstName: "John",
  lastName: "Doe",
  displayName: "JohnD",
  email: "john@example.com",
  bio: "Test bio",
  danceGoals: "Improve technique",
  birthDate: "1990-01-01",
  profileVisible: true,
  primaryRole: 0,
  wsdcLevel: 2,
  competitivenessLevel: 3,
  accountStatus: 0,
  homeLocationId: null,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("useUserProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns initial state when no authUserId provided", () => {
    const { result } = renderHook(() => useUserProfile());

    expect(result.current.profile).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("fetches and sets user profile", async () => {
    mockGetProfileByAuthUserId.mockResolvedValueOnce(mockProfileData);

    const { result } = renderHook(() => useUserProfile("user-123"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toEqual(mockProfileData);
    expect(result.current.error).toBeNull();
    expect(mockGetProfileByAuthUserId).toHaveBeenCalledWith("user-123");
  });

  it("handles errors gracefully", async () => {
    const error = new Error("Database error");
    mockGetProfileByAuthUserId.mockRejectedValueOnce(error);

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const { result } = renderHook(() => useUserProfile("user-123"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toBeNull();
    expect(result.current.error).toEqual(error);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("provides refetch function", async () => {
    mockGetProfileByAuthUserId.mockResolvedValueOnce(mockProfileData);

    const { result } = renderHook(() => useUserProfile("user-123"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.refetch).toBeDefined();
    expect(typeof result.current.refetch).toBe("function");

    // Test refetch
    mockGetProfileByAuthUserId.mockResolvedValueOnce({
      ...mockProfileData,
      firstName: "Jane",
    });

    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.profile?.firstName).toBe("Jane");
    });
  });
});
