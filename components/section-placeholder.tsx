"use client";

import { Alert } from "@heroui/react";
import { useParams } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { PageCard } from "@/components/page-card";
import { useT } from "@/lib/i18n-provider";

export default function SectionPlaceholder({ titleKey }: { titleKey: string }) {
  const t = useT();
  const params = useParams<{ id: string }>();
  const title = t(titleKey);

  return (
    <>
      <AppHeader title={title} backHref={`/point/${params.id}/`} />
      <PageCard className="flex-1">
        <Alert status="accent">{t("pointHub.sectionSoon", { title })}</Alert>
      </PageCard>
    </>
  );
}
