"use client";

import { Suspense } from "react";
import { Spinner } from "@heroui/react";

import ReservationDetailInner from "./detail-inner";

export default function ReservationDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50dvh] items-center justify-center">
          <Spinner className="text-brand-gold" />
        </div>
      }
    >
      <ReservationDetailInner />
    </Suspense>
  );
}
