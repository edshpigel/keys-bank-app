import { api } from "@/lib/api";

export type StatisticsService = "all" | "keys" | "luggage";

export type PointStatistics = {
  summary: {
    bookings: number;
    revenue_cents: number;
    average_check_cents: number;
    renewals: number;
    refunds: number;
    active_now: number;
    currency: string;
  };
  series: {
    labels: string[];
    bookings: number[];
    revenue_cents: number[];
  };
  by_service: { keys: number; luggage: number };
  by_status: { active: number; upcoming: number; expired: number; refund: number };
  by_period: { period: string; count: number }[];
  date_from: string;
  date_to: string;
};

export type StatisticsFilters = {
  dateFrom: string;
  dateTo: string;
  service: StatisticsService;
};

export function formatDateInput(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function presetRange(days: number): Pick<StatisticsFilters, "dateFrom" | "dateTo"> {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  return { dateFrom: formatDateInput(from), dateTo: formatDateInput(to) };
}

export function fetchPointStatistics(pointId: string, filters: StatisticsFilters) {
  return api.get<PointStatistics>(`points/${pointId}/statistics`, {
    date_from: filters.dateFrom,
    date_to: filters.dateTo,
    service: filters.service,
  });
}
