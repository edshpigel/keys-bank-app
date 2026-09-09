"use client";

import { Alert, Spinner } from "@heroui/react";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { AppHeader } from "@/components/app-header";
import { ListRow } from "@/components/list-row";
import { api } from "@/lib/api";
import type { ClientListItem } from "@/lib/clients";
import { clientDisplayName, formatDateShort } from "@/lib/format";
import { useI18n, useT } from "@/lib/i18n-provider";

export default function ClientsPage() {
  const t = useT();
  const { locale } = useI18n();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["operator", "clients", debounced],
    queryFn: () =>
      api.get<{ items: ClientListItem[] }>("clients", {
        q: debounced || undefined,
        limit: 50,
      }),
  });

  const items = data?.items ?? [];

  return (
    <>
      <AppHeader title={t("clients.title")} subtitle={t("clients.subtitle")} size="lg" />

      <label className="flex h-10 w-full items-center gap-2 rounded-[10px] border border-brand-border bg-white px-3">
        <Search className="h-4 w-4 shrink-0 text-brand-text-muted" strokeWidth={2} />
        <span className="sr-only">{t("common.search")}</span>
        <input
          type="search"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-brand-text outline-none placeholder:text-brand-text-muted"
          placeholder={t("clients.searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-brand-gold" />
        </div>
      ) : null}

      {error ? <Alert status="danger">{t("clients.loadError")}</Alert> : null}

      {!isLoading && !error ? (
        <ul className="flex flex-col gap-2.5 pb-2">
          {items.map((item) => {
            const name = clientDisplayName(item.first_name, item.last_name, item.email);
            const subtitle = [
              item.email,
              t("clients.bookingsCount", { count: item.reservations_count }),
              item.last_starts_at
                ? formatDateShort(item.last_starts_at, locale)
                : null,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <li key={item.ref}>
                <ListRow
                  href={`/clients/${encodeURIComponent(item.ref)}/`}
                  title={name}
                  subtitle={subtitle}
                />
              </li>
            );
          })}
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-brand-text-muted">
              {t("clients.empty")}
            </p>
          ) : null}
        </ul>
      ) : null}
    </>
  );
}
