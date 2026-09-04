"use client";

import { useEffect } from "react";

import { reportClientError } from "@/lib/client-log";

export function ClientErrorReporter() {
  useEffect(() => {
    function onError(event: ErrorEvent) {
      const target = event.target;
      if (target && target !== window && target instanceof HTMLElement) {
        const tag = target.tagName?.toLowerCase();
        if (tag === "script" || tag === "link" || tag === "img") {
          reportClientError({
            kind: "error",
            message: `Resource failed: ${tag} ${(target as HTMLScriptElement).src || (target as HTMLLinkElement).href || ""}`,
          });
          return;
        }
      }

      reportClientError({
        kind: "error",
        message: event.message || "Unknown error",
        stack: event.error instanceof Error ? event.error.stack : undefined,
      });
    }

    function onUnhandledRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      reportClientError({
        kind: "unhandledrejection",
        message:
          reason instanceof Error
            ? reason.message
            : typeof reason === "string"
              ? reason
              : "Unhandled promise rejection",
        stack: reason instanceof Error ? reason.stack : undefined,
      });
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
