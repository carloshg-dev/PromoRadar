"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, hasAnalyticsConsent } from "./consent";

export function GoogleAnalytics() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
    const check = () => {
      const accepted = hasAnalyticsConsent();
      (window as Window & { "ga-disable-G-Z49LMP5ZKT"?: boolean })["ga-disable-G-Z49LMP5ZKT"] = !accepted;
      setEnabled(accepted);
    };
    check();
    window.addEventListener(CONSENT_EVENT, check);
    return () => window.removeEventListener(CONSENT_EVENT, check);
  }, []);
  if (!enabled) return null;
  return <>
    <Script id="google-analytics-consented" strategy="afterInteractive">{`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-Z49LMP5ZKT');
    `}</Script>
    <Script src="https://www.googletagmanager.com/gtag/js?id=G-Z49LMP5ZKT" strategy="afterInteractive" />
  </>;
}
