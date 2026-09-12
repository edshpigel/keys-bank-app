import { getBffBase } from "@/lib/config";
import { DEFAULT_LOCALE, LOCALE_COOKIE, resolveLocale } from "@/lib/i18n";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const LOCALE_KEY = LOCALE_COOKIE;

function clientLocale(): string {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const fromCookie = document.cookie
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${LOCALE_KEY}=`))
    ?.split("=")
    .slice(1)
    .join("=");
  if (fromCookie) return resolveLocale(decodeURIComponent(fromCookie));
  try {
    return resolveLocale(localStorage.getItem(LOCALE_KEY));
  } catch {
    return DEFAULT_LOCALE;
  }
}

type SearchValue = string | number | Array<string | number> | undefined;

type RequestOptions = {
  method?: string;
  body?: unknown;
  searchParams?: Record<string, SearchValue>;
  skipRefresh?: boolean;
  headers?: Record<string, string>;
};

function withTrailingSlash(path: string) {
  if (!path || path.endsWith("/")) return path;
  const q = path.indexOf("?");
  if (q === -1) return `${path}/`;
  return `${path.slice(0, q)}/${path.slice(q)}`;
}

function buildBffUrl(path: string, searchParams?: RequestOptions["searchParams"]) {
  const clean = path.replace(/^\//, "");
  const url = new URL(
    withTrailingSlash(`${getBffBase()}/${clean}`),
    typeof window !== "undefined" ? window.location.origin : "http://localhost",
  );
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value == null || value === "") continue;
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item == null || item === "") continue;
          url.searchParams.append(key, String(item));
        }
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }
  return url.pathname + url.search;
}

function parseErrorPayload(err: Record<string, unknown>, fallback: string) {
  const nested = err.error;
  if (typeof nested === "string") {
    return {
      code: nested,
      message: typeof err.message === "string" ? err.message : fallback,
    };
  }
  if (nested && typeof nested === "object") {
    const obj = nested as { code?: string; message?: string };
    return {
      code: obj.code || "request_failed",
      message: obj.message || (typeof err.message === "string" ? err.message : fallback),
    };
  }
  return {
    code: "request_failed",
    message: typeof err.message === "string" ? err.message : fallback,
  };
}

async function rawFetch(path: string, options: RequestOptions = {}) {
  const url = buildBffUrl(path, options.searchParams);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept-Language": clientLocale(),
    ...options.headers,
  };
  return fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: "same-origin",
  });
}

async function parseResponse<T>(res: Response, fallback: string): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const { code, message } = parseErrorPayload(data, fallback);
    throw new ApiError(res.status, code, message);
  }
  return data as T;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let res = await rawFetch(path, options);
  if (res.status === 401 && !options.skipRefresh && !path.includes("auth/")) {
    const refreshed = await rawFetch("auth/refresh", {
      method: "POST",
      skipRefresh: true,
    });
    if (refreshed.ok) {
      res = await rawFetch(path, options);
    }
  }
  return parseResponse<T>(res, "Request failed");
}

export const api = {
  get<T>(path: string, searchParams?: RequestOptions["searchParams"]) {
    return request<T>(`backend/${path.replace(/^\//, "")}`, { searchParams });
  },
  post<T>(path: string, body?: unknown, headers?: Record<string, string>) {
    return request<T>(`backend/${path.replace(/^\//, "")}`, {
      method: "POST",
      body,
      headers,
    });
  },
  patch<T>(path: string, body?: unknown) {
    return request<T>(`backend/${path.replace(/^\//, "")}`, {
      method: "PATCH",
      body,
    });
  },
  auth: {
    session() {
      return request<{ authenticated: boolean; role: string | null }>("auth/login", {
        method: "GET",
      });
    },
    login(body: { email: string; password: string }) {
      return request<{ ok: boolean; role: string; email: string }>("auth/login", {
        method: "POST",
        body,
      });
    },
    otpRequest(body: { email: string }) {
      return request<{ ok: boolean }>("auth/otp/request", {
        method: "POST",
        body,
      });
    },
    otpVerify(body: { email: string; code: string }) {
      return request<{ ok: boolean; role: string; email: string }>("auth/otp/verify", {
        method: "POST",
        body,
      });
    },
    telegramInit(body: { init_data: string }) {
      return request<{
        ok?: boolean;
        needs_bind?: boolean;
        telegram_user_id?: string;
        role?: string;
        email?: string;
      }>("auth/telegram/init", { method: "POST", body });
    },
    telegramBind(body: { telegram_user_id: string; email: string; code: string }) {
      return request<{ ok: boolean; role: string; email: string }>("auth/telegram/bind", {
        method: "POST",
        body,
      });
    },
    logout() {
      return request<{ ok: boolean }>("auth/logout", { method: "POST" });
    },
    refresh() {
      return request<{ ok: boolean }>("auth/refresh", {
        method: "POST",
        skipRefresh: true,
      });
    },
  },
};

export type PointListItem = {
  id: string;
  slug: string;
  name_short: string;
  city: string;
  timezone: string;
  allowed_services?: Array<"keys" | "luggage">;
};

export type DashboardSummary = {
  active: number;
  overstay: number;
  provisioning_failed: number;
  pending_empty: number;
};

export type MeProfile = {
  id: string;
  email: string;
  role: string;
  locale: string;
  telegram_user_id: string | null;
};

export type ReservationListItem = {
  id: string;
  public_id: string;
  service_type: string;
  status: string;
  lifecycle: string;
  access_status: string;
  email: string;
  phone_e164: string | null;
  first_name: string | null;
  last_name: string | null;
  user_id?: string | null;
  starts_at: string;
  ends_at: string;
  created_at: string | null;
  safe_label: string | null;
  locker_qty: number | null;
  ttlock_passcode: string | null;
  auto_renew_enabled: boolean;
  takeout_at: string | null;
  amount_ttc_cents: number;
  assigned_unit_labels: string[] | null;
};

export type ReservationsListResponse = {
  items: ReservationListItem[];
  next_cursor: string | null;
  has_more: boolean;
  summary: {
    total: number;
    active: number;
    revenue_ttc_cents: number;
  } | null;
};

export type ReservationActivityItem = {
  id: string;
  type: string;
  at: string | null;
  title_key: string;
  subtitle: string | null;
  amount_cents: number | null;
  unit_label: string | null;
  channel: string | null;
  expandable: boolean;
  body_preview: string | null;
  meta: Record<string, unknown>;
  source: string;
  actor_email?: string | null;
};

export type ReservationActivityResponse = {
  items: ReservationActivityItem[];
};

export type ReservationDetail = ReservationListItem & {
  locale: string;
  assigned_unit_ids: string[] | null;
  rebook_at: string | null;
  payments: Array<{
    id: string;
    kind: string;
    status: string;
    amount_ttc_cents: number;
  }>;
  actions: {
    can_refresh_ttlock: boolean;
    can_rebook: boolean;
    can_cancel_auto_renew: boolean;
    can_retry_provisioning: boolean;
  };
};

export type RefundOptions = {
  reservation_id: string;
  payments: Array<{
    payment_id: string;
    kind: string;
    status: string;
    amount_ttc_cents: number;
    currency: string;
    can_refund: boolean;
  }>;
};

export type NotificationLogItem = {
  id: string;
  service: string;
  operation: string;
  status_code: number;
  created_at: string | null;
};

export type SafeGridItem = {
  unit_id: string;
  label: string;
  is_pmr: boolean;
  operational_status: string;
  busy: boolean;
  api_lock_state: string | null;
};

export type UnitReservationItem = {
  id: string;
  public_id: string;
  status: string;
  lifecycle: string;
  service_type: string;
};

export type LuggageGridItem = {
  unit_id: string;
  label: string;
  busy: boolean;
  api_lock_state: string | null;
  api_stateno: string | null;
  fixno: string | null;
  lockno: string | null;
};

export type LuggageGridCell = {
  row: number;
  col: number;
  grid_col: number;
  kind: "lock" | "screen" | string;
  title?: string;
  label?: string;
  mapped?: boolean;
  item?: {
    id?: string;
    label?: string;
    api_stateno?: string;
    stateno?: string;
  } | null;
};

export type LuggageGridResponse = {
  items: LuggageGridItem[];
  grid: {
    layout_id: string;
    layout_title?: string;
    cells: LuggageGridCell[];
    extra_items?: LuggageGridItem[];
  };
};

export type LockActionItem = {
  id: string;
  unit_id: string | null;
  reservation_id: string | null;
  reservation_public_id?: string | null;
  action: string;
  created_at: string | null;
};

export type PaymentListItem = {
  id: string;
  reservation_id: string;
  kind: string;
  status: string;
  amount_ttc_cents: number;
  currency: string;
  tariff_code: string | null;
};

export type PaymentReceipt = {
  payment_id: string;
  number: string;
  url: string;
  expires_in: number;
};
