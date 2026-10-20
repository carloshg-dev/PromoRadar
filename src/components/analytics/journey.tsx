"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { publicPage } from "@/core/analytics/events";
import { CONSENT_EVENT, hasAnalyticsConsent } from "./consent";
import { track } from "./track";

export function Journey() {
  const pathname = usePathname();
  const previous = useRef("");
  useEffect(() => {
    const send = () => {
      const page = publicPage(pathname);
      if (!page || !hasAnalyticsConsent() || previous.current === pathname) return;
      previous.current = pathname;
      track("visita", { origem: page });
    };
    send();
    window.addEventListener(CONSENT_EVENT, send);
    return () => window.removeEventListener(CONSENT_EVENT, send);
  }, [pathname]);
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!event.isTrusted) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.origin !== location.origin) return;
      const params = new URL(link.href).searchParams;
      const outbound = /^\/r\/([0-9a-f-]{36})$/i.exec(link.pathname);
      if (outbound) track("saida_loja", { produtoId: outbound[1], origem: params.get("o") || "link" });
      else if (link.pathname === "/ofertas" && (params.has("loja") || params.has("categoria"))) {
        track("filtrar_ofertas", { origem: params.has("loja") ? "loja" : "categoria" });
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
