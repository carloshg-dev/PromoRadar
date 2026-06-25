/**
 * Ofertas VERIFICADAS dos parceiros de afiliado (hoje: Carrefour via Awin).
 * Curadas do feed oficial da Awin (publisher 2936727) — links reais + datas
 * reais. O `url` é a URL crua da loja; o link de afiliado é montado por
 * linkAfiliado() (Carrefour → awinmid 17665). Expiradas somem sozinhas
 * (ofertasAtivas filtra por `ateISO`). Atualizar quando baixar novo CSV da Awin.
 */
export interface OfertaVerificada {
  titulo: string;
  loja: string;
  /** selo de vantagem (parseado do título da campanha) */ selo: string;
  /** chave de ícone: notebook|celular|audio|smartwatch|tablet|gadget|perfume|eletro */ cat: string;
  url: string;
  /** imagem real do produto, quando a página da loja expõe uma imagem confiável */
  imagemUrl?: string;
  ateISO: string; // AAAA-MM-DD (validade)
}

export const OFERTAS_VERIFICADAS: ReadonlyArray<OfertaVerificada> = [
  { titulo: "Notebook Gamer Predator Helios Neo 16 · Core Ultra 9 · RTX 5070 · 32GB · 1TB", loja: "Carrefour", selo: "Oferta", cat: "notebook", ateISO: "2026-06-30", url: "https://www.carrefour.com.br/produto/notebook-gamer-predator-helios-neo-16-ai-phn16-73-96sw-intel-core-ultra-9-275hx-32gb-ram-1tb-ssd-rtx-5070-16-338320735", imagemUrl: "https://carrefourbr.vtexassets.com/arquivos/ids/208226683/image-0.jpg?v=639034890174830000" },
  { titulo: "iPhone 14 128GB Branco", loja: "Carrefour", selo: "10% OFF no Pix", cat: "celular", ateISO: "2026-06-30", url: "https://www.carrefour.com.br/produto/iphone-14-branco-128gb-322734928", imagemUrl: "https://carrefourbr.vtexassets.com/arquivos/ids/98360434/dc86eaa5957c469e9c674c6b26e6a503.jpg?v=638104133013230000" },
  { titulo: "AirPods Pro 2ª Geração · Estojo MagSafe USB-C", loja: "Carrefour", selo: "10% OFF no Pix", cat: "audio", ateISO: "2026-06-30", url: "https://www.carrefour.com.br/produto/airpods-pro-2-geracao-com-estojo-de-recarga-magsafe-usb-c-330587839", imagemUrl: "https://carrefourbr.vtexassets.com/arquivos/ids/198439709/image-0.jpg?v=638911626929600000" },
  { titulo: "Apple Watch Series 9 · Alumínio 45mm", loja: "Carrefour", selo: "10% OFF no Pix", cat: "smartwatch", ateISO: "2026-06-30", url: "https://www.carrefour.com.br/produto/apple-watch-series-9-caixa-meia-noite-aluminio-45mm-pulseira-esportiva-meia-noite-mg-330803521", imagemUrl: "https://carrefourbr.vtexassets.com/arquivos/ids/181420238/image-0.jpg?v=638695398203730000" },
  { titulo: "iPad 10.9 Wi-Fi 64GB Prateado", loja: "Carrefour", selo: "10% OFF no Pix", cat: "tablet", ateISO: "2026-06-30", url: "https://www.carrefour.com.br/produto/ipad-de-109-polegadas-wifi-64-gb-prateado-328853255", imagemUrl: "https://carrefourbr.vtexassets.com/arquivos/ids/181459790/image-0.jpg?v=638696070119470000" },
  { titulo: "Caixa de Som JBL Flip 6 · 30W · IP67", loja: "Carrefour", selo: "10% OFF no Pix", cat: "audio", ateISO: "2026-06-30", url: "https://www.carrefour.com.br/produto/caixa-de-som-jbl-flip-6-30w-rms-2-vias-bluetooth-51-bateria-ate-12-horas-a-prova-dagua-ip67-preta-332280721", imagemUrl: "https://carrefourbr.vtexassets.com/arquivos/ids/185713500/image-0.jpg?v=638757540166370000" },
  { titulo: "Amazon Echo Dot 5ª Geração Preto", loja: "Carrefour", selo: "10% OFF no Pix", cat: "gadget", ateISO: "2026-06-30", url: "https://www.carrefour.com.br/produto/amazon-alexa-echo-dot-5-geracao-preto-com-bluetooth-50-331047856", imagemUrl: "https://carrefourbr.vtexassets.com/arquivos/ids/181420231/image-0.jpg?v=638695398189000000" },
  { titulo: "Perfume Carolina Herrera CH Sport EDT 100ml", loja: "Carrefour", selo: "18% OFF", cat: "perfume", ateISO: "2026-09-15", url: "https://www.carrefour.com.br/produto/perfume-carolina-herrera-ch-sport-eau-de-toilette-100ml-para-homens-338041544", imagemUrl: "https://carrefourbr.vtexassets.com/arquivos/ids/206950795/image-0.jpg?v=638996988272670000" },
  { titulo: "Perfumes importados · campanha especial", loja: "Carrefour", selo: "até 20% OFF", cat: "perfume", ateISO: "2026-06-30", url: "https://www.carrefour.com.br/colecao/29307" },
  { titulo: "Seleção Xiaomi · eletrônicos", loja: "Carrefour", selo: "12% OFF no Pix", cat: "eletro", ateISO: "2026-08-10", url: "https://www.carrefour.com.br/colecao/29283" },
  { titulo: "Notebook Acer Predator · Core i9 14900HX · RTX 4070 · 32GB · 1TB", loja: "Carrefour", selo: "Oferta", cat: "notebook", ateISO: "2026-06-30", url: "https://www.carrefour.com.br/produto/notebook-acer-predator-phn16-72-99my-intel-ci9-14900hx-14-gen-32gb-1tb-ssd-rtx-4070-w11-home-332786883", imagemUrl: "https://carrefourbr.vtexassets.com/arquivos/ids/180040937/notebook-acer-predator-phn16-72-99my-intel-ci9-14900hx-14a-gen-32gb-1tb-ssd-rtx-4070-w11-home.jpg?v=638678382217730000" },
  { titulo: "Notebook Gamer Acer Nitro V15 · Core i7 · RTX 4050 · 16GB", loja: "Carrefour", selo: "Oferta", cat: "notebook", ateISO: "2026-06-30", url: "https://www.carrefour.com.br/produto/notebook-gamer-acer-nitro-v15-anv15-52-737p-intel-core-i7-13620h-13g-16gb-ram-512gb-ssd-rtx4050-fhd-156-335535290", imagemUrl: "https://carrefourbr.vtexassets.com/arquivos/ids/198478766/image-0.jpg?v=638911670650630000" },
  { titulo: "Fone Apple AirPods Max · Bluetooth · Prata", loja: "Carrefour", selo: "Oferta", cat: "audio", ateISO: "2026-06-30", url: "https://www.carrefour.com.br/produto/fone-de-ouvido-sem-fio-apple-airpods-max-com-bluetooth-e-microfone-a2096-cor-prata-branco-331723759", imagemUrl: "https://carrefourbr.vtexassets.com/arquivos/ids/200770367/image-0.jpg?v=638925276145770000" },
  { titulo: "Apple Watch SE 2 (2023) GPS 44mm Midnight", loja: "Carrefour", selo: "10% OFF no Pix", cat: "smartwatch", ateISO: "2026-06-30", url: "https://www.carrefour.com.br/produto/apple-watch-se-2-2023-44-mm-gps-midnight-aluminum-sport-band-330587654", imagemUrl: "https://carrefourbr.vtexassets.com/arquivos/ids/185423818/image-0.jpg?v=638754240482270000" },
  { titulo: "Kit Perfume Feminino Cacharel Noa EDT 100ml + 2 loções", loja: "Carrefour", selo: "Oferta", cat: "perfume", ateISO: "2026-06-30", url: "https://www.carrefour.com.br/produto/kit-perfume-feminino-cacharel-noa-edt-100ml-2-locoes-corporais-50ml-324609008", imagemUrl: "https://carrefourbr.vtexassets.com/arquivos/ids/99599438/0d9800c51f284f92aa0f42619eb440b6.jpg?v=638109838299470000" },
  { titulo: "Máquina de Água SodaStream com Gás CO2 425g", loja: "Carrefour", selo: "Oferta", cat: "eletro", ateISO: "2026-06-30", url: "https://www.carrefour.com.br/produto/maquina-de-agua-sodastream-com-gas-art-co2-425g-misty-blue-4088930224-334481063", imagemUrl: "https://carrefourbr.vtexassets.com/arquivos/ids/190546499/image-0.jpg?v=638804220586500000" },
  { titulo: "Caixa de Som JBL Charge 5 · Bluetooth · 40W RMS", loja: "Carrefour", selo: "R$ 1.299", cat: "audio", ateISO: "2027-06-23", url: "https://www.carrefour.com.br/caixa-de-som-jbl-charge-5-bluetooth-wifi-40w-rms-3274195/p", imagemUrl: "https://carrefourbr.vtexassets.com/arquivos/ids/133911403/caixa-de-som-jbl-bluetooth-charge-5-wifi-1.jpg?v=638348744456070000" },
  { titulo: "Jogo PS5 Marvel Wolverine (pré-venda)", loja: "Carrefour", selo: "Pré-venda", cat: "games", ateISO: "2026-09-15", url: "https://www.carrefour.com.br/produto/jogo-ps5-marvel-wolverine-340153610", imagemUrl: "https://carrefourbr.vtexassets.com/arquivos/ids/214946707/4435826_1.jpg?v=639150700594600000" },
  { titulo: "Tônico Facial Medicube Zero Pore Pads 2.0", loja: "Carrefour", selo: "23% OFF", cat: "perfume", ateISO: "2026-09-15", url: "https://www.carrefour.com.br/produto/tonico-facial-medicube-zero-pore-pads-20-para-todos-os-tipos-de-pele-332652447", imagemUrl: "https://carrefourbr.vtexassets.com/arquivos/ids/197008133/image-0.jpg?v=638950182427030000" },
  { titulo: "Smartphones Samsung · seleção", loja: "Carrefour", selo: "até 10% OFF", cat: "celular", ateISO: "2027-06-23", url: "https://www.carrefour.com.br/colecao/27746?map=productClusterIds&order=OrderByTopSaleDESC" },
];

/** Só as ofertas ainda dentro da validade (expiradas somem sozinhas). */
export function ofertasAtivas(hoje: Date = new Date()): OfertaVerificada[] {
  return OFERTAS_VERIFICADAS.filter((o) => new Date(`${o.ateISO}T23:59:59`) >= hoje);
}
