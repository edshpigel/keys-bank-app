import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import Script from "next/script";

import { BootSplash } from "@/components/boot-splash";
import { AppProviders } from "@/components/providers";
import { getAppUrl } from "@/lib/config";

import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const bootSplashCss = `
html,body{margin:0;color-scheme:light only!important;background:#1a1a1a!important;color:#141414!important}
html.app-ready,html.app-ready body{background:#d1b07a!important;color:#141414!important}
#kb-boot-splash{position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;background:#1a1a1a;color:#fff}
html.app-ready #kb-boot-splash{display:none!important}
.kb-boot-splash__brand{font:600 1.75rem/1.2 system-ui,-apple-system,sans-serif;letter-spacing:.08em;color:#b69955}
.kb-boot-splash__logo{width:180px;height:auto;filter:none!important}
.kb-boot-splash__spinner{width:2rem;height:2rem;border:2px solid rgb(182 153 85 / .25);border-top-color:#b69955;border-radius:50%;animation:kb-boot-spin .7s linear infinite}
.kb-boot-splash__msg{margin:0;min-height:1.2rem;font:400 .85rem/1.4 system-ui,sans-serif;color:rgba(255,255,255,.7)}
@keyframes kb-boot-spin{to{transform:rotate(360deg)}}
input,textarea,select{background:#fff;color:#141414;caret-color:#b69955}
::selection{background:#b69955;color:#fff}
`;

export const metadata: Metadata = {
  title: {
    default: "KeysBank App",
    template: "%s · KeysBank",
  },
  description: "Operator cabinet for KeysBank points",
  manifest: "/site.webmanifest",
  applicationName: "KeysBank",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KeysBank",
  },
  icons: {
    icon: [
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  metadataBase: new URL(getAppUrl()),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1a1a1a",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="light" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: bootSplashCss }} />
      </head>
      <body className={`${inter.variable} ${cormorant.variable} antialiased`}>
        <BootSplash />
        <Script id="kb-boot-slow" strategy="afterInteractive">
          {`setTimeout(function(){if(document.documentElement.classList.contains("app-ready"))return;var el=document.getElementById("kb-boot-msg");if(!el)return;var lang=(navigator.language||"fr").slice(0,2);el.textContent=lang==="ru"?"Медленное соединение…":lang==="en"?"Slow connection…":"Connexion lente…";},8000);`}
        </Script>
        <Script id="kb-sw-register" strategy="beforeInteractive">
          {`if("serviceWorker"in navigator){navigator.serviceWorker.register("/sw.js",{updateViaCache:"none"}).catch(function(){})}`}
        </Script>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
