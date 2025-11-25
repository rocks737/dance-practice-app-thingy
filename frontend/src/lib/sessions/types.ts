export const SESSION_STATUS_VALUES = [
  "PROPOSED",
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
] as const;

export const SESSION_TYPE_VALUES = [
  "PARTNER_PRACTICE",
  "GROUP_PRACTICE",
  "PRIVATE_WITH_INSTRUCTOR",
  "CLASS",
] as const;

export const SESSION_VISIBILITY_VALUES = [
  "AUTHOR_ONLY",
  "PARTICIPANTS_ONLY",
  "PUBLIC",
] as const;

export type SessionStatus = (typeof SESSION_STATUS_VALUES)[number];
export type SessionType = (typeof SESSION_TYPE_VALUES)[number];
export type SessionVisibility = (typeof SESSION_VISIBILITY_VALUES)[number];

export interface SessionFilters {
  searchText?: string;
  statuses?: SessionStatus[];
  sessionTypes?: SessionType[];
  visibilities?: SessionVisibility[];
  fromDate?: string;
  toDate?: string;
}

export const defaultSessionFilters: SessionFilters = {
  searchText: "",
  statuses: [],
  sessionTypes: [],
  visibilities: [],
  fromDate: undefined,
  toDate: undefined,
};

export interface SessionListItem {
  id: string;
  title: string;
  sessionType: SessionType;
  status: SessionStatus;
  visibility: SessionVisibility;
  scheduledStart: string;
  scheduledEnd: string;
  updatedAt: string;
  version?: number | null;
  capacity: number | null;
  location?: {
    id: string;
    name: string | null;
    city: string | null;
    state: string | null;
  } | null;
  organizer?: {
    id: string;
    displayName: string | null;
    firstName: string;
    lastName: string;
  } | null;
  participantCount: number;
}

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  PROPOSED: "Proposed",
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  PARTNER_PRACTICE: "Partner practice",
  GROUP_PRACTICE: "Group practice",
  PRIVATE_WITH_INSTRUCTOR: "Private w/ instructor",
  CLASS: "Class / workshop",
};

export const SESSION_VISIBILITY_LABELS: Record<SessionVisibility, string> = {
  AUTHOR_ONLY: "Only me",
  PARTICIPANTS_ONLY: "Participants",
  PUBLIC: "Public",
};

export const SESSION_STATUS_OPTIONS = Object.entries(SESSION_STATUS_LABELS).map(
  ([value, label]) => ({ value: value as SessionStatus, label }),
);

export const SESSION_TYPE_OPTIONS = Object.entries(SESSION_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as SessionType, label }),
);

export const SESSION_VISIBILITY_OPTIONS = Object.entries(SESSION_VISIBILITY_LABELS).map(
  ([value, label]) => ({
    value: value as SessionVisibility,
    label,
  }),
);
