"use client";

import { useEffect } from "react";

import { AppLoadingScreen } from "@/components/app-loading-screen";
import { useAppNavigation } from "@/lib/navigation";

export default function HomePage() {
  const { navigate } = useAppNavigation();

  useEffect(() => {
    navigate("/points/", { replace: true });
  }, [navigate]);

  return <AppLoadingScreen native />;
}
