/**
 * Profile-related types and enums
 */

export enum PrimaryRole {
  LEADER = 0,
  FOLLOWER = 1,
}

export enum WsdcSkillLevel {
  NEWCOMER = 0,
  NOVICE = 1,
  INTERMEDIATE = 2,
  ADVANCED = 3,
  ALLSTAR = 4,
  CHAMPION = 5,
}

export enum AccountStatus {
  ACTIVE = 0,
  SUSPENDED = 1,
  DELETED = 2,
}

export const PRIMARY_ROLE_LABELS: Record<PrimaryRole, string> = {
  [PrimaryRole.LEADER]: "Leader",
  [PrimaryRole.FOLLOWER]: "Follower",
};

export const WSDC_SKILL_LEVEL_LABELS: Record<WsdcSkillLevel, string> = {
  [WsdcSkillLevel.NEWCOMER]: "Newcomer",
  [WsdcSkillLevel.NOVICE]: "Novice",
  [WsdcSkillLevel.INTERMEDIATE]: "Intermediate",
  [WsdcSkillLevel.ADVANCED]: "Advanced",
  [WsdcSkillLevel.ALLSTAR]: "All-Star",
  [WsdcSkillLevel.CHAMPION]: "Champion",
};

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  [AccountStatus.ACTIVE]: "Active",
  [AccountStatus.SUSPENDED]: "Suspended",
  [AccountStatus.DELETED]: "Deleted",
};

export const PRIMARY_ROLE_OPTIONS = [
  { value: PrimaryRole.LEADER, label: PRIMARY_ROLE_LABELS[PrimaryRole.LEADER] },
  { value: PrimaryRole.FOLLOWER, label: PRIMARY_ROLE_LABELS[PrimaryRole.FOLLOWER] },
];

export const WSDC_SKILL_LEVEL_OPTIONS = [
  {
    value: WsdcSkillLevel.NEWCOMER,
    label: WSDC_SKILL_LEVEL_LABELS[WsdcSkillLevel.NEWCOMER],
  },
  { value: WsdcSkillLevel.NOVICE, label: WSDC_SKILL_LEVEL_LABELS[WsdcSkillLevel.NOVICE] },
  {
    value: WsdcSkillLevel.INTERMEDIATE,
    label: WSDC_SKILL_LEVEL_LABELS[WsdcSkillLevel.INTERMEDIATE],
  },
  {
    value: WsdcSkillLevel.ADVANCED,
    label: WSDC_SKILL_LEVEL_LABELS[WsdcSkillLevel.ADVANCED],
  },
  {
    value: WsdcSkillLevel.ALLSTAR,
    label: WSDC_SKILL_LEVEL_LABELS[WsdcSkillLevel.ALLSTAR],
  },
  {
    value: WsdcSkillLevel.CHAMPION,
    label: WSDC_SKILL_LEVEL_LABELS[WsdcSkillLevel.CHAMPION],
  },
];

/**
 * User profile data returned from API
 * Uses camelCase for consistency with frontend conventions
 */
export interface UserProfile {
  id: string;
  authUserId: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  email: string;
  bio: string | null;
  danceGoals: string | null;
  birthDate: string | null;
  profileVisible: boolean;
  primaryRole: number;
  wsdcLevel: number | null;
  competitivenessLevel: number;
  accountStatus: number;
  homeLocationId: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Parameters for creating a new profile
 */
export interface CreateProfileParams {
  authUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
}

/**
 * Data for updating a profile
 * All fields are optional
 */
export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  display_name?: string | null;
  bio?: string | null;
  dance_goals?: string | null;
  birth_date?: string | null;
  profile_visible?: boolean;
  primary_role?: number;
  wsdc_level?: number | null;
  competitiveness_level?: number;
  home_location_id?: string | null;
}

/**
 * Password change request
 */
export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
