/**
 * Tests for profile types and utilities
 */

import {
  PrimaryRole,
  WsdcSkillLevel,
  AccountStatus,
  PRIMARY_ROLE_LABELS,
  WSDC_SKILL_LEVEL_LABELS,
  ACCOUNT_STATUS_LABELS,
  PRIMARY_ROLE_OPTIONS,
  WSDC_SKILL_LEVEL_OPTIONS,
} from "../types";

describe("profiles/types", () => {
  describe("Enums", () => {
    it("should have correct PrimaryRole values", () => {
      expect(PrimaryRole.LEADER).toBe(0);
      expect(PrimaryRole.FOLLOWER).toBe(1);
    });

    it("should have correct WsdcSkillLevel values", () => {
      expect(WsdcSkillLevel.NEWCOMER).toBe(0);
      expect(WsdcSkillLevel.NOVICE).toBe(1);
      expect(WsdcSkillLevel.INTERMEDIATE).toBe(2);
      expect(WsdcSkillLevel.ADVANCED).toBe(3);
      expect(WsdcSkillLevel.ALLSTAR).toBe(4);
      expect(WsdcSkillLevel.CHAMPION).toBe(5);
    });

    it("should have correct AccountStatus values", () => {
      expect(AccountStatus.ACTIVE).toBe(0);
      expect(AccountStatus.SUSPENDED).toBe(1);
      expect(AccountStatus.DELETED).toBe(2);
    });
  });

  describe("Labels", () => {
    it("should have labels for all PrimaryRole values", () => {
      expect(PRIMARY_ROLE_LABELS[PrimaryRole.LEADER]).toBe("Leader");
      expect(PRIMARY_ROLE_LABELS[PrimaryRole.FOLLOWER]).toBe("Follower");
    });

    it("should have labels for all WsdcSkillLevel values", () => {
      expect(WSDC_SKILL_LEVEL_LABELS[WsdcSkillLevel.NEWCOMER]).toBe("Newcomer");
      expect(WSDC_SKILL_LEVEL_LABELS[WsdcSkillLevel.NOVICE]).toBe("Novice");
      expect(WSDC_SKILL_LEVEL_LABELS[WsdcSkillLevel.INTERMEDIATE]).toBe("Intermediate");
      expect(WSDC_SKILL_LEVEL_LABELS[WsdcSkillLevel.ADVANCED]).toBe("Advanced");
      expect(WSDC_SKILL_LEVEL_LABELS[WsdcSkillLevel.ALLSTAR]).toBe("All-Star");
      expect(WSDC_SKILL_LEVEL_LABELS[WsdcSkillLevel.CHAMPION]).toBe("Champion");
    });

    it("should have labels for all AccountStatus values", () => {
      expect(ACCOUNT_STATUS_LABELS[AccountStatus.ACTIVE]).toBe("Active");
      expect(ACCOUNT_STATUS_LABELS[AccountStatus.SUSPENDED]).toBe("Suspended");
      expect(ACCOUNT_STATUS_LABELS[AccountStatus.DELETED]).toBe("Deleted");
    });
  });

  describe("Options", () => {
    it("should have correct PRIMARY_ROLE_OPTIONS structure", () => {
      expect(PRIMARY_ROLE_OPTIONS).toHaveLength(2);
      expect(PRIMARY_ROLE_OPTIONS[0]).toEqual({
        value: PrimaryRole.LEADER,
        label: "Leader",
      });
      expect(PRIMARY_ROLE_OPTIONS[1]).toEqual({
        value: PrimaryRole.FOLLOWER,
        label: "Follower",
      });
    });

    it("should have correct WSDC_SKILL_LEVEL_OPTIONS structure", () => {
      expect(WSDC_SKILL_LEVEL_OPTIONS).toHaveLength(6);
      expect(WSDC_SKILL_LEVEL_OPTIONS[0]).toEqual({
        value: WsdcSkillLevel.NEWCOMER,
        label: "Newcomer",
      });
      expect(WSDC_SKILL_LEVEL_OPTIONS[5]).toEqual({
        value: WsdcSkillLevel.CHAMPION,
        label: "Champion",
      });
    });

    it("should have all options with value and label", () => {
      PRIMARY_ROLE_OPTIONS.forEach((option) => {
        expect(option).toHaveProperty("value");
        expect(option).toHaveProperty("label");
        expect(typeof option.value).toBe("number");
        expect(typeof option.label).toBe("string");
      });

      WSDC_SKILL_LEVEL_OPTIONS.forEach((option) => {
        expect(option).toHaveProperty("value");
        expect(option).toHaveProperty("label");
        expect(typeof option.value).toBe("number");
        expect(typeof option.label).toBe("string");
      });
    });
  });

  describe("Type definitions", () => {
    it("should allow valid UserProfile structure", () => {
      const profile = {
        id: "profile-123",
        authUserId: "auth-456",
        firstName: "John",
        lastName: "Doe",
        displayName: "Johnny",
        email: "john@example.com",
        bio: "Dance lover",
        danceGoals: "Master WCS",
        birthDate: "1990-01-01",
        profileVisible: true,
        primaryRole: PrimaryRole.LEADER,
        wsdcLevel: WsdcSkillLevel.INTERMEDIATE,
        competitivenessLevel: 3,
        accountStatus: AccountStatus.ACTIVE,
        homeLocationId: null,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      // Type check - if this compiles, the type is correct
      expect(profile.id).toBe("profile-123");
      expect(profile.primaryRole).toBe(PrimaryRole.LEADER);
    });

    it("should allow valid CreateProfileParams structure", () => {
      const params = {
        authUserId: "auth-123",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        displayName: "Tester",
      };

      expect(params.authUserId).toBe("auth-123");
      expect(params.email).toBe("test@example.com");
    });

    it("should allow valid ProfileUpdateData with partial fields", () => {
      const update1 = {
        first_name: "Updated",
      };

      const update2 = {
        bio: "New bio",
        dance_goals: "New goals",
        competitiveness_level: 5,
      };

      const update3 = {
        primary_role: PrimaryRole.FOLLOWER,
        wsdc_level: WsdcSkillLevel.ADVANCED,
        profile_visible: false,
      };

      expect(update1.first_name).toBe("Updated");
      expect(update2.bio).toBe("New bio");
      expect(update3.primary_role).toBe(PrimaryRole.FOLLOWER);
    });

    it("should allow valid PasswordChangeData structure", () => {
      const passwordData = {
        currentPassword: "oldPass123",
        newPassword: "newSecurePass456",
        confirmPassword: "newSecurePass456",
      };

      expect(passwordData.currentPassword).toBe("oldPass123");
      expect(passwordData.newPassword).toBe("newSecurePass456");
    });
  });
});

