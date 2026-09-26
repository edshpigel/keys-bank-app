"use client";

import { Spinner } from "@heroui/react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";

/**
 * Legacy deep-link `/unit/:id/?point=` — safes now open as a sheet on the grid page.
 */
function UnitRedirectInner() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const pointId = searchParams.get("point") || "";

  useEffect(() => {
    if (pointId) {
      router.replace(`/point/${pointId}/safes/`);
      return;
    }
    router.replace("/points/");
  }, [pointId, router, params.id]);

  return (
    <div className="flex min-h-[50dvh] items-center justify-center">
      <Spinner className="text-brand-gold" />
    </div>
  );
}

export default function UnitDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50dvh] items-center justify-center">
          <Spinner className="text-brand-gold" />
        </div>
      }
    >
      <UnitRedirectInner />
    </Suspense>
  );
}
