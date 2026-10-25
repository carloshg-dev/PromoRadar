import { unstable_cache } from "next/cache";
import { listarOfertasPaginado } from "@/infrastructure/repositories/produtos.repo";

// O cache guarda a página final (até 60 itens), incluindo a prioridade afiliada já calculada.
export const paginaOfertasPublica = unstable_cache(listarOfertasPaginado, ["public-offer-page-v1"], { revalidate: 300 });
