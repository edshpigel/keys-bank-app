"use client";

import { Alert, Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

import { AppHeader } from "@/components/app-header";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SectionLabel, SoftCard } from "@/components/ui/soft-card";
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
      <AppHeader
        title={t("profile.title")}
        showLogout
        size="lg"
        trailing={<LanguageSwitcher compact />}
      />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner className="text-brand-gold" />
        </div>
      ) : null}
      {error ? <Alert status="danger">{t("profile.loadError")}</Alert> : null}
      {data ? (
        <SoftCard className="space-y-4">
          <div>
            <SectionLabel>{t("profile.email")}</SectionLabel>
            <div className="mt-1 font-medium text-brand-text">{data.email}</div>
          </div>
          <div>
            <SectionLabel>{t("profile.role")}</SectionLabel>
            <div className="mt-1 capitalize text-brand-text">{data.role}</div>
          </div>
          <div>
            <SectionLabel>{t("profile.locale")}</SectionLabel>
            <div className="mt-1 uppercase text-brand-text">{locale}</div>
          </div>
          <div>
            <SectionLabel>{t("profile.telegram")}</SectionLabel>
            <div className="mt-1 text-brand-text">
              {data.telegram_user_id
                ? t("profile.telegramLinked")
                : isTelegramWebApp()
                  ? t("profile.telegramUnlinked")
                  : t("profile.telegramNa")}
            </div>
          </div>
        </SoftCard>
      ) : null}
    </>
  );
}
