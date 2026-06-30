"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VERTICAIS } from "@/lib/navigation";
import { Plus, Loader2, Check, AlertCircle, Sparkles } from "lucide-react";

/**
 * "Adicionar oferta" (painel v4.0) — cola o link de afiliado, escolhe a categoria,
 * salva. Vai pro ar na hora (sem deploy). É o fim do "manda pro dev e espera".
 * Loja é deduzida do link no servidor; preço/imagem são opcionais.
 */
export function AddOfferForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [preco, setPreco] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "erro">("idle");
  const [msg, setMsg] = useState("");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    setMsg("");
    try {
      const r = await fetch("/api/admin/produtos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          titulo: titulo.trim(),
          categoria,
          preco: preco ? Number(preco.replace(/\./g, "").replace(",", ".")) : undefined,
          imagemUrl: imagemUrl.trim() || undefined,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setEstado("erro");
        setMsg(j.error ?? "Não consegui adicionar.");
        return;
      }
      setEstado("ok");
      setMsg(`✓ Adicionado em ${j.loja} — já está no ar.`);
      setUrl("");
      setTitulo("");
      setPreco("");
      setImagemUrl("");
      router.refresh();
    } catch {
      setEstado("erro");
      setMsg("Erro de rede — tente de novo.");
    }
  }

  const campo = "w-full rounded-lg border border-line bg-bg-soft/60 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-muted/70 outline-none transition-colors focus:border-brand/60";

  return (
    <form onSubmit={enviar} className="rounded-2xl border border-brand/25 bg-gradient-to-b from-brand/[0.07] to-transparent p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-brand to-cyan text-white">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-zinc-100">Adicionar oferta</h3>
          <p className="text-[11px] text-muted">Cole o link de afiliado, dê um título e escolha a categoria. Vai pro ar na hora.</p>
        </div>
      </div>

      <div className="grid gap-3">
        <div>
          <label className="mb-1 block label-mono text-[10px] text-muted">Link de afiliado *</label>
          <input className={campo} value={url} onChange={(e) => setUrl(e.target.value)} required
            placeholder="https://meli.la/... · awin1.com/... · amazon.com.br/..." />
          <p className="mt-1 text-[10px] text-muted/80">A loja é detectada pelo link. Cole o link já com seu afiliado — ele é gravado como está.</p>
        </div>

        <div>
          <label className="mb-1 block label-mono text-[10px] text-muted">Título do produto *</label>
          <input className={campo} value={titulo} onChange={(e) => setTitulo(e.target.value)} required
            placeholder="Ex: Notebook Gamer Acer Nitro V15 · Core i7 · RTX 4050" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block label-mono text-[10px] text-muted">Categoria *</label>
            <select className={`${campo} appearance-none`} value={categoria} onChange={(e) => setCategoria(e.target.value)} required>
              <option value="">— escolha —</option>
              {VERTICAIS.map((v) => (
                <optgroup key={v.slug} label={v.label}>
                  {v.categorias.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.nome}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block label-mono text-[10px] text-muted">Preço <span className="text-muted/60">(opcional)</span></label>
            <input className={campo} value={preco} onChange={(e) => setPreco(e.target.value)} inputMode="decimal"
              placeholder="Ex: 1299,90 — deixe vazio = 'preço no anúncio'" />
          </div>
        </div>

        <div>
          <label className="mb-1 block label-mono text-[10px] text-muted">Imagem (URL) <span className="text-muted/60">(opcional)</span></label>
          <input className={campo} value={imagemUrl} onChange={(e) => setImagemUrl(e.target.value)}
            placeholder="Cole a URL da foto do produto, se tiver" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={estado === "enviando"}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-60">
            {estado === "enviando" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {estado === "enviando" ? "Adicionando…" : "Adicionar ao site"}
          </button>
          {estado === "ok" && <span className="inline-flex items-center gap-1.5 text-sm font-medium text-neon"><Check className="h-4 w-4" /> {msg}</span>}
          {estado === "erro" && <span className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-400"><AlertCircle className="h-4 w-4" /> {msg}</span>}
        </div>
      </div>
    </form>
  );
}
