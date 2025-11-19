/**
 * Tests for profiles API
 */

import { createClient } from "@/lib/supabase/client";
import {
  getProfileByAuthUserId,
  getProfileById,
  updateProfile,
  createDefaultUserProfile,
  ensureUserProfile,
  updatePassword,
} from "../api";
import type { UserProfile, CreateProfileParams, ProfileUpdateData } from "../types";

// Mock Supabase client
jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(),
}));

describe("profiles/api", () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      auth: {
        updateUser: jest.fn(),
      },
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe("getProfileByAuthUserId", () => {
    it("should fetch profile by auth user ID successfully", async () => {
      const mockProfile = {
        id: "profile-123",
        auth_user_id: "auth-456",
        first_name: "John",
        last_name: "Doe",
        display_name: "Johnny",
        email: "john@example.com",
        bio: "Dance enthusiast",
        dance_goals: "Master the art",
        birth_date: "1990-01-01",
        profile_visible: true,
        primary_role: 0,
        wsdc_level: 1,
        competitiveness_level: 3,
        account_status: 0,
        home_location_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        deleted_at: null,
        version: 1,
      };

      mockSupabase.single.mockResolvedValue({ data: mockProfile, error: null });

      const result = await getProfileByAuthUserId("auth-456");

      expect(mockSupabase.from).toHaveBeenCalledWith("user_profiles");
      expect(mockSupabase.select).toHaveBeenCalledWith("*");
      expect(mockSupabase.eq).toHaveBeenCalledWith("auth_user_id", "auth-456");
      expect(result).toEqual({
        id: "profile-123",
        authUserId: "auth-456",
        firstName: "John",
        lastName: "Doe",
        displayName: "Johnny",
        email: "john@example.com",
        bio: "Dance enthusiast",
        danceGoals: "Master the art",
        birthDate: "1990-01-01",
        profileVisible: true,
        primaryRole: 0,
        wsdcLevel: 1,
        competitivenessLevel: 3,
        accountStatus: 0,
        homeLocationId: null,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      });
    });

    it("should return null when profile not found", async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "No rows found" },
      });

      const result = await getProfileByAuthUserId("nonexistent");

      expect(result).toBeNull();
    });

    it("should throw error on database error", async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: "SOME_ERROR", message: "Database error" },
      });

      await expect(getProfileByAuthUserId("auth-456")).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("getProfileById", () => {
    it("should fetch profile by ID successfully", async () => {
      const mockProfile = {
        id: "profile-123",
        auth_user_id: "auth-456",
        first_name: "Jane",
        last_name: "Smith",
        display_name: null,
        email: "jane@example.com",
        bio: null,
        dance_goals: null,
        birth_date: null,
        profile_visible: true,
        primary_role: 1,
        wsdc_level: 3,
        competitiveness_level: 4,
        account_status: 0,
        home_location_id: "loc-789",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        deleted_at: null,
        version: 1,
      };

      mockSupabase.single.mockResolvedValue({ data: mockProfile, error: null });

      const result = await getProfileById("profile-123");

      expect(mockSupabase.from).toHaveBeenCalledWith("user_profiles");
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "profile-123");
      expect(result).toMatchObject({
        id: "profile-123",
        authUserId: "auth-456",
        firstName: "Jane",
        lastName: "Smith",
        displayName: null,
        primaryRole: 1,
        homeLocationId: "loc-789",
      });
    });

    it("should return null when profile not found", async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "No rows found" },
      });

      const result = await getProfileById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("updateProfile", () => {
    it("should update profile successfully", async () => {
      const updates: ProfileUpdateData = {
        first_name: "Updated",
        last_name: "Name",
        bio: "New bio",
        competitiveness_level: 5,
      };

      const mockUpdatedProfile = {
        id: "profile-123",
        auth_user_id: "auth-456",
        first_name: "Updated",
        last_name: "Name",
        display_name: null,
        email: "user@example.com",
        bio: "New bio",
        dance_goals: null,
        birth_date: null,
        profile_visible: true,
        primary_role: 0,
        wsdc_level: 2,
        competitiveness_level: 5,
        account_status: 0,
        home_location_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: new Date().toISOString(),
        deleted_at: null,
        version: 2,
      };

      mockSupabase.single.mockResolvedValue({
        data: mockUpdatedProfile,
        error: null,
      });

      const result = await updateProfile("profile-123", updates);

      expect(mockSupabase.from).toHaveBeenCalledWith("user_profiles");
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: "Updated",
          last_name: "Name",
          bio: "New bio",
          competitiveness_level: 5,
          updated_at: expect.any(String),
        })
      );
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "profile-123");
      expect(result.firstName).toBe("Updated");
      expect(result.bio).toBe("New bio");
      expect(result.competitivenessLevel).toBe(5);
    });

    it("should throw error on update failure", async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: "Update failed" },
      });

      await expect(
        updateProfile("profile-123", { first_name: "Test" })
      ).rejects.toThrow("Update failed");
    });
  });

  describe("createDefaultUserProfile", () => {
    it("should create new profile with defaults", async () => {
      const params: CreateProfileParams = {
        authUserId: "auth-new",
        email: "new@example.com",
        firstName: "New",
        lastName: "User",
      };

      const mockNewProfile = {
        id: "profile-new",
        auth_user_id: "auth-new",
        first_name: "New",
        last_name: "User",
        display_name: null,
        email: "new@example.com",
        bio: null,
        dance_goals: null,
        birth_date: null,
        profile_visible: true,
        primary_role: 0,
        wsdc_level: 1,
        competitiveness_level: 3,
        account_status: 0,
        home_location_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        deleted_at: null,
        version: 0,
      };

      // First call: check existing profile (not found)
      mockSupabase.single
        .mockResolvedValueOnce({
          data: null,
          error: { code: "PGRST116" },
        })
        // Second call: insert returns new profile
        .mockResolvedValueOnce({ data: mockNewProfile, error: null });

      // Mock the insert call chain for profile creation
      mockSupabase.insert.mockImplementation(() => {
        return {
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockNewProfile, error: null }),
        };
      });

      const result = await createDefaultUserProfile(params);

      expect(mockSupabase.from).toHaveBeenCalledWith("user_profiles");
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          auth_user_id: "auth-new",
          email: "new@example.com",
          first_name: "New",
          last_name: "User",
          primary_role: 0,
          wsdc_level: 1,
          competitiveness_level: 3,
          profile_visible: true,
          account_status: 0,
        })
      );
      expect(result.authUserId).toBe("auth-new");
      expect(result.firstName).toBe("New");
    });

    it("should return existing profile if already exists", async () => {
      const params: CreateProfileParams = {
        authUserId: "auth-existing",
        email: "existing@example.com",
      };

      const mockExistingProfile = {
        id: "profile-existing",
        auth_user_id: "auth-existing",
        first_name: "Existing",
        last_name: "User",
        display_name: null,
        email: "existing@example.com",
        bio: null,
        dance_goals: null,
        birth_date: null,
        profile_visible: true,
        primary_role: 0,
        wsdc_level: 1,
        competitiveness_level: 3,
        account_status: 0,
        home_location_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        deleted_at: null,
        version: 1,
      };

      // First call: check existing (found)
      mockSupabase.single
        .mockResolvedValueOnce({ data: { id: "profile-existing" }, error: null })
        // Second call: fetch full profile
        .mockResolvedValueOnce({ data: mockExistingProfile, error: null });

      const result = await createDefaultUserProfile(params);

      expect(mockSupabase.insert).not.toHaveBeenCalled();
      expect(result.id).toBe("profile-existing");
      expect(result.firstName).toBe("Existing");
    });

    it("should use default values when firstName/lastName not provided", async () => {
      const params: CreateProfileParams = {
        authUserId: "auth-minimal",
        email: "minimal@example.com",
      };

      const mockProfile = {
        id: "profile-minimal",
        auth_user_id: "auth-minimal",
        first_name: "",
        last_name: "",
        display_name: null,
        email: "minimal@example.com",
        bio: null,
        dance_goals: null,
        birth_date: null,
        profile_visible: true,
        primary_role: 0,
        wsdc_level: 1,
        competitiveness_level: 3,
        account_status: 0,
        home_location_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        deleted_at: null,
        version: 0,
      };

      mockSupabase.single
        .mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } })
        .mockResolvedValueOnce({ data: mockProfile, error: null });

      mockSupabase.insert.mockImplementation(() => {
        return {
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
        };
      });

      const result = await createDefaultUserProfile(params);

      expect(result.firstName).toBe("");
      expect(result.lastName).toBe("");
    });
  });

  describe("ensureUserProfile", () => {
    it("should return existing profile if found", async () => {
      const mockProfile = {
        id: "profile-123",
        auth_user_id: "auth-456",
        first_name: "Existing",
        last_name: "Profile",
        display_name: null,
        email: "existing@example.com",
        bio: null,
        dance_goals: null,
        birth_date: null,
        profile_visible: true,
        primary_role: 0,
        wsdc_level: 1,
        competitiveness_level: 3,
        account_status: 0,
        home_location_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        deleted_at: null,
        version: 1,
      };

      mockSupabase.single.mockResolvedValue({ data: mockProfile, error: null });

      const result = await ensureUserProfile("auth-456", "existing@example.com");

      expect(result).not.toBeNull();
      expect(result?.firstName).toBe("Existing");
      expect(mockSupabase.insert).not.toHaveBeenCalled();
    });

    it("should create profile if not found", async () => {
      const mockNewProfile = {
        id: "profile-new",
        auth_user_id: "auth-new",
        first_name: "",
        last_name: "",
        display_name: null,
        email: "new@example.com",
        bio: null,
        dance_goals: null,
        birth_date: null,
        profile_visible: true,
        primary_role: 0,
        wsdc_level: 1,
        competitiveness_level: 3,
        account_status: 0,
        home_location_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        deleted_at: null,
        version: 0,
      };

      // First call in ensureUserProfile: try to find existing (not found)
      // Second call in createDefaultUserProfile: check existing (not found)
      // Third call in createDefaultUserProfile: insert returns profile
      mockSupabase.single
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } })
        .mockResolvedValueOnce({ data: mockNewProfile, error: null });

      mockSupabase.insert.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockNewProfile, error: null }),
      });

      const result = await ensureUserProfile("auth-new", "new@example.com");

      expect(result).not.toBeNull();
      expect(result?.authUserId).toBe("auth-new");
      expect(mockSupabase.insert).toHaveBeenCalled();
    });
  });

  describe("updatePassword", () => {
    it("should update password successfully", async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({ error: null });

      await expect(updatePassword("newSecurePassword123")).resolves.not.toThrow();

      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: "newSecurePassword123",
      });
    });

    it("should throw error on password update failure", async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({
        error: { message: "Password too weak" },
      });

      await expect(updatePassword("weak")).rejects.toThrow("Password too weak");
    });
  });
});

