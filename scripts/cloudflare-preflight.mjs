import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

// Somente metadados; não publicar código, sincronizar secrets nem imprimir valores.
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
const results = {};
const report = { checkedAt: new Date().toISOString(), mode: "Read-only Cloudflare release audit", worker: "promodetec", checks: results, productionMutation: false };
async function get(name, endpoint, project) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${endpoint}`, {
    headers: { authorization: `Bearer ${token}` }, redirect: "error", signal: AbortSignal.timeout(20_000),
  });
  const chunks = []; let size = 0;
  for await (const chunk of response.body) { size += chunk.length; assert.ok(size <= 512 * 1024, "metadata_response_limit"); chunks.push(chunk); }
  const body = JSON.parse(Buffer.concat(chunks).toString());
  results[name] = { status: response.status, success: body.success === true,
    errorCodes: (body.errors ?? []).map(error => error.code),
    data: response.ok && body.success ? project(body.result) : null };
  assert.ok(response.ok && body.success, `cloudflare_${name}_unavailable`);
}
async function main() {
  assert.match(account ?? "", /^[a-f0-9]{32}$/, "cloudflare_account_required");
  assert.ok(token?.trim(), "cloudflare_token_required");
  const base = `/accounts/${account}/workers`;
  await get("settings", `${base}/scripts/promodetec/settings`, value => ({
    compatibilityDate: value.compatibility_date, compatibilityFlags: value.compatibility_flags,
    bindings: (value.bindings ?? []).map(binding => ({ name: binding.name, type: binding.type, service: binding.service, bucketName: binding.bucket_name })),
    cpuLimitMs: value.limits?.cpu_ms,
  }));
  await get("deployments", `${base}/scripts/promodetec/deployments`, value => {
    const deployments = Array.isArray(value) ? value : value.deployments;
    assert.ok(Array.isArray(deployments), "unexpected_deployments_shape");
    return deployments.slice(0, 5).map(item => ({ id: item.id, createdOn: item.created_on,
      versions: item.versions?.map(version => ({ versionId: version.version_id, percentage: version.percentage })) }));
  });
  await get("versions", `${base}/scripts/promodetec/versions?per_page=5`, value => ({
    items: (value.items ?? []).map(item => ({ id: item.id, number: item.number, createdOn: item.metadata?.created_on })),
  }));
  await get("scriptSubdomain", `${base}/scripts/promodetec/subdomain`, value => ({ enabled: value.enabled, previewsEnabled: value.previews_enabled }));
  await get("accountSubdomain", `${base}/subdomain`, value => ({ subdomain: value.subdomain }));
  await get("domains", `${base}/domains`, value => value.filter(item => item.service === "promodetec")
    .map(item => ({ hostname: item.hostname, service: item.service, zoneName: item.zone_name })));
  await get("zones", "/zones?name=promodetec.com.br", value => value.map(item => ({ name: item.name, status: item.status, nameServers: item.name_servers, plan: item.plan?.name })));
  await get("buckets", `/accounts/${account}/r2/buckets`, value => ({ buckets: (value.buckets ?? []).map(item => ({ name: item.name })) }));
}
main().catch(error => { report.failure = /^cloudflare_[a-z]+_unavailable$/.test(error.message) ? error.message : "preflight_failed"; process.exitCode = 1; }).finally(async () => {
  await mkdir("reports", { recursive: true });
  await writeFile("reports/cloudflare-preflight.json", JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ checks: Object.keys(results).length, complete: !report.failure, failure: report.failure, evidence: "reports/cloudflare-preflight.json" }));
});
