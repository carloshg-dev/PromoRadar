import { listarCupons, type CupomLomadee } from "@/lib/lomadee-cupons";
import { cuponsCurados } from "@/lib/cupons-curados";
import { CupomCard } from "@/components/cupom-card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Ticket } from "lucide-react";

export const metadata = {
  title: "Cupons de desconto",
  description: "Cupons e ofertas das lojas parceiras do PromoDetec — atualizados automaticamente, direto das marcas.",
};
// Se a API estiver temporariamente limitada durante o build, a pagina tenta se
// recompor em poucos minutos. Uma coleta bem-sucedida continua cacheada por
// 30 minutos dentro de `listarCupons`.
export const revalidate = 300;

function chavesDoCupom(cupom: CupomLomadee): string[] {
  const chaves = [`id:${cupom.id}`, `link:${cupom.link.trim().toLowerCase()}`];
  const codigo = cupom.codigo?.trim().toLowerCase();
  if (codigo) chaves.push(`codigo:${cupom.marca.trim().toLowerCase()}:${codigo}`);
  return chaves;
}

function mesclarComCurados(
  curados: CupomLomadee[],
  automaticos: CupomLomadee[],
): CupomLomadee[] {
  const vistos = new Set(curados.flatMap(chavesDoCupom));
  const resultado = [...curados];

  for (const cupom of automaticos) {
    const chaves = chavesDoCupom(cupom);
    if (chaves.some((chave) => vistos.has(chave))) continue;
    chaves.forEach((chave) => vistos.add(chave));
    resultado.push(cupom);
  }

  return resultado;
}

export default async function Cupons() {
  // Curados manuais sempre sobrevivem e ficam antes da coleta automatica.
  const curados = cuponsCurados();
  let automaticos: CupomLomadee[] = [];
  try {
    automaticos = await listarCupons(60);
  } catch (error) {
    console.warn(
      "[cupons] coleta automatica indisponivel:",
      error instanceof Error ? error.message : "erro desconhecido",
    );
    // Uma falha externa nao remove campanhas curadas ja validadas.
  }
  const cupons = mesclarComCurados(curados, automaticos);

  return (
    <main className="mx-auto max-w-page px-4 py-6 sm:px-6 lg:px-10">
      <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Cupons" }]} />
      <h1 className="mt-3 flex items-center gap-2 text-2xl font-bold">
        <Ticket className="h-6 w-6 text-brand-2" /> Cupons de desconto
      </h1>
      <p className="mt-1 text-sm text-muted">
        Direto das marcas parceiras, sem caça ao tesouro — copia o código, aplica no site da loja e pronto.
        {cupons.length > 0 && (
          <span className="label-mono ml-2 text-[11px]">{cupons.length} cupons ativos agora</span>
        )}
      </p>

      {cupons.length ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cupons.map((c) => <CupomCard key={c.id} cupom={c} />)}
        </div>
      ) : (
        <EmptyState className="mt-8" icon="🎟️" title="Sem cupons no momento"
          hint="As campanhas das marcas renovam ao longo do dia — volta daqui a pouco."
          action={<Link href="/ofertas"><Button variant="outline" size="sm">Ver ofertas</Button></Link>} />
      )}
    </main>
  );
}
