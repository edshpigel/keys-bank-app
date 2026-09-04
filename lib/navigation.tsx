"use client";

/* eslint-disable @next/next/no-img-element */

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type NavigateOptions = { replace?: boolean };

type NavigationContextValue = {
  pending: boolean;
  navigate: (href: string, options?: NavigateOptions) => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

const MIN_OVERLAY_MS = 180;
const MAX_OVERLAY_MS = 8000;

function isModifiedClick(event: MouseEvent) {
  return (
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  );
}

function internalNextPath(anchor: HTMLAnchorElement): string | null {
  if (anchor.target && anchor.target !== "_self") return null;
  if (anchor.hasAttribute("download")) return null;
  const raw = anchor.getAttribute("href");
  if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(raw, window.location.href);
  } catch {
    return null;
  }
  if (url.origin !== window.location.origin) return null;
  if (url.pathname.startsWith("/api/")) return null;
  return `${url.pathname}${url.search}`;
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const shownAt = useRef(0);
  const hideTimer = useRef(0);
  const failsafeTimer = useRef(0);

  const finish = useCallback(() => {
    window.clearTimeout(hideTimer.current);
    const wait = Math.max(0, MIN_OVERLAY_MS - (Date.now() - shownAt.current));
    hideTimer.current = window.setTimeout(() => setPending(false), wait);
  }, []);

  const navigate = useCallback(
    (href: string, options?: NavigateOptions) => {
      const url = new URL(href, window.location.href);
      const next = `${url.pathname}${url.search}`;
      const current = `${window.location.pathname}${window.location.search}`;
      if (next === current) return;

      window.clearTimeout(hideTimer.current);
      window.clearTimeout(failsafeTimer.current);
      shownAt.current = Date.now();
      setPending(true);
      failsafeTimer.current = window.setTimeout(() => setPending(false), MAX_OVERLAY_MS);

      if (options?.replace) router.replace(href);
      else router.push(href);
    },
    [router],
  );

  useEffect(() => {
    finish();
    window.clearTimeout(failsafeTimer.current);
  }, [pathname, finish]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || isModifiedClick(event)) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const next = internalNextPath(anchor);
      if (!next) return;
      const current = `${window.location.pathname}${window.location.search}`;
      if (next === current) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      navigate(next);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [navigate]);

  useEffect(
    () => () => {
      window.clearTimeout(hideTimer.current);
      window.clearTimeout(failsafeTimer.current);
    },
    [],
  );

  return (
    <NavigationContext.Provider value={{ pending, navigate }}>
      {children}
      {pending ? <RouteLoadingOverlay /> : null}
    </NavigationContext.Provider>
  );
}

function RouteLoadingOverlay() {
  return (
    <div className="kb-route-loading" aria-live="polite" aria-busy="true">
      <img src="/logo.png" alt="" width={180} height={68} className="kb-route-loading__logo" />
      <div className="kb-boot-splash__spinner" />
    </div>
  );
}

export function useAppNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useAppNavigation must be used within NavigationProvider");
  return ctx;
}
