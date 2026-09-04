"use client";

/* eslint-disable @next/next/no-img-element */

/** SSR boot screen — hidden via CSS once `html.app-ready` is set. */
export function BootSplash() {
  return (
    <div id="kb-boot-splash" aria-hidden="true">
      <img
        className="kb-boot-splash__logo"
        src="/logo.png"
        alt=""
        width={180}
        height={68}
      />
      <div className="kb-boot-splash__brand">KeysBank</div>
      <div className="kb-boot-splash__spinner" />
      <p id="kb-boot-msg" className="kb-boot-splash__msg" />
    </div>
  );
}
