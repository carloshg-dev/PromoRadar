import { ehLinkMonetizado } from "@/lib/afiliados";

/**
 * Showcase Mercado Livre — links de afiliado curados (meli.la), com TÍTULO e FOTO
 * REAIS resolvidos do destino de cada link. (Os títulos da lista original vinham
 * trocados; aqui cada card mostra o produto que o link de fato abre.) Espelha o
 * padrão da Carrefour em ofertas-verificadas.ts. Sem preço fixo (fica no anúncio,
 * pra não envelhecer). Só vai pro ar se a url for de afiliado (ehLinkMonetizado).
 * Pra adicionar: gere um link meli.la no painel e rode o resolvedor de novo.
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
  { titulo: "Carregador Adaptador Usb-c De 20w Para iPhone Apple Branco A2465 - Distribuidor Autorizado", url: "https://meli.la/1f3M5Ki", cat: "celular", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_697458-MLA92882793775_092025-O.webp" },
  { titulo: "Loção Hidratante Corporal Sem Perfume, Com Ceramidas Essenciais E Ácido Hialurônico, Textura Fluida Cerave 473ml Sem Fragrância", url: "https://meli.la/2XXr5Bj", cat: "perfume", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_841667-MLA110746696146_052026-O.webp" },
  { titulo: "Máquina De Costura Elgin Jx-4035 Genius Plus 31 Pontos Cor Branco 220v", url: "https://meli.la/1uauAZq", cat: "eletro", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_611378-MLA95494262134_102025-O.webp" },
  { titulo: "Tp-link Tapo C500 Câmera De Segurança Wifi 1080p 360° Colorida Ip65 Branco", url: "https://meli.la/2PfCv1A", cat: "gadget", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_794417-MLA99985509435_112025-O.webp" },
  { titulo: "Video Porteiro Ivr 1010 Branco E Preto Intelbras 110v/220v", url: "https://meli.la/2i75RFP", cat: "gadget", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_623972-MLA99988236647_112025-O.webp" },
  { titulo: "Escova Progressiva 150g - Fashion Gold", url: "https://meli.la/1mvs4xp", cat: "perfume", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_861957-MLA108178234350_032026-O.webp" },
  { titulo: "Kit Medidor De Glicemia Completo Para G-tech Free Preto", url: "https://meli.la/21yNbgj", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_929520-MLB43072020455_082020-O.webp" },
  { titulo: "Base Líquida Lancôme Teint Idôle Ultra Wear 115c", url: "https://meli.la/1C7Ebib", cat: "perfume", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_678499-MLA92033174747_092025-O.webp" },
  { titulo: "Tenis Mormaii Masculino Urban One Casual Conforto Original", url: "https://meli.la/2kdUzuq", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_891655-MLB106629293036_022026-O.webp" },
  { titulo: "Protetor Solar Facial Fps 60 Gel Creme Oil-free Com Ação Hidratante E Antioxidante Uva/uvb Para Peles Oleosas Sem Cor Anthelios Xl Protect L", url: "https://meli.la/2h8QiN3", cat: "perfume", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_964467-MLA97317249263_112025-O.webp" },
  { titulo: "Módulo Ramal Externo Sem Fio Tis 5000 Intelbras Interfone Cor Preto 127/220v", url: "https://meli.la/1SHmCL3", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_995579-MLA108931606278_032026-O.webp" },
  { titulo: "Água Micelar L'oréal Paris Bifásica Limpeza Facial 200ml", url: "https://meli.la/2uaFC7A", cat: "perfume", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_919583-MLA84849688857_052025-O.webp" },
  { titulo: "Shampoo Anticaspa Tratamento Para Cabelos Secos, Dercos Ds Vichy, 125g", url: "https://meli.la/2hPkCDj", cat: "perfume", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_826028-MLA109923270649_042026-O.webp" },
  { titulo: "Ampola Capilar Tratamento Fortalecedor Antiquebra Para Crescimento Saudável Dercos Energizante Vichy 40ml", url: "https://meli.la/1BaaEWs", cat: "perfume", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_680790-MLA99444254460_112025-O.webp" },
  { titulo: "Óleo Capilar Kérastase, Huile Cicagloss Blond Absolu, Hidrata E Controla O Frizz, Para Cabelo Loiro, 75 Ml, Refil", url: "https://meli.la/2EA22tN", cat: "perfume", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_627212-MLA99450013254_112025-O.webp" },
  { titulo: "Apple iPhone 16 (128 Gb) - Branco - Distribuidor Autorizado", url: "https://meli.la/1cugLd5", cat: "celular", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_809936-MLA96419773842_102025-O.webp" },
  { titulo: "Jogo De Cama Casal Buddemeyer Cotton Essential Cor Branco", url: "https://meli.la/1iGv6oh", cat: "casa", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_736030-MLA99927804395_112025-O.webp" },
  { titulo: "Protetor Térmico Capilar Résistance Extentioniste Thermique 150ml Kérastase", url: "https://meli.la/2aXxmBn", cat: "perfume", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_936530-MLA99933606403_112025-O.webp" },
  { titulo: "Jogo De Banho Karsten 4 Empire Naval Cor Azul Lisa Liso", url: "https://meli.la/13fdTt6", cat: "casa", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_988749-MLA95937184413_102025-O.webp" },
  { titulo: "La Roche-posay Protetor Solar Infantil Dermopediatrics Fps60 120ml", url: "https://meli.la/2ASjHDq", cat: "perfume", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_622622-MLA99846193869_112025-O.webp" },
  { titulo: "Água Micelar Antioleosidade Vitamina C 400ml Garnier", url: "https://meli.la/2DL3cmk", cat: "perfume", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_725747-MLA79879353991_102024-O.webp" },
  { titulo: "Kérastase Chroma Absolu Fondant Cica Chroma Condicionador Cuidado De Color, 200ml", url: "https://meli.la/25J5nww", cat: "perfume", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_605698-MLA99843221213_112025-O.webp" },
  { titulo: "Tênis Masculino adidas Acelera 2 Corrida Caminhada Leve", url: "https://meli.la/2SjK1Uc", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_883372-MLB93324213232_092025-O.webp" },
  { titulo: "Blusa Feminina Social Evangelica Manga 3\\4 Ombro Princesa", url: "https://meli.la/1vjmNam", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_980159-MLB98662153713_112025-O.webp" },
  { titulo: "Batom Líquido Matte Longa Duração 16h Não Transfere Cor Intensa Acabamento Matte Confortável Aplicador Preciso Cor 155... 175 Pink Ringleade", url: "https://meli.la/2T2Y8kz", cat: "perfume", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_902324-MLA108909445702_032026-O.webp" },
  { titulo: "Jogo De Toalhas 4 Peças Fio Cardado 100% Algodão Provence Karsten Branco Argila Provence", url: "https://meli.la/12DpCCy", cat: "casa", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_773654-MLA96114767523_102025-O.webp" },
  { titulo: "Interruptor Touch Wi-fi 6 Teclas Eiw 1006 Branco Intelbras 127/220v", url: "https://meli.la/22PP6bd", cat: "gadget", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_651720-MLA111692059379_052026-O.webp" },
  { titulo: "Creme Facial Antiacne Effaclar Duo+ M 40ml La Roche Posay Mista Dia/noite", url: "https://meli.la/2nrync7", cat: "perfume", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_888623-MLU74847249632_032024-O.webp" },
  { titulo: "Sérum De Vitamina C 12 Pura La Roche-posay 30ml Todo Tipo De Pele Dia/noite", url: "https://meli.la/1narfP8", cat: "perfume", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_780574-MLA92082812572_092025-O.webp" },
  { titulo: "Jogo De Cama Casal 100% Algodão Jasmim 4 Peças Azul Karsten Florido", url: "https://meli.la/2hToftq", cat: "casa", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_737469-MLA95956580242_102025-O.webp" },
  { titulo: "Condicionador Kérastase Resistance Extentioniste 200ml", url: "https://meli.la/2gbuXiN", cat: "perfume", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_991529-MLA99935131565_112025-O.webp" },
  { titulo: "Refil Gel De Limpeza Facial Acne Control 227g Cerave Oleosa Dia/noite", url: "https://meli.la/1Zgy33v", cat: "perfume", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_925887-MLA80410796067_112024-O.webp" },
  { titulo: "Loção De Limpeza Hidratante Para Pele Normal A Seca Cerave 473ml Não Possui", url: "https://meli.la/1NAQaoM", cat: "perfume", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_622504-MLA106783370726_022026-O.webp" },
  { titulo: "Bota Bico Fino Salto Médio Cano Curto Detalhe Lateral Moda", url: "https://meli.la/1SpKL9r", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_732715-MLB83893985368_042025-O.webp" },
  { titulo: "Shampoo Kérastase Blond Absolu Bain Lumière | 250 Ml |", url: "https://meli.la/151j7dV", cat: "perfume", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_747868-MLU72533352476_102023-O.webp" },
  { titulo: "Protetor Solar Facial Uv Age Daily Anti-idade Fps60, Toque Seco, Sem Cor, Capital Soleil, Vichy, 40g", url: "https://meli.la/1FGmpsr", cat: "perfume", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_978041-MLA96897361048_112025-O.webp" },
  { titulo: "Panela De Pressão Elétrica Itatiaia Essencial 3 Litros Inox 127v", url: "https://meli.la/2AqM9u5", cat: "eletro", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_905161-MLA99582040400_122025-O.webp" },
  { titulo: "Kit Jogo Toalhas Karsten 5 Banhão Rosto Piso Imperial Cor Lunar/gris Liso", url: "https://meli.la/2XB9vGF", cat: "casa", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_652407-MLA95961099035_102025-O.webp" },
  { titulo: "Shampoo Kérastase Bain Resistance Extentioniste 250 Ml", url: "https://meli.la/1NPeVaD", cat: "perfume", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_768669-MLA99360473064_112025-O.webp" },
  { titulo: "Perfume Masculino Azzaro Chrome United Edt 100ml", url: "https://meli.la/1RjfP9L", cat: "perfume", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_798870-MLA79592785745_092024-O.webp" },
  { titulo: "La Roche-posay Effaclar Solução Ultra - Água Micelar 200ml", url: "https://meli.la/27zcav5", cat: "perfume", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_635741-MLA82349741390_022025-O.webp" },
  { titulo: "Jogo De Panelas Brinox Antiaderente Ceramic Indução 5 Peças Preto", url: "https://meli.la/2eP1eXG", cat: "casa", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_802093-MLA95666828590_102025-O.webp" },
  { titulo: "Kit 2 Camera Segurança A31 Icsee Prova D'agua Lente Dupla Cor Branco/preto Estary Shop", url: "https://meli.la/2LqATH4", cat: "gadget", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_832608-MLA96144009929_102025-O.webp" },
  { titulo: "Banqueta Confort Material Ecológico Regulagem De Altura Cor Preto", url: "https://meli.la/2tN3Zje", cat: "casa", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_695320-MLA84536039242_052025-O.webp" },
  { titulo: "Creatina 1kg Suplemento Monohidratada Em Pó 100% Pura - Soldiers Nutrition Sem Sabor", url: "https://meli.la/2LtCuSA", cat: "fit", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_894230-MLA111390627295_052026-O.webp" },
  { titulo: "Sofá Retrátil Reclinável Atenas 2,30m Suede Velut Cinza", url: "https://meli.la/1JFnTw2", cat: "casa", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_636009-MLA99450703164_112025-O.webp" },
  { titulo: "Projetor Android 11 Hy320 4k Bluetooth Smart Cinema Em Casa Cor Preto 127/220v", url: "https://meli.la/2BPE5gq", cat: "gadget", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_614142-MLA95239230374_102025-O.webp" },
  { titulo: "Jogo Soquetes Catracas Ferramentas Kit Chave 216 Peças Completa Oficina Master Maleta Tkf216 The Black Tools", url: "https://meli.la/2wPAAuQ", cat: "ferramenta", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_765367-MLA99991145075_112025-O.webp" },
  { titulo: "Nac 600mg - Fórmula Exclusiva Com Máxima Concentração E Pureza - N-acetil L-cisteína - 60 Cápsulas Sem Sabor", url: "https://meli.la/2VqAPxw", cat: "fit", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_628799-MLA105714524195_012026-O.webp" },
  { titulo: "Liquidificador Full 1400w 15 Velocidades Oliq610 Preto Oster 220v", url: "https://meli.la/1xD2d8Y", cat: "eletro", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_702461-MLA100061718683_122025-O.webp" },
  { titulo: "Kit 10 Painel 3d Mármore Parede Autocolante 60 X 30 Pdeals", url: "https://meli.la/16viA97", cat: "casa", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_789257-MLB88796787666_082025-O.webp" },
  { titulo: "Conjunto Panelas Antiaderente 10 Peças Teflon Várias Cores", url: "https://meli.la/32FghLn", cat: "casa", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_978965-MLB111357549836_052026-O.webp" },
  { titulo: "Cobertor Queen Grosso Coberdrom Lã Carneiro Dupla Face Manta", url: "https://meli.la/2QsxWW9", cat: "casa", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_781779-MLB108371276181_032026-O.webp" },
  { titulo: "Tp-link Deco X50(3-pack) Roteador Mesh Wifi6 Ax3000 Cobre Até 600m²", url: "https://meli.la/1CzYe1V", cat: "gadget", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_695526-MLA99964513811_112025-O.webp" },
  { titulo: "Transformador 5000va De 110 Para 220 E 220v Para 110v Bivolt 12000 Btus Conversor Voltagem 5kva Energia Ar Condicionado Impressoras Brother ", url: "https://meli.la/1DvvCcS", cat: "gadget", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_861479-MLA99503246768_112025-O.webp" },
  { titulo: "Tp-link Tapo C200 Câmera De Segurança Wifi 1080p 360° Pan/tilt Branco", url: "https://meli.la/1juiWs9", cat: "gadget", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_984810-MLA95712397240_102025-O.webp" },
  { titulo: "Creme Reparador Cicaplast Baume B5+ 20ml La Roche-posay", url: "https://meli.la/33HNKvm", cat: "perfume", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_661168-MLA107310524926_032026-O.webp" },
  { titulo: "Fechadura Digital De Sobrepor Fr 101 V Preta Intelbras Preto", url: "https://meli.la/2jbtiUv", cat: "gadget", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_916058-MLA109588424588_042026-O.webp" },
  { titulo: "Mercusys Mc510 Câmera Segurança Wifi 2k 360° Externo Por Tp-link Branco", url: "https://meli.la/2bMw3Xx", cat: "gadget", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_626181-MLA110269015534_052026-O.webp" },
  { titulo: "Tablet Lenovo Tab 10.1¨ Wifi 5 64gb 4gb De Ram Android 14 Cinza", url: "https://meli.la/1WwXZbu", cat: "tablet", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_821183-MLA108938360379_032026-O.webp" },
  { titulo: "Kit Cabides Veludo De Roupa Antideslizante Slim Adulto 50 Un Preto", url: "https://meli.la/23h6qnj", cat: "casa", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_873539-MLA100979589011_122025-O.webp" },
  { titulo: "Kérastase Gloss Absolu Glaze Drops Óleo Capilar | 45ml |", url: "https://meli.la/2eUm95m", cat: "perfume", imagemUrl: "https://http2.mlstatic.com/D_NQ_NP_839329-MLA99827175445_112025-O.webp" },
];

/** Só os itens ATIVOS e que são DE FATO link de afiliado (guarda contra link cru). */
export function ofertasMLAtivas(): OfertaML[] {
  return OFERTAS_MERCADOLIVRE.filter((o) => o.ativo !== false && ehLinkMonetizado(o.url));
}
