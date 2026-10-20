"use client";
import Script from "next/script";
import { useEffect, useState } from "react";
import { hasAnalyticsConsent, CONSENT_EVENT } from "./consent";

/**
 * Microsoft Clarity — heatmaps, gravações de sessão, cliques e navegação.
 * Projeto x614k77uhr. Só carrega em produção (sessões de dev não sujam os dados)
 * E somente após o usuário ACEITAR cookies (LGPD) — escuta o evento
 * `pd-consent-change` do banner. A medição própria também respeita essa escolha.
 */
const CLARITY_ID = "x614k77uhr";

export function Clarity() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
    const check = () => {
      setOk(hasAnalyticsConsent());
    };
    check();
    window.addEventListener(CONSENT_EVENT, check);
    return () => window.removeEventListener(CONSENT_EVENT, check);
  }, []);
  if (!ok) return null;
  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window,document,"clarity","script","${CLARITY_ID}");`}
    </Script>
  );
}
