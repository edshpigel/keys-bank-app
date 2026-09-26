"use client";

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

import { cn } from "@/lib/cn";

type NavigateOptions = { replace?: boolean };
export type TransitionDirection = "forward" | "back" | "fade";

type NavigationContextValue = {
  pending: boolean;
  direction: TransitionDirection;
  navigate: (href: string, options?: NavigateOptions) => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

const MIN_OVERLAY_MS = 120;
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

function normalizePath(pathname: string) {
  if (!pathname) return "/";
  if (pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

/** Hierarchical depth for slide direction. Deeper = push from right. */
export function routeDepth(pathname: string): number {
  const parts = normalizePath(pathname).split("/").filter(Boolean);
  if (parts.length === 0) return 0;
  if (parts.length === 1) return 1;
  if (parts[0] === "point" && parts.length === 2) return 2;
  if (parts[0] === "point" && parts.length >= 3) return 3;
  if (parts[0] === "reservation" || parts[0] === "unit") return 4;
  if (parts[0] === "clients" && parts.length >= 2) return 2;
  return parts.length;
}

function directionBetween(fromPath: string, toPath: string): TransitionDirection {
  const from = normalizePath(fromPath.split("?")[0] || "/");
  const to = normalizePath(toPath.split("?")[0] || "/");
  if (from === to) return "fade";
  const fromDepth = routeDepth(from);
  const toDepth = routeDepth(to);
  if (toDepth > fromDepth) return "forward";
  if (toDepth < fromDepth) return "back";
  if (fromDepth <= 1 && toDepth <= 1) return "fade";
  return "forward";
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const [direction, setDirection] = useState<TransitionDirection>("fade");
  const shownAt = useRef(0);
  const hideTimer = useRef(0);
  const failsafeTimer = useRef(0);
  const pendingDirection = useRef<TransitionDirection>("fade");

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
      if (normalizePath(url.pathname) === normalizePath(window.location.pathname) && url.search === window.location.search) {
        return;
      }

      const dir = directionBetween(window.location.pathname, url.pathname);
      pendingDirection.current = dir;
      setDirection(dir);

      window.clearTimeout(hideTimer.current);
      window.clearTimeout(failsafeTimer.current);

      // Back / fade: no loading overlay — avoids a second “motion” flash.
      if (dir === "forward") {
        shownAt.current = Date.now();
        setPending(true);
        failsafeTimer.current = window.setTimeout(() => setPending(false), MAX_OVERLAY_MS);
      } else {
        setPending(false);
      }

      if (options?.replace) router.replace(href);
      else router.push(href);
    },
    [router],
  );

  useEffect(() => {
    setDirection(pendingDirection.current);
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
    <NavigationContext.Provider value={{ pending, direction, navigate }}>
      {children}
      {pending ? <RouteLoadingOverlay /> : null}
    </NavigationContext.Provider>
  );
}

function RouteLoadingOverlay() {
  return (
    <div className="kb-route-loading kb-route-loading--light" aria-live="polite" aria-busy="true">
      <div className="kb-boot-splash__spinner" />
    </div>
  );
}

export function useAppNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useAppNavigation must be used within NavigationProvider");
  return ctx;
}

/**
 * Apply slide only after pathname actually changes, and only for forward drills.
 * Setting direction on the previous page used to re-trigger CSS animation → double slide.
 * Back never gets a slide class.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { direction } = useAppNavigation();
  const pathKey = normalizePath(pathname);
  const directionRef = useRef(direction);
  directionRef.current = direction;

  const [episode, setEpisode] = useState({ path: pathKey, cls: "" });

  // Sync during render when the path changes so back never mounts with a stale forward class.
  if (episode.path !== pathKey) {
    const cls =
      directionRef.current === "forward"
        ? "kb-page-transition kb-page-transition--forward"
        : "";
    setEpisode({ path: pathKey, cls });
  }

  return (
    <div key={episode.path} className={cn("flex flex-col gap-3", episode.cls || undefined)}>
      {children}
    </div>
  );
}
