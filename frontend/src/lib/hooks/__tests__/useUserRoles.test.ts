import { renderHook, waitFor } from "@testing-library/react";
import { useUserRoles } from "@/lib/hooks/useUserRoles";

// We'll use the global mock from jest.setup.ts
// Mock the Supabase responses for this test
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();

// Mock createClient before importing
jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

describe("useUserRoles", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock chain
    mockEq.mockReturnValue({
      data: [{ role: "ADMIN" }, { role: "DANCER" }],
      error: null,
    });
    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockFrom.mockReturnValue({
      select: mockSelect,
    });
  });

  it("returns initial state when no userId provided", () => {
    const { result } = renderHook(() => useUserRoles());

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isInstructor).toBe(false);
    expect(result.current.isOrganizer).toBe(false);
    expect(result.current.isDancer).toBe(false);
    expect(result.current.roles).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it("fetches and sets user roles", async () => {
    const { result } = renderHook(() => useUserRoles("user-123"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isDancer).toBe(true);
    expect(result.current.roles).toEqual(["ADMIN", "DANCER"]);
    expect(mockFrom).toHaveBeenCalledWith("user_roles");
  });

  it("handles errors gracefully", async () => {
    mockEq.mockReturnValue({
      data: null,
      error: new Error("Database error"),
    });

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const { result } = renderHook(() => useUserRoles("user-123"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.roles).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("correctly identifies instructor role", async () => {
    mockEq.mockReturnValue({
      data: [{ role: "INSTRUCTOR" }],
      error: null,
    });

    const { result } = renderHook(() => useUserRoles("user-123"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isInstructor).toBe(true);
    expect(result.current.isAdmin).toBe(false);
  });
});
