"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VERTICAIS } from "@/lib/navigation";
import { Plus, Loader2, Check, AlertCircle, Sparkles, Wand2 } from "lucide-react";

interface Sugestao {
  loja: { slug: string; nome: string };
  titulo: string | null;
  imagemUrl: string | null;
  preco: number | null;
  marca: string | null;
  descricao: string | null;
  categoria: string | null;
  slug: string | null;
  palavrasChave: string[];
  avisos: string[];
}

/**
 * "Nova oferta" — cadastro inteligente (painel v4.0 Fatia 2). Cola o link, clica em
 * Analisar: o servidor lê a página e pré-preenche título/categoria/preço/imagem/
 * marca/descrição. O admin só CONFIRMA (edita o que quiser) e salva. Vai pro ar sem
 * deploy — é o fim do "manda pro dev e espera".
 */
export function AddOfferForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [preco, setPreco] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [marca, setMarca] = useState("");
  const [descricao, setDescricao] = useState("");
  const [slug, setSlug] = useState("");
  const [palavrasChave, setPalavrasChave] = useState("");
  const [lojaDetectada, setLojaDetectada] = useState<string | null>(null);
  const [avisos, setAvisos] = useState<string[]>([]);

  const [analisando, setAnalisando] = useState(false);
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "erro">("idle");
  const [msg, setMsg] = useState("");

  async function analisar() {
    if (!/^https?:\/\/.+/i.test(url.trim())) {
      setEstado("erro");
      setMsg("Cole uma URL válida antes de analisar.");
      return;
    }
    setAnalisando(true);
    setEstado("idle");
    setMsg("");
    setAvisos([]);
    try {
      const r = await fetch("/api/admin/produtos/analisar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setEstado("erro");
        setMsg(j.error ?? "Não consegui analisar esse link.");
        return;
      }
      const s: Sugestao = j.sugestao;
      setLojaDetectada(s.loja?.nome ?? null);
      if (s.titulo) setTitulo(s.titulo);
      if (s.preco != null) setPreco(String(s.preco).replace(".", ","));
      if (s.imagemUrl) setImagemUrl(s.imagemUrl);
      if (s.marca) setMarca(s.marca);
      if (s.descricao) setDescricao(s.descricao);
      if (s.slug) setSlug(s.slug);
      if (s.palavrasChave?.length) setPalavrasChave(s.palavrasChave.join(", "));
      if (s.categoria) setCategoria(s.categoria);
      setAvisos(s.avisos ?? []);
    } catch {
      setEstado("erro");
      setMsg("Erro de rede ao analisar — tente de novo ou preencha à mão.");
    } finally {
      setAnalisando(false);
    }
  }

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
          marca: marca.trim() || undefined,
          descricao: descricao.trim() || undefined,
          slug: slug.trim() || undefined,
          palavrasChave: palavrasChave.trim() || undefined,
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
      setUrl(""); setTitulo(""); setPreco(""); setImagemUrl("");
      setMarca(""); setDescricao(""); setSlug(""); setPalavrasChave("");
      setLojaDetectada(null); setAvisos([]);
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
          <h3 className="text-sm font-bold text-zinc-100">Nova oferta</h3>
          <p className="text-[11px] text-muted">Cole o link, clique em Analisar — o resto é só conferir e salvar.</p>
        </div>
      </div>

      <div className="grid gap-3">
        <div>
          <label className="mb-1 block label-mono text-[10px] text-muted">Link de afiliado *</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input className={campo} value={url} onChange={(e) => setUrl(e.target.value)} required
              placeholder="https://meli.la/... · awin1.com/... · amazon.com.br/..." />
            <button type="button" onClick={analisar} disabled={analisando}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-brand/40 bg-brand/15 px-3 py-2.5 text-xs font-semibold text-brand-2 transition-colors hover:bg-brand/25 disabled:opacity-60">
              {analisando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
              {analisando ? "Analisando…" : "Analisar"}
            </button>
          </div>
          <p className="mt-1 text-[10px] text-muted/80">
            {lojaDetectada ? `Loja detectada: ${lojaDetectada}. ` : ""}Cole o link já com seu afiliado — ele é gravado como está.
          </p>
        </div>

        {avisos.length > 0 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
            {avisos.map((a, i) => <div key={i}>⚠ {a}</div>)}
          </div>
        )}

        <div>
          <label className="mb-1 block label-mono text-[10px] text-muted">Título do produto *</label>
          <input className={campo} value={titulo} onChange={(e) => setTitulo(e.target.value)} required
            placeholder="Preenchido ao analisar — ou digite" />
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

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block label-mono text-[10px] text-muted">Marca <span className="text-muted/60">(opcional)</span></label>
            <input className={campo} value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Ex: Acer, Diesel, L'Oréal" />
          </div>
          <div>
            <label className="mb-1 block label-mono text-[10px] text-muted">Imagem (URL) <span className="text-muted/60">(opcional)</span></label>
            <input className={campo} value={imagemUrl} onChange={(e) => setImagemUrl(e.target.value)} placeholder="Cole a URL da foto, se tiver" />
          </div>
        </div>

        <div>
          <label className="mb-1 block label-mono text-[10px] text-muted">Descrição <span className="text-muted/60">(opcional)</span></label>
          <textarea className={`${campo} min-h-[64px] resize-y`} value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={300} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block label-mono text-[10px] text-muted">Slug <span className="text-muted/60">(opcional, SEO)</span></label>
            <input className={campo} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="gerado automaticamente" />
          </div>
          <div>
            <label className="mb-1 block label-mono text-[10px] text-muted">Palavras-chave <span className="text-muted/60">(opcional, separadas por vírgula)</span></label>
            <input className={campo} value={palavrasChave} onChange={(e) => setPalavrasChave(e.target.value)} />
          </div>
        </div>

        {imagemUrl && (
          <div className="flex items-center gap-3 rounded-lg border border-line bg-bg-soft/40 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagemUrl} alt="Pré-visualização" className="h-14 w-14 rounded-md bg-white object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <span className="text-[11px] text-muted">Pré-visualização da imagem</span>
          </div>
        )}

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
