import type { ReservationListItem } from "@/lib/api";

function toBase64Url(text: string): string {
  if (typeof window === "undefined") {
    return Buffer.from(text, "utf8").toString("base64url");
  }
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function clientRefFrom(item: {
  user_id?: string | null;
  email: string;
}): string {
  if (item.user_id) return item.user_id;
  return `e_${toBase64Url(item.email.trim().toLowerCase())}`;
}

export function clientHref(item: { user_id?: string | null; email: string }) {
  return `/clients/${encodeURIComponent(clientRefFrom(item))}/`;
}

export type ClientListItem = {
  id: string | null;
  ref: string;
  email: string;
  phone_e164: string | null;
  first_name: string | null;
  last_name: string | null;
  reservations_count: number;
  last_starts_at: string | null;
};

export type ClientDetailResponse = {
  client: ClientListItem;
  reservations: Array<
    Pick<
      ReservationListItem,
      | "id"
      | "public_id"
      | "status"
      | "lifecycle"
      | "service_type"
      | "starts_at"
      | "ends_at"
      | "email"
      | "first_name"
      | "last_name"
      | "user_id"
    > & { point_id: string }
  >;
};
