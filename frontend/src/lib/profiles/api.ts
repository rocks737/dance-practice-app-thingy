"use client";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import type { UserProfile, ProfileUpdateData, CreateProfileParams } from "./types";

type UserProfileRow = Database["public"]["Tables"]["user_profiles"]["Row"];
type UserProfileUpdate = Database["public"]["Tables"]["user_profiles"]["Update"];

/**
 * Fetches a user profile by auth user ID
 */
export async function getProfileByAuthUserId(
  authUserId: string
): Promise<UserProfile | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("auth_user_id", authUserId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows found
      return null;
    }
    console.error("Error fetching profile:", error);
    throw new Error(error.message);
  }

  return mapProfileRow(data);
}

/**
 * Fetches a user profile by profile ID
 */
export async function getProfileById(
  profileId: string
): Promise<UserProfile | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", profileId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Error fetching profile:", error);
    throw new Error(error.message);
  }

  return mapProfileRow(data);
}

/**
 * Updates a user profile
 * Returns the updated profile
 */
export async function updateProfile(
  profileId: string,
  updates: ProfileUpdateData
): Promise<UserProfile> {
  const supabase = createClient();

  const updatePayload: UserProfileUpdate = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("user_profiles")
    .update(updatePayload)
    .eq("id", profileId)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    throw new Error(error.message);
  }

  return mapProfileRow(data);
}

/**
 * Creates a user profile with default values
 * Called on first login after Supabase auth signup
 */
export async function createDefaultUserProfile(
  params: CreateProfileParams
): Promise<UserProfile> {
  const supabase = createClient();

  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("auth_user_id", params.authUserId)
    .single();

  if (existingProfile) {
    console.log("Profile already exists for user:", params.authUserId);
    // Fetch and return the existing profile
    const { data } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("auth_user_id", params.authUserId)
      .single();

    if (!data) {
      throw new Error("Failed to fetch existing profile");
    }

    return mapProfileRow(data);
  }

  // Create new profile with defaults
  // @ts-expect-error - Database will generate id, created_at, updated_at, version
  const insertData: Database["public"]["Tables"]["user_profiles"]["Insert"] = {
    auth_user_id: params.authUserId,
    email: params.email,
    first_name: params.firstName || "",
    last_name: params.lastName || "",
    display_name: params.displayName || null,
    primary_role: 0, // LEADER
    wsdc_level: 1, // NOVICE (NEWCOMER is 0)
    competitiveness_level: 3,
    profile_visible: true,
    account_status: 0, // ACTIVE
    bio: null,
    dance_goals: null,
    birth_date: null,
  };

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .insert(insertData)
    .select()
    .single();

  if (profileError) {
    console.error("Error creating user profile:", profileError);
    throw new Error("Failed to create user profile");
  }

  // Add default DANCER role
  const { error: roleError } = await supabase.from("user_roles").insert({
    user_id: profile.id,
    role: "DANCER",
  });

  if (roleError) {
    console.error("Error adding default role:", roleError);
    // Don't throw - profile was created successfully
  }

  console.log("Created new profile for user:", params.authUserId);
  return mapProfileRow(profile);
}

/**
 * Ensures a user profile exists, creating one if needed
 * Returns the profile or null if the user doesn't exist
 */
export async function ensureUserProfile(
  authUserId: string,
  email: string
): Promise<UserProfile | null> {
  const supabase = createClient();

  // Try to get existing profile
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("auth_user_id", authUserId)
    .single();

  if (profile) {
    return mapProfileRow(profile);
  }

  // Profile doesn't exist, create it
  return await createDefaultUserProfile({
    authUserId,
    email,
  });
}

/**
 * Update user password via Supabase Auth
 */
export async function updatePassword(newPassword: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error("Error updating password:", error);
    throw new Error(error.message);
  }
}

/**
 * Maps a database row to a UserProfile
 */
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

