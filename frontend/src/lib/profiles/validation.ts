/**
 * Form validation schemas using Zod
 */

import { z } from "zod";

/**
 * Personal Information validation
 */
export const personalInfoSchema = z.object({
  first_name: z
    .string()
    .min(1, "First name is required")
    .max(120, "First name must be 120 characters or less"),
  last_name: z
    .string()
    .min(1, "Last name is required")
    .max(120, "Last name must be 120 characters or less"),
  display_name: z
    .string()
    .max(160, "Display name must be 160 characters or less")
    .nullable()
    .optional(),
  birth_date: z.string().nullable().optional(),
});

export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;

/**
 * Dance Preferences validation
 */
export const dancePreferencesSchema = z.object({
  primary_role: z.number().int().min(0).max(1),
  wsdc_level: z.number().int().min(0).max(5).nullable().optional(),
  competitiveness_level: z.number().int().min(1).max(5),
  bio: z.string().max(1000, "Bio must be 1000 characters or less").nullable().optional(),
  dance_goals: z
    .string()
    .max(500, "Dance goals must be 500 characters or less")
    .nullable()
    .optional(),
});

export type DancePreferencesFormData = z.infer<typeof dancePreferencesSchema>;

/**
 * Biography validation
 */
export const biographySchema = z.object({
  bio: z.string().max(1000, "Bio must be 1000 characters or less").nullable().optional(),
  dance_goals: z
    .string()
    .max(500, "Dance goals must be 500 characters or less")
    .nullable()
    .optional(),
});

export type BiographyFormData = z.infer<typeof biographySchema>;

/**
 * Password Change validation
 */
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

/**
 * Profile Settings validation
 */
export const profileSettingsSchema = z.object({
  profile_visible: z.boolean(),
  home_location_id: z.string().uuid().nullable().optional(),
});

export type ProfileSettingsFormData = z.infer<typeof profileSettingsSchema>;
