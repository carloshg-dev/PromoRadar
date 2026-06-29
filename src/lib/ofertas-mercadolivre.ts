import { ehLinkMonetizado } from "@/lib/afiliados";

/**
 * Showcase Mercado Livre — links de afiliado CURADOS, gerados 1-a-1 no painel do
 * ML (meli.la). Espelha o padrão da Carrefour em ofertas-verificadas.ts: cada
 * item vira um card monetizado na home (o botão sai direto pro meli.la, que já
 * carrega o nosso ID de afiliado).
 *
 * Por que lista manual? O código meli.la é OPACO (gerado no servidor do ML) — não
 * dá pra computar a partir da URL do produto. Enquanto a API ML Afiliados
 * (Linkbuilder) não libera, ESTA é a via de monetização do ML. O resto do
 * catálogo que o robô raspa segue no "Dois Níveis" (CTA "Comparar preço").
 *
 * ┌─ COMO ADICIONAR (gere um link ÚNICO no painel e cole um bloco { ... }) ──────┐
 * │ titulo    — nome do produto.                                  (OBRIGATÓRIO) │
 * │ url       — o link meli.la do painel (1 link = 1 produto).     (OBRIGATÓRIO) │
 * │ cat       — ícone: notebook|celular|audio|smartwatch|tablet|gadget|         │
 * │             perfume|eletro|games|fit|casa|ferramenta.            (opcional)  │
 * │ imagemUrl — foto do produto; sem ela, mostra um ícone.          (opcional)  │
 * │ preco / precoDe — em R$ (sem `preco` → mostra "Preço no anúncio").(opcional) │
 * │ selo      — etiqueta curta: "Frete grátis", "12% OFF"...        (opcional)  │
 * │ ativo     — false esconde o item sem apagar.       (opcional, default true) │
 * └─────────────────────────────────────────────────────────────────────────────┘
 * ⚠️ NUNCA reaproveite o mesmo link em 2 produtos — o meli.la aponta pra UM só, e
 * o cliente cairia no produto errado. Cada produto precisa do SEU link único.
 * Segurança: só entra no ar se a `url` for de afiliado (ehLinkMonetizado).
 */
export interface OfertaML {
  titulo: string;
  url: string;
  cat?: string;
  imagemUrl?: string;
  preco?: number;
  precoDe?: number;
  selo?: string;
  ativo?: boolean;
}

