"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

const ShellStickyTargetContext = createContext<HTMLElement | null>(null);

export function ShellStickyTargetProvider({
  children,
}: {
  children: (targetRef: (el: HTMLElement | null) => void) => ReactNode;
}) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  return (
    <ShellStickyTargetContext.Provider value={target}>
      {children(setTarget)}
    </ShellStickyTargetContext.Provider>
  );
}

/** Renders children into the sticky slot above the bottom nav. */
export function ShellStickyBar({ children }: { children: ReactNode }) {
  const target = useContext(ShellStickyTargetContext);
  if (!target) return null;
  return createPortal(children, target);
}
