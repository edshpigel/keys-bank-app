export const ACCESS_COOKIE = "kb_app_access";
export const REFRESH_COOKIE = "kb_app_refresh";
export const ROLE_COOKIE = "kb_app_role";

/** Session flag: skip Telegram auto-login after explicit logout. */
export const SIGNED_OUT_STORAGE = "kb_app_signed_out";

export const ACCESS_MAX_AGE = 15 * 60;
export const REFRESH_MAX_AGE = 30 * 24 * 60 * 60;

export const STAFF_ROLES = new Set(["admin", "operator", "partner"]);

export { getUpstreamApiBase, getUpstreamUrl } from "@/lib/config";
