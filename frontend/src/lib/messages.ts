/**
 * Flash message system for redirect notifications.
 *
 * Use message keys instead of raw strings in redirects to:
 * - Avoid URL encoding issues
 * - Keep URLs clean and short
 * - Centralize message content for easy updates
 * - Support i18n in the future
 */

export const MESSAGE_KEYS = {
  PROFILE_REQUIRED: "profile_required",
  SCHEDULE_REQUIRED: "schedule_required",
} as const;

export type MessageKey = (typeof MESSAGE_KEYS)[keyof typeof MESSAGE_KEYS];

export type MessageType = "info" | "error" | "success" | "warning";

interface MessageConfig {
  content: string;
  type: MessageType;
}

/**
 * Message content mapped by key.
 * Add new messages here when needed.
 */
export const MESSAGES: Record<MessageKey, MessageConfig> = {
  [MESSAGE_KEYS.PROFILE_REQUIRED]: {
    content: "Please complete your profile first",
    type: "info",
  },
  [MESSAGE_KEYS.SCHEDULE_REQUIRED]: {
    content: "Please set up your schedule first to find matches",
    type: "info",
  },
};

/**
 * Build a redirect URL with a flash message.
 * Uses URLSearchParams for proper encoding.
 *
 * @example
 * redirect(buildRedirectUrl("/profile", MESSAGE_KEYS.PROFILE_REQUIRED));
 */
export function buildRedirectUrl(path: string, messageKey: MessageKey): string {
  const params = new URLSearchParams();
  params.set("message", messageKey);
  return `${path}?${params.toString()}`;
}

/**
 * Get message config by key.
 * Returns undefined if key is not found.
 */
export function getMessage(key: string): MessageConfig | undefined {
  return MESSAGES[key as MessageKey];
}
