/**
 * Tests for profile validation schemas
 */

import {
  personalInfoSchema,
  dancePreferencesSchema,
  biographySchema,
  passwordChangeSchema,
  profileSettingsSchema,
} from "../validation";

describe("profiles/validation", () => {
  describe("personalInfoSchema", () => {
    it("should validate valid personal info data", () => {
      const validData = {
        first_name: "John",
        last_name: "Doe",
        display_name: "Johnny",
        birth_date: "1990-01-01",
      };

      const result = personalInfoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should require first_name", () => {
      const invalidData = {
        first_name: "",
        last_name: "Doe",
      };

      const result = personalInfoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("First name is required");
      }
    });

    it("should require last_name", () => {
      const invalidData = {
        first_name: "John",
        last_name: "",
      };

      const result = personalInfoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Last name is required");
      }
    });

    it("should enforce max length on first_name (120 chars)", () => {
      const invalidData = {
        first_name: "a".repeat(121),
        last_name: "Doe",
      };

      const result = personalInfoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("120 characters");
      }
    });

    it("should enforce max length on last_name (120 chars)", () => {
      const invalidData = {
        first_name: "John",
        last_name: "a".repeat(121),
      };

      const result = personalInfoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should enforce max length on display_name (160 chars)", () => {
      const invalidData = {
        first_name: "John",
        last_name: "Doe",
        display_name: "a".repeat(161),
      };

      const result = personalInfoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should allow null display_name and birth_date", () => {
      const validData = {
        first_name: "John",
        last_name: "Doe",
        display_name: null,
        birth_date: null,
      };

      const result = personalInfoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("dancePreferencesSchema", () => {
    it("should validate valid dance preferences", () => {
      const validData = {
        primary_role: 0,
        wsdc_level: 2,
        competitiveness_level: 3,
      };

      const result = dancePreferencesSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should enforce primary_role between 0-1", () => {
      const invalidData = {
        primary_role: 2,
        wsdc_level: 2,
        competitiveness_level: 3,
      };

      const result = dancePreferencesSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should enforce wsdc_level between 0-5", () => {
      const invalidData = {
        primary_role: 0,
        wsdc_level: 6,
        competitiveness_level: 3,
      };

      const result = dancePreferencesSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should enforce competitiveness_level between 1-5", () => {
      const invalidData = {
        primary_role: 0,
        wsdc_level: 2,
        competitiveness_level: 0,
      };

      const result = dancePreferencesSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should allow null wsdc_level", () => {
      const validData = {
        primary_role: 0,
        wsdc_level: null,
        competitiveness_level: 3,
      };

      const result = dancePreferencesSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("biographySchema", () => {
    it("should validate valid biography data", () => {
      const validData = {
        bio: "I love dancing!",
        dance_goals: "Improve my technique",
      };

      const result = biographySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should enforce max length on bio (1000 chars)", () => {
      const invalidData = {
        bio: "a".repeat(1001),
        dance_goals: "Goals",
      };

      const result = biographySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("1000 characters");
      }
    });

    it("should enforce max length on dance_goals (500 chars)", () => {
      const invalidData = {
        bio: "Bio",
        dance_goals: "a".repeat(501),
      };

      const result = biographySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("500 characters");
      }
    });

    it("should allow null values", () => {
      const validData = {
        bio: null,
        dance_goals: null,
      };

      const result = biographySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("passwordChangeSchema", () => {
    it("should validate valid password change data", () => {
      const validData = {
        currentPassword: "OldPass123",
        newPassword: "NewPass123",
        confirmPassword: "NewPass123",
      };

      const result = passwordChangeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should require current password", () => {
      const invalidData = {
        currentPassword: "",
        newPassword: "NewPass123",
        confirmPassword: "NewPass123",
      };

      const result = passwordChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should enforce minimum length (8 chars) on new password", () => {
      const invalidData = {
        currentPassword: "OldPass123",
        newPassword: "Short1",
        confirmPassword: "Short1",
      };

      const result = passwordChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("8 characters");
      }
    });

    it("should require uppercase letter in new password", () => {
      const invalidData = {
        currentPassword: "OldPass123",
        newPassword: "lowercase123",
        confirmPassword: "lowercase123",
      };

      const result = passwordChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages).toContain("Password must contain at least one uppercase letter");
      }
    });

    it("should require lowercase letter in new password", () => {
      const invalidData = {
        currentPassword: "OldPass123",
        newPassword: "UPPERCASE123",
        confirmPassword: "UPPERCASE123",
      };

      const result = passwordChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages).toContain("Password must contain at least one lowercase letter");
      }
    });

    it("should require number in new password", () => {
      const invalidData = {
        currentPassword: "OldPass123",
        newPassword: "NoNumbers",
        confirmPassword: "NoNumbers",
      };

      const result = passwordChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages).toContain("Password must contain at least one number");
      }
    });

    it("should enforce password confirmation match", () => {
      const invalidData = {
        currentPassword: "OldPass123",
        newPassword: "NewPass123",
        confirmPassword: "DifferentPass123",
      };

      const result = passwordChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Passwords don't match");
      }
    });
  });

  describe("profileSettingsSchema", () => {
    it("should validate valid profile settings", () => {
      const validData = {
        profile_visible: true,
        home_location_id: "550e8400-e29b-41d4-a716-446655440000",
      };

      const result = profileSettingsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should allow null home_location_id", () => {
      const validData = {
        profile_visible: false,
        home_location_id: null,
      };

      const result = profileSettingsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should enforce UUID format for home_location_id", () => {
      const invalidData = {
        profile_visible: true,
        home_location_id: "not-a-uuid",
      };

      const result = profileSettingsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
