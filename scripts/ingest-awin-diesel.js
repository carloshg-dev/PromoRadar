// Import pontual do feed Awin da Diesel (advId 17846) -> categoria moda (roupas/calcados)
// e perfume Diesel -> perfumes-importados. Loja propria "diesel". Guilhotina R$20.
require('dotenv').config({ path: '.env.local' });
const { gunzipSync } = require('node:zlib');
const { createClient } = require('@supabase/supabase-js');

const FEEDLIST = process.env.AWIN_DATAFEED_URL;
const PISO = Number(process.env.PISO_PRECO_BRL) || 20;
const FX = { BRL: 1, USD: Number(process.env.AWIN_FX_USD) || 5.4, EUR: 5.9 };
const ADV = '17846'; // Diesel BR
const MAX = 400;

function parseCsvLinha(linha) {
  const out = []; let cur = '', dentro = false;
  for (let i = 0; i < linha.length; i++) {
    const ch = linha[i];
    if (dentro) { if (ch === '"' && linha[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') dentro = false; else cur += ch; }
    else if (ch === '"') dentro = true; else if (ch === ',') { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur); return out;
}

(async () => {
  if (!FEEDLIST) throw new Error('sem AWIN_DATAFEED_URL');
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data: cats } = await sb.from('categorias').select('id,slug').in('slug', ['moda', 'perfumes-importados']);
  const catId = Object.fromEntries((cats || []).map(c => [c.slug, c.id]));
  if (!catId['moda']) throw new Error('categoria moda nao existe');

  const DRY = !!process.env.DRY;
  const runStart = new Date().toISOString();
  // loja diesel (cria se nao existe)
  let { data: loja } = await sb.from('lojas').select('id').eq('adapter_key', 'diesel').maybeSingle();
  if (!loja) {
    if (DRY) { loja = { id: 'dry-loja-id' }; }
    else {
      const { data: nova, error } = await sb.from('lojas').insert({ slug: 'diesel', nome: 'Diesel', base_url: 'https://www.diesel.com.br', adapter_key: 'diesel', ativo: true, selo: 'oficial' }).select('id').single();
      if (error) throw new Error('criar loja diesel: ' + error.message);
      loja = nova;
    }
  }
  const lojaId = loja.id;
  const slugDeId = Object.fromEntries(Object.entries(catId).map(([s, i]) => [i, s]));

  // feedList -> url do feed da Diesel
  const lista = await (await fetch(FEEDLIST)).text();
  let feedUrl = null;
  for (const ln of lista.split('\n')) {
    const c = ln.split('","').map(s => s.replace(/^"|"$/g, ''));
    if (c[0] === ADV && (c[12] || '').startsWith('http')) { feedUrl = c[12]; break; }
  }
  if (!feedUrl) throw new Error('feed da Diesel nao encontrado no feedList');

  const buf = Buffer.from(await (await fetch(feedUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })).arrayBuffer());
  const csv = gunzipSync(buf).toString('utf8');
  const linhas = csv.split('\n');
  const head = parseCsvLinha(linhas[0] || '').map(h => h.trim());
  const ix = n => head.indexOf(n);
  const iNome = ix('product_name'), iLink = ix('aw_deep_link'), iImg = ix('aw_image_url'), iImg2 = ix('merchant_image_url'),
    iPreco = ix('search_price'), iOld = ix('product_price_old'), iCur = ix('currency'), iMarca = ix('brand_name'),
    iPid = ix('aw_product_id'), iCat = ix('merchant_category'), iDesc = ix('description');

  const rows = []; const vistos = new Set(); const titulosVistos = new Set(); let moda = 0, beleza = 0, fora = 0;
  for (let r = 1; r < linhas.length && rows.length < MAX; r++) {
    if (!linhas[r] || !linhas[r].trim()) continue;
    const row = parseCsvLinha(linhas[r]);
    const nome = (row[iNome] || '').trim(); const link = (row[iLink] || '').trim();
    const img = ((row[iImg] || '').trim() || (iImg2 >= 0 ? (row[iImg2] || '').trim() : '')) || '';
    const moeda = (iCur >= 0 ? (row[iCur] || '').trim().toUpperCase() : '') || 'BRL'; const fx = FX[moeda];
    const preco = fx ? Number(row[iPreco]) * fx : NaN;
    if (!nome || !link || !img || !Number.isFinite(preco) || preco < PISO) { fora++; continue; }
    const sku = `diesel-${(iPid >= 0 ? (row[iPid] || '').trim() : '') || r}`;
    if (vistos.has(sku)) continue; vistos.add(sku);
    // dedup por titulo: variantes de COR têm a cor no título (não colidem); só corta
    // o mesmo produto repetido (ex: "Moletom S-Rob-Megoval" idêntico 2x).
    const tituloKey = nome.toLowerCase().replace(/\s+/g, ' ').trim();
    if (titulosVistos.has(tituloKey)) continue; titulosVistos.add(tituloKey);
    const txt = (nome + ' ' + (iCat >= 0 ? (row[iCat] || '') : '') + ' ' + (iDesc >= 0 ? (row[iDesc] || '') : '')).toLowerCase();
    const ehPerfume = /perfum|fragran|eau de|cologne|colonia|toilette|parfum/.test(txt);
    const slug = ehPerfume ? 'perfumes-importados' : 'moda';
    if (!catId[slug]) continue;
    if (ehPerfume) beleza++; else moda++;
    const old = iOld >= 0 && fx ? Number(row[iOld]) * fx : NaN;
    rows.push({ loja_id: lojaId, categoria_id: catId[slug], sku_loja: sku, titulo: nome.slice(0, 500),
      marca: (iMarca >= 0 && (row[iMarca] || '').trim()) || 'Diesel', url: link, imagem_url: img,
      preco_atual: preco, preco_original: Number.isFinite(old) && old > preco ? old : null,
      desconto_pct: Number.isFinite(old) && old > preco ? Math.round((1 - preco / old) * 100) : 0,
      // Diesel (premium, sem dado de desconto) ganha um score-base de "parceiro em
      // destaque" p/ NÃO afundar como nulls-last quando a categoria crescer. Não
      // inventa selo de desconto (desconto_pct só sai se houver preco_original real).
      em_estoque: true, promo_score: 88, visto_em: runStart });
  }
  if (DRY) {
    console.log(`\n[DRY] amostras (${Math.min(15, rows.length)} de ${rows.length}):`);
    rows.slice(0, 15).forEach(r => console.log(`  [${slugDeId[r.categoria_id] || '??'}] ${r.titulo.slice(0, 64)} | R$${r.preco_atual.toFixed(2)} | ${r.imagem_url ? 'img✓' : 'SEM IMG'}`));
  } else {
    for (let s = 0; s < rows.length; s += 500) {
      const { error } = await sb.from('produtos').upsert(rows.slice(s, s + 500), { onConflict: 'loja_id,sku_loja' });
      if (error) console.log('erro upsert:', error.message);
    }
    // stale-sweep escopado à loja Diesel: o que não foi visto neste run sai de estoque.
    const { error: stErr, count } = await sb.from('produtos')
      .update({ em_estoque: false }, { count: 'exact' })
      .eq('loja_id', lojaId).lt('visto_em', runStart);
    if (stErr) console.log('erro stale-sweep:', stErr.message);
    else console.log(`stale Diesel fora de estoque: ${count ?? 0}`);
  }
  console.log(`\nDiesel ${DRY ? '(DRY — nada gravado)' : 'importado'}: ${rows.length} produtos (moda=${moda}, beleza/perfume=${beleza}, descartados=${fora})`);
})().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
