"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabase } from "@/infrastructure/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Modo = "login" | "cadastro" | "recuperar";

export function AuthForm({ modo }: { modo: Modo }) {
  const sb = createBrowserSupabase();
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "/";
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [load, setLoad] = useState<"" | "email" | "google">("");
  const [msg, setMsg] = useState<{ tipo: "erro" | "ok"; texto: string } | null>(null);

  async function google() {
    setLoad("google");
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) { setMsg({ tipo: "erro", texto: error.message }); setLoad(""); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoad("email"); setMsg(null);
    try {
      if (modo === "login") {
        const { error } = await sb.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        router.push(next); router.refresh();
      } else if (modo === "cadastro") {
        const { error } = await sb.auth.signUp({
          email, password: senha,
          options: { data: { full_name: nome }, emailRedirectTo: `${location.origin}/auth/callback` },
        });
        if (error) throw error;
        setMsg({ tipo: "ok", texto: "Conta criada! Confirme pelo e-mail enviado para entrar." });
      } else {
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/callback?next=/conta` });
        if (error) throw error;
        setMsg({ tipo: "ok", texto: "Enviamos um link de recuperação para seu e-mail." });
      }
    } catch (err) { setMsg({ tipo: "erro", texto: (err as Error).message }); }
    finally { setLoad(""); }
  }

  const titulo = modo === "login" ? "Entrar" : modo === "cadastro" ? "Criar conta" : "Recuperar senha";
  const sub = modo === "login" ? "Bem-vindo de volta ao PromoDetec." : modo === "cadastro" ? "Comece a farejar oportunidades em segundos." : "Enviaremos um link para redefinir sua senha.";

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold">{titulo}</h1>
      <p className="mt-1 text-sm text-muted">{sub}</p>

      {modo !== "recuperar" && (
        <>
          <Button variant="outline" className="mt-6 w-full" onClick={google} disabled={!!load} type="button">
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#fff" d="M12.5 11v2.9h4.1c-.2 1.1-1.4 3.2-4.1 3.2-2.5 0-4.5-2-4.5-4.6s2-4.6 4.5-4.6c1.4 0 2.3.6 2.9 1.1l2-1.9C18.6 5.4 16.8 4.6 12.5 4.6 8 4.6 4.4 8.2 4.4 12.5S8 20.4 12.5 20.4c4.6 0 7.6-3.2 7.6-7.7 0-.5 0-.9-.1-1.3h-7.5z"/></svg>
            {load === "google" ? "Conectando…" : "Continuar com Google"}
          </Button>
          <div className="my-5 flex items-center gap-3 text-[11px] text-muted"><span className="h-px flex-1 bg-line" />ou com e-mail<span className="h-px flex-1 bg-line" /></div>
        </>
      )}

      <form onSubmit={submit} className="space-y-3">
        {modo === "cadastro" && <Input placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} required />}
        <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {modo !== "recuperar" && <Input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} />}
        <Button className="w-full" size="lg" disabled={!!load}>
          {load === "email" ? "Aguarde…" : titulo}
        </Button>
      </form>

      {msg && <div className={`mt-4 rounded-lg border px-3 py-2 text-xs ${msg.tipo === "ok" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-rose-500/30 bg-rose-500/10 text-rose-300"}`}>{msg.texto}</div>}

      <div className="mt-6 space-y-1 text-xs text-muted">
        {modo === "login" && <><div>Não tem conta? <Link href="/cadastro" className="text-brand-2 hover:underline">Criar conta</Link></div><div><Link href="/recuperar" className="text-brand-2 hover:underline">Esqueceu a senha?</Link></div></>}
        {modo === "cadastro" && <div>Já tem conta? <Link href="/login" className="text-brand-2 hover:underline">Entrar</Link></div>}
        {modo === "recuperar" && <div><Link href="/login" className="text-brand-2 hover:underline">← Voltar ao login</Link></div>}
      </div>
    </div>
  );
}
