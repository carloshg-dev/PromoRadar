"use client";

import { useEffect, useState } from "react";
import { parseRadar, toggleRadar, type RadarItem } from "@/core/radar";

const KEY = "pd-radar-v1";
const EVENT = "pd-radar-change";

export function useRadar() {
  const [items, setItems] = useState<RadarItem[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const read = () => { try { setItems(parseRadar(localStorage.getItem(KEY))); } catch { setItems([]); } setReady(true); };
    read();
    window.addEventListener(EVENT, read);
    window.addEventListener("storage", read);
    return () => { window.removeEventListener(EVENT, read); window.removeEventListener("storage", read); };
  }, []);
  const toggle = (item: RadarItem) => {
    try {
      const result = toggleRadar(parseRadar(localStorage.getItem(KEY)), item);
      if (result.action === "full") return "full" as const;
      localStorage.setItem(KEY, JSON.stringify(result.items));
      setItems(result.items);
      window.dispatchEvent(new Event(EVENT));
      return result.action;
    } catch { return "unavailable" as const; }
  };
  return { items, ready, toggle };
}
