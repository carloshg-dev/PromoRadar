"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/infrastructure/supabase/browser";
import { UserRound } from "lucide-react";

export function UserMenu() {
  const sb = createBrowserSupabase();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    sb.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setEmail(s?.user?.email ?? null));
    return () => sub.subscription.unsubscribe();
  }, [sb]);

  async function sair() { await sb.auth.signOut(); setOpen(false); router.push("/"); router.refresh(); }

  if (!email) {
    return (
      <div className="flex items-center gap-2">
        <Link prefetch={false} href="/login" className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-sm font-semibold transition-colors hover:bg-bg-soft sm:w-auto sm:px-3"><UserRound className="h-4 w-4 sm:hidden" aria-hidden="true" /><span className="hidden sm:inline">Entrar</span><span className="sr-only sm:hidden">Entrar</span></Link>
        <Link prefetch={false} href="/cadastro" className="hidden min-h-11 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-2 xl:inline-flex">Criar conta</Link>
      </div>
    );
  }
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-label="Menu da conta" aria-expanded={open} className="grid h-11 w-11 place-items-center rounded-full bg-brand text-xs font-bold text-white">
        {email[0]?.toUpperCase()}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-bg-card shadow-xl">
          <div className="border-b border-line px-3 py-2.5 text-xs text-muted">{email}</div>
          <Link prefetch={false} href="/admin" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm hover:bg-bg-soft">Dashboard</Link>
          <Link prefetch={false} href="/onboarding" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm hover:bg-bg-soft">Meus interesses</Link>
          <button onClick={sair} className="block w-full px-3 py-2 text-left text-sm text-danger hover:bg-bg-soft">Sair</button>
        </div>
      )}
    </div>
  );
}
