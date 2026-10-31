import { unstable_cache } from "next/cache";
import { listarOfertasPaginado } from "@/infrastructure/repositories/produtos.repo";

// O cache guarda somente a página final (até 60 itens), com filtros aplicados no banco.
export const paginaOfertasPublica = unstable_cache(listarOfertasPaginado, ["public-offer-page-v2-budget-images"], { revalidate: 300 });
