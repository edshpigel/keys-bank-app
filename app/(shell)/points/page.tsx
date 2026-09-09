"use client";

import { Alert, Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

import { AppHeader } from "@/components/app-header";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ListRow } from "@/components/list-row";
import { api, type PointListItem } from "@/lib/api";
import { useT } from "@/lib/i18n-provider";

export default function PointsPage() {
  const t = useT();
  const { data, isLoading, error } = useQuery({
    queryKey: ["operator", "points"],
    queryFn: () => api.get<PointListItem[]>("points"),
  });

  return (
    <>
      <AppHeader
        title={t("points.title")}
        subtitle={t("points.subtitle")}
        showLogout
        size="lg"
        trailing={<LanguageSwitcher compact />}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-brand-gold" />
        </div>
      ) : null}

      {error ? <Alert status="danger">{t("points.loadError")}</Alert> : null}

      {!isLoading && !error ? (
        <ul className="flex flex-col gap-2.5">
          {(data ?? []).map((point) => (
            <li key={point.id}>
              <ListRow
                href={`/point/${point.id}/`}
                title={point.name_short || point.slug}
                subtitle={point.city}
              />
            </li>
          ))}
          {(data ?? []).length === 0 ? (
            <p className="py-6 text-center text-sm text-brand-text-muted">{t("points.empty")}</p>
          ) : null}
        </ul>
      ) : null}
    </>
  );
}
