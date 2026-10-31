"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { temaSazonal, type TemaSazonal } from "@/lib/seasonal";

const CampaignContext = createContext<TemaSazonal | null>(null);

export function CampaignProvider({ initialTheme, children }: { initialTheme: TemaSazonal | null; children: React.ReactNode }) {
  const [theme, setTheme] = useState(initialTheme);
  useEffect(() => {
    const sync = () => {
      const current = temaSazonal();
      setTheme(previous => previous?.id === current?.id ? previous : current);
      document.documentElement.dataset.campaign = current?.id ?? "neutro";
      const color = getComputedStyle(document.documentElement).getPropertyValue("--page-rgb").trim();
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", `rgb(${color})`);
    };
    const onVisible = () => { if (!document.hidden) sync(); };
    sync();
    const timer = window.setInterval(onVisible, 60_000);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", sync);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", sync);
    };
  }, []);
  return <CampaignContext.Provider value={theme}>{children}</CampaignContext.Provider>;
}

export const useCampaign = () => useContext(CampaignContext);
