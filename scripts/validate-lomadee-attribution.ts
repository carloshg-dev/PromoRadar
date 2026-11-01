import { mkdir, writeFile } from "node:fs/promises";
import { lomadeeBrands, lomadeeComparatorChannel, lomadeeComparatorLink, lomadeeRecord } from "../src/infrastructure/lomadee/api";

/** Preflight de release: só GET de marcas; nunca cunha links nem grava catálogo. */
async function main() {
  const key = process.env.LOMADEE_API_KEY?.trim();
  if (!key) throw new Error("lomadee_preflight_key_missing");
  const expected = process.env.LOMADEE_SOURCE_ID?.trim();
  const result = await lomadeeBrands(key, AbortSignal.timeout(60_000));
  const eligible = result.brands.filter(brand => lomadeeRecord(brand.network).active === true && lomadeeComparatorLink(brand.channels));
  const matches = expected ? eligible.filter(brand => lomadeeComparatorLink(brand.channels, expected)).length : null;
  const legacyMatches = expected ? eligible.filter(brand => lomadeeComparatorChannel(brand.channels, expected)?.matchedBy === "legacy_type_id").length : 0;
  const typeMatches = expected ? eligible.filter(brand => (Array.isArray(brand.channels) ? brand.channels : []).some(value => lomadeeRecord(lomadeeRecord(value).availableChannel).id === expected)).length : null;
  const report = { checkedAt: new Date().toISOString(), remoteWrites: false, status: result.status, pagesRead: result.pagesRead, brands: result.brands.length,
    comparatorEligibleBrands: eligible.length, channelGuardConfigured: Boolean(expected), expectedChannelMatchedBrands: matches, legacyTypeResolvedBrands: legacyMatches, expectedValueMatchesChannelType: Boolean(typeMatches),
    passed: result.status === "ok" && eligible.length > 0 && (!expected || (matches ?? 0) > 0) };
  await mkdir("reports", { recursive: true });
  await writeFile("reports/lomadee-attribution-preflight.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  if (!report.passed) throw new Error("lomadee_attribution_preflight_failed");
}
main().catch(error => { console.error(error instanceof Error && /^[a-z0-9_]+$/.test(error.message) ? error.message : "lomadee_attribution_preflight_failed"); process.exitCode = 1; });
