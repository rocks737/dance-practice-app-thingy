/**
 * Onboarding-specific functions for user sign-up flow using Supabase
 */

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { UserProfile } from "./types";

type UserProfileInsert = Database["public"]["Tables"]["user_profiles"]["Insert"];
type UserProfileRow = Database["public"]["Tables"]["user_profiles"]["Row"];

export interface OnboardingProfileData {
  authUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  birthDate?: string;
  primaryRole: number;
  competitivenessLevel: number;
  wsdcLevel?: number | null;
  bio?: string;
  danceGoals?: string;
}

/**
 * Create a new user profile during onboarding
 */
export async function createUserProfile(
  data: OnboardingProfileData
): Promise<UserProfile> {
  const supabase = createClient();

  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("auth_user_id", data.authUserId)
    .maybeSingle();

  if (existingProfile) {
    throw new Error("Profile already exists for this user");
  }

  // Create the profile
  const insertData: UserProfileInsert = {
    auth_user_id: data.authUserId,
    email: data.email,
    first_name: data.firstName,
    last_name: data.lastName,
    display_name: data.displayName || null,
    birth_date: data.birthDate || null,
    primary_role: data.primaryRole,
    competitiveness_level: data.competitivenessLevel,
    wsdc_level: data.wsdcLevel ?? null,
    bio: data.bio || null,
    dance_goals: data.danceGoals || null,
    profile_visible: true,
    account_status: 0, // ACTIVE
  };

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .insert(insertData)
    .select()
    .single();

  if (profileError) {
    console.error("Error creating user profile:", profileError);
    throw new Error(profileError.message || "Failed to create profile");
  }

  // Add default DANCER role
  const { error: roleError } = await supabase.from("user_roles").insert({
    user_id: profile.id,
    role: "DANCER",
  });

  if (roleError) {
    console.error("Error adding default role:", roleError);
    // Don't fail the entire operation if role creation fails
  }

  return mapProfileRow(profile);
}

/**
 * Check if a user profile exists for a given auth user ID
 */
export async function checkProfileExists(authUserId: string): Promise<boolean> {
  const supabase = createClient();
  
  const { data } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  return !!data;
}

/**
 * Get user profile by auth user ID
 */
export async function getUserProfileByAuthId(
  authUserId: string
): Promise<UserProfile | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  if (!data) {
    return null;
  }

  return mapProfileRow(data);
}

// Helper function to map database row to UserProfile
function mapProfileRow(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    displayName: row.display_name,
    email: row.email,
    bio: row.bio,
    danceGoals: row.dance_goals,
    birthDate: row.birth_date,
    profileVisible: row.profile_visible,
    primaryRole: row.primary_role,
    wsdcLevel: row.wsdc_level,
    competitivenessLevel: row.competitiveness_level,
    accountStatus: row.account_status,
    homeLocationId: row.home_location_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

