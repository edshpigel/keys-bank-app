"use client";

import { Alert, Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

import { AppHeader } from "@/components/app-header";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PageCard } from "@/components/page-card";
import { api, type MeProfile } from "@/lib/api";
import { useI18n, useT } from "@/lib/i18n-provider";
import { isTelegramWebApp } from "@/lib/telegram";

export default function ProfilePage() {
  const t = useT();
  const { locale } = useI18n();
  const { data, isLoading, error } = useQuery({
    queryKey: ["operator", "me"],
    queryFn: () => api.get<MeProfile>("me"),
  });

  return (
    <>
      <AppHeader title={t("profile.title")} showLogout />
      <PageCard className="flex-1">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher compact />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner className="text-brand-gold" />
          </div>
        ) : null}
        {error ? <Alert status="danger">{t("profile.loadError")}</Alert> : null}
        {data ? (
          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
                {t("profile.email")}
              </dt>
              <dd className="mt-1 font-medium">{data.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
                {t("profile.role")}
              </dt>
              <dd className="mt-1 capitalize">{data.role}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
                {t("profile.locale")}
              </dt>
              <dd className="mt-1 uppercase">{locale}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
                {t("profile.telegram")}
              </dt>
              <dd className="mt-1">
                {data.telegram_user_id
                  ? t("profile.telegramLinked")
                  : isTelegramWebApp()
                    ? t("profile.telegramUnlinked")
                    : t("profile.telegramNa")}
              </dd>
            </div>
          </dl>
        ) : null}
      </PageCard>
    </>
  );
}
