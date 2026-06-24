"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/infrastructure/supabase/browser";
import { Button } from "@/components/ui/button";

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
        <Link href="/login"><Button variant="ghost" size="sm">Entrar</Button></Link>
        <Link href="/cadastro"><Button size="sm">Criar conta</Button></Link>
      </div>
    );
  }
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="grid h-8 w-8 place-items-center rounded-full bg-brand text-xs font-bold text-white">
        {email[0]?.toUpperCase()}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-bg-card shadow-xl">
          <div className="border-b border-line px-3 py-2.5 text-xs text-muted">{email}</div>
          <Link href="/admin" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm hover:bg-bg-soft">Dashboard</Link>
          <Link href="/onboarding" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm hover:bg-bg-soft">Meus interesses</Link>
          <button onClick={sair} className="block w-full px-3 py-2 text-left text-sm text-rose-300 hover:bg-bg-soft">Sair</button>
        </div>
      )}
    </div>
  );
}
