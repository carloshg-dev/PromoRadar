"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useCampaign } from "@/components/campaign-provider";

export function CampaignRibbon() {
  const theme = useCampaign();
  if (!theme) return null;
  return <div className="campaign-ribbon">
    <div className="mx-auto flex min-h-11 max-w-page items-center justify-between gap-4 px-4 text-xs sm:px-6 lg:px-10">
      <span className="font-semibold">{theme.selo}</span>
      <span className="hidden text-center sm:block">Compare os preços. Prepare seus achados.</span>
      <Link href={theme.cta.href} prefetch={false} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 font-semibold hover:underline"><span className="hidden sm:inline">{theme.cta.label}</span><span className="sm:hidden">Ver ofertas</span><ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
    </div>
  </div>;
}
