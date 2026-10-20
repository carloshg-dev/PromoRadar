import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const script = path.resolve("scripts/cloudflare-preflight.mjs");
const fakeToken = "fake-token-without-cloudflare-access";
function run(mode: "missing" | "denied" | "accepted") {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "promodetec-preflight-"));
  try {
    const preload = path.join(directory, "fetch-fixture.mjs");
    fs.writeFileSync(preload, `import {writeFileSync} from 'node:fs';
      const calls=[];
      globalThis.fetch=async(url,init)=>{
        if(${JSON.stringify(mode)}==='missing')throw new Error('unexpected_fetch');
        if(init.method&&init.method!=='GET')throw new Error('mutation_forbidden');
        if(init.headers.authorization!=='Bearer ${fakeToken}')throw new Error('wrong_credential');
        if(init.redirect!=='error')throw new Error('redirect_not_rejected');
        calls.push(new URL(url).pathname);writeFileSync('calls.json',JSON.stringify(calls));
        if(${JSON.stringify(mode)}==='denied')return Response.json({success:false,errors:[{code:10000,message:'unsafe-private-value'}]},{status:401});
        const pathname=new URL(url).pathname;
        let result={};
        if(pathname.endsWith('/settings'))result={compatibility_date:'2026-08-23',bindings:[{name:'SERVER_KEY',type:'secret_text',text:'unsafe-private-value'}]};
        else if(pathname.endsWith('/deployments'))result={deployments:[{id:'deployment',created_on:'2026-10-20',author_email:'unsafe-private-value',versions:[{version_id:'version',percentage:100}]}]};
        else if(pathname.endsWith('/versions'))result={items:[{id:'version',number:1,annotations:{message:'unsafe-private-value'},metadata:{created_on:'2026-10-20'}}]};
        else if(pathname.endsWith('/subdomain'))result={enabled:true,subdomain:'example',previews_enabled:true};
        else if(pathname.endsWith('/domains'))result=[{hostname:'promodetec.com.br',service:'promodetec',zone_name:'promodetec.com.br'}];
        else if(pathname.endsWith('/zones'))result=[{name:'promodetec.com.br',status:'active',name_servers:[],plan:{name:'Free'}}];
        else if(pathname.endsWith('/buckets'))result={buckets:[{name:'promodetec-cache'}]};
        return Response.json({success:true,result});
      };`);
    const env: NodeJS.ProcessEnv = { PATH: process.env.PATH, NODE_ENV: "test", NODE_OPTIONS: `--import=${pathToFileURL(preload).href}` };
    if (mode !== "missing") Object.assign(env, { CLOUDFLARE_ACCOUNT_ID: "a".repeat(32), CLOUDFLARE_API_TOKEN: fakeToken });
    const result = spawnSync(process.execPath, [script], { cwd: directory, env, encoding: "utf8", timeout: 20_000 });
    assert.equal(result.error, undefined);
    const reportText = fs.readFileSync(path.join(directory, "reports/cloudflare-preflight.json"), "utf8");
    for (const text of [reportText, result.stdout, result.stderr]) {
      assert.equal(text.includes(fakeToken), false);
      assert.equal(text.includes("unsafe-private-value"), false);
    }
    const calls: string[] = fs.existsSync(path.join(directory, "calls.json")) ? JSON.parse(fs.readFileSync(path.join(directory, "calls.json"), "utf8")) : [];
    return { status: result.status, report: JSON.parse(reportText), calls };
  } finally {
    assert.ok(path.resolve(directory).startsWith(path.resolve(os.tmpdir()) + path.sep));
    assert.ok(path.basename(directory).startsWith("promodetec-preflight-"));
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test("auditoria Cloudflare sem credencial falha sem requisição", () => {
  const result = run("missing"); assert.equal(result.status, 1); assert.equal(result.calls.length, 0);
  assert.equal(result.report.productionMutation, false);
});

test("auditoria Cloudflare encerra na primeira recusa e não publica erro privado", () => {
  const result = run("denied"); assert.equal(result.status, 1); assert.equal(result.calls.length, 1);
  assert.equal(result.report.checks.settings.status, 401); assert.deepEqual(result.report.checks.settings.errorCodes, [10000]);
});

test("auditoria Cloudflare usa somente GET e exporta nomes de bindings sem seus valores", () => {
  const result = run("accepted"); assert.equal(result.status, 0); assert.equal(result.calls.length, 8);
  assert.equal(result.report.failure, undefined); assert.equal(result.report.productionMutation, false);
  assert.deepEqual(result.report.checks.settings.data.bindings, [{ name: "SERVER_KEY", type: "secret_text" }]);
  assert.equal(result.report.checks.deployments.data[0].versions[0].percentage, 100);
});