export const OFERTAS_MERCADOLIVRE: ReadonlyArray<OfertaML> = [
  { titulo: "Kit Medidor De Glicemia Completo Para G-tech Free Preto", url: "https://meli.la/1f3M5Ki" },
  { titulo: "Base Líquida Lancôme Teint Idôle Ultra Wear 115c", url: "https://meli.la/2XXr5Bj", cat: "perfume" },
  { titulo: "Tenis Mormaii Masculino Urban One Casual Conforto Original", url: "https://meli.la/1uauAZq" },
  { titulo: "Protetor Solar Facial Fps 60 Gel Creme Oil-free Com Ação Hidratante E Antioxidante Uva/uvb Para Peles Oleosas Sem Cor Anthelios Xl Protect La Roche-posay 40g", url: "https://meli.la/2PfCv1A", cat: "perfume" },
  { titulo: "Módulo Ramal Externo Sem Fio Tis 5000 Intelbras Interfone Cor Preto 127/220v", url: "https://meli.la/2i75RFP" },
  { titulo: "Água Micelar L'oréal Paris Bifásica Limpeza Facial 200ml", url: "https://meli.la/1mvs4xp", cat: "perfume" },
  { titulo: "Shampoo Anticaspa Tratamento Para Cabelos Secos, Dercos Ds Vichy, 125g", url: "https://meli.la/21yNbgj", cat: "perfume" },
  { titulo: "Ampola Capilar Tratamento Fortalecedor Antiquebra Para Crescimento Saudável Dercos Energizante Vichy 40ml", url: "https://meli.la/1C7Ebib", cat: "perfume" },
  { titulo: "Óleo Capilar Kérastase, Huile Cicagloss Blond Absolu, Hidrata E Controla O Frizz, Para Cabelo Loiro, 75 Ml, Refil", url: "https://meli.la/2kdUzuq", cat: "perfume" },
  { titulo: "Apple iPhone 16 (128 Gb) - Branco - Distribuidor Autorizado", url: "https://meli.la/2h8QiN3", cat: "celular" },
  { titulo: "Jogo De Cama Casal Buddemeyer Cotton Essential Cor Branco", url: "https://meli.la/1SHmCL3", cat: "casa" },
  { titulo: "Protetor Térmico Capilar Résistance Extentioniste Thermique 150ml Kérastase", url: "https://meli.la/2uaFC7A", cat: "perfume" },
  { titulo: "Jogo De Banho Karsten 4 Empire Naval Cor Azul Lisa Liso", url: "https://meli.la/2hPkCDj", cat: "casa" },
  { titulo: "La Roche-posay Protetor Solar Infantil Dermopediatrics Fps60 120ml", url: "https://meli.la/1BaaEWs", cat: "perfume" },
  { titulo: "Água Micelar Antioleosidade Vitamina C 400ml Garnier", url: "https://meli.la/2EA22tN", cat: "perfume" },
  { titulo: "Kérastase Chroma Absolu Fondant Cica Chroma Condicionador Cuidado De Color, 200ml", url: "https://meli.la/1cugLd5", cat: "perfume" },
  { titulo: "Tênis Masculino adidas Acelera 2 Corrida Caminhada Leve", url: "https://meli.la/1iGv6oh" },
  { titulo: "Blusa Feminina Social Evangelica Manga 3\\4 Ombro Princesa", url: "https://meli.la/2aXxmBn" },
  { titulo: "Batom Líquido Matte Longa Duração 16h Não Transfere Cor Intensa Acabamento Matte Confortável Aplicador Preciso Cor 155... 175 Pink Ringleader", url: "https://meli.la/13fdTt6", cat: "perfume" },
  { titulo: "Jogo De Toalhas 4 Peças Fio Cardado 100% Algodão Provence Karsten Branco Argila Provence", url: "https://meli.la/2ASjHDq", cat: "casa" },
  { titulo: "Interruptor Touch Wi-fi 6 Teclas Eiw 1006 Branco Intelbras 127/220v", url: "https://meli.la/2DL3cmk", cat: "gadget" },
  { titulo: "Creme Facial Antiacne Effaclar Duo+ M 40ml La Roche Posay Mista Dia/noite", url: "https://meli.la/25J5nww", cat: "perfume" },
  { titulo: "Sérum De Vitamina C 12 Pura La Roche-posay 30ml Todo Tipo De Pele Dia/noite", url: "https://meli.la/2SjK1Uc", cat: "perfume" },
  { titulo: "Jogo De Cama Casal 100% Algodão Jasmim 4 Peças Azul Karsten Florido", url: "https://meli.la/1vjmNam", cat: "casa" },
  { titulo: "Condicionador Kérastase Resistance Extentioniste 200ml", url: "https://meli.la/2T2Y8kz", cat: "perfume" },
  { titulo: "Refil Gel De Limpeza Facial Acne Control 227g Cerave Oleosa Dia/noite", url: "https://meli.la/12DpCCy", cat: "perfume" },
  { titulo: "Loção De Limpeza Hidratante Para Pele Normal A Seca Cerave 473ml Não Possui", url: "https://meli.la/22PP6bd", cat: "perfume" },
  { titulo: "Bota Bico Fino Salto Médio Cano Curto Detalhe Lateral Moda", url: "https://meli.la/2nrync7" },
  { titulo: "Shampoo Kérastase Blond Absolu Bain Lumière | 250 Ml |", url: "https://meli.la/1narfP8", cat: "perfume" },
  { titulo: "Protetor Solar Facial Uv Age Daily Anti-idade Fps60, Toque Seco, Sem Cor, Capital Soleil, Vichy, 40g", url: "https://meli.la/2hToftq", cat: "perfume" },
  { titulo: "Panela De Pressão Elétrica Itatiaia Essencial 3 Litros Inox 127v", url: "https://meli.la/2gbuXiN", cat: "eletro" },
  { titulo: "Kit Jogo Toalhas Karsten 5 Banhão Rosto Piso Imperial Cor Lunar/gris Liso", url: "https://meli.la/1Zgy33v", cat: "casa" },
  { titulo: "Shampoo Kérastase Bain Resistance Extentioniste 250 Ml", url: "https://meli.la/1NAQaoM", cat: "perfume" },
  { titulo: "Perfume Masculino Azzaro Chrome United Edt 100ml", url: "https://meli.la/1SpKL9r", cat: "perfume" },
  { titulo: "La Roche-posay Effaclar Solução Ultra - Água Micelar 200ml", url: "https://meli.la/151j7dV", cat: "perfume" },
  { titulo: "Tênis adidas Feminino Confortável Macio Leve Treino", url: "https://meli.la/1FGmpsr" },
  { titulo: "6 Pares Meias Puma Cano Médio Alto Atoalhada Academia Sport", url: "https://meli.la/2AqM9u5", cat: "casa" },
  { titulo: "Jogo De Banho 5 Lumina Rosé/rosa Karsten Cor U Lisa Liso", url: "https://meli.la/2XB9vGF", cat: "casa" },
  { titulo: "Protetor Solar Facial Com Efeito Matte Por 12h, Alta Proteção Fps 50, Toque Seco E Controle De Brilho, Sem Cor, Capital Soleil Hydramatte, Vichy, 30g", url: "https://meli.la/1NPeVaD", cat: "perfume" },
  { titulo: "Antitranspirante Em Rolo De Aloe Vera Vichy Resist", url: "https://meli.la/1RjfP9L", cat: "perfume" },
  { titulo: "Shampoo Repositor Dercos Kera-solutions Pro-keratin Complex 300ml Vichy", url: "https://meli.la/27zcav5", cat: "perfume" },
  { titulo: "Repetidor De Sinal Mercusys Me10 Wireless Wi-fi 300 Mbps", url: "https://meli.la/2eP1eXG", cat: "gadget" },
  { titulo: "Perfume Masculino Eau De Parfum Azzaro The Most Wanted Intense 100 Ml", url: "https://meli.la/2LqATH4", cat: "perfume" },
  { titulo: "Protetores De Colchão Solteiro Bamboo Blend Impermeável Branco E Verde Camesa", url: "https://meli.la/2tN3Zje", cat: "casa" },
  { titulo: "Sensor De Presença Para Iluminação Esp 180 Branco Intelbras", url: "https://meli.la/2LtCuSA", cat: "gadget" },
  { titulo: "Base Líquida Lancôme Teint Idôle Ultra Wear 400w", url: "https://meli.la/2NW3efE", cat: "perfume" },
  { titulo: "Protetor Solar Facial Com Cor Efeito Matte 12h Toque Seco Alta Proteção Fps 50 Cor 20 Capital Soleil Vichy 30g", url: "https://meli.la/1JFnTw2", cat: "perfume" },
  { titulo: "Celular Samsung Galaxy A07 256gb 8gb Câmera 50mp Verde", url: "https://meli.la/2BPE5gq", cat: "celular" },
  { titulo: "Jogo De Ferramentas 200 Peças Com Chaves De Precisão E Allen Kit Com Maleta Resistente Titanium Platina", url: "https://meli.la/2wPAAuQ", cat: "ferramenta" },
  { titulo: "Tp-link Tapo C200 Câmera De Segurança Wifi 1080p 360° Pan/tilt Branco", url: "https://meli.la/2VqAPxw", cat: "gadget" },
  { titulo: "Parafusadeira Furadeira De Impacto A Bateria 21v 3/8 Bivolt 1400 Rpm Com Acessórios E Maleta Tb-21pzw The Black Tools", url: "https://meli.la/1xD2d8Y", cat: "ferramenta" },
  { titulo: "Cafeteira Elétrica Dolce Arome Digital Mondial 800w C-44-32x-sdi", url: "https://meli.la/16viA97", cat: "eletro" },
  { titulo: "Colchão Emma Original Casal Tecnologia Alemã Cor Branco/cinza", url: "https://meli.la/32FghLn", cat: "casa" },
  { titulo: "Smart TV 32 Philco Roku Tv Dolby Audio Hdr10 P32crb", url: "https://meli.la/2QsxWW9", cat: "eletro" },
  { titulo: "Papel Higiênico Neve Supreme Folha Tripla Leve 32 Pague 28", url: "https://meli.la/1CzYe1V" },
  { titulo: "Smart TV 43 Philco P43vik Roku Led Dolby Audio Wi-fi Hdmi Hdr Full Hd 110/220v", url: "https://meli.la/1DvvCcS", cat: "eletro" },
  { titulo: "Smartphone Motorola Moto G06 128gb 12gb* 4gb Ram + 8gb Ram Boost E Câmera 50mp Com Ai Bateria De 5200 Mah Tela 6.9\\\" Laranja", url: "https://meli.la/1juiWs9", cat: "celular" },
  { titulo: "Creatina Monohidratada Pura 1kg Dark Lab Unidade Sem Sabor", url: "https://meli.la/33HNKvm", cat: "fit" },
  { titulo: "Vaso Sanitário Monobloco Caixa Acoplada Completo Privada Cor Branco Vab0002", url: "https://meli.la/2jbtiUv", cat: "casa" },
  { titulo: "Smart TV Lg Uhd Ai Ua75 50 Polegadas Hdr10 Pro Processador α7 Ai Ger8 Webos 25", url: "https://meli.la/2bMw3Xx", cat: "eletro" },
  { titulo: "Smartphone Motorola Edge 60 Neo 5g 256gb 24gb* 12gb Ram + 12gb Ram Boost 50mp Sony Câmera Moto Ai E Tela 1.5k Super Hd Cinza", url: "https://meli.la/1WwXZbu", cat: "celular" },
  { titulo: "Tp-link Tapo C320ws Câmera De Segurança Wifi 2k Qhd Colorida Ip66 Branco", url: "https://meli.la/23h6qnj", cat: "gadget" },
  { titulo: "Cadeira Escritório Ergonômica Giratória Com Apoio Lombar Da Python Fly", url: "https://meli.la/2eUm95m", cat: "casa" },
];

/**
 * Só os itens ATIVOS e que são DE FATO link de afiliado (guarda contra colar um
 * link cru do ML por engano). Fonte da verdade do "é afiliado?" = ehLinkMonetizado.
 */
export function ofertasMLAtivas(): OfertaML[] {
  return OFERTAS_MERCADOLIVRE.filter((o) => o.ativo !== false && ehLinkMonetizado(o.url));
}
