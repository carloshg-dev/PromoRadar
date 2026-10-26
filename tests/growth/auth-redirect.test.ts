import test from "node:test";
import assert from "node:assert/strict";
import { safeAuthDestination } from "../../src/core/auth-redirect";

test("destino de login mantém caminhos internos, busca e fragmento", () => {
  for (const value of ["/", "/admin", "/conta?tab=perfil#salvos", "/ofertas?busca=fone%20bluetooth"]) {
    assert.equal(safeAuthDestination(value), value);
    assert.equal(new URL(safeAuthDestination(value), "https://site.test").origin, "https://site.test");
  }
  assert.equal(safeAuthDestination("/ofertas/../admin"), "/admin");
});

test("destino público rejeita código, domínio, usuário na URL, barras e controles", () => {
  const invalid = [null, undefined, "", "javascript:alert(1)", "data:text/html,test", "https://external.test/",
    "@external.test/", ".external.test/", "//external.test/", "/\\external.test/", "/a\\b", "/a/..//external.test/",
    " /admin", "/\n/admin", "/\tadmin", "/admin\u0000", "/admin\u007f", "/" + "a".repeat(2048)];
  for (const value of invalid) {
    assert.equal(safeAuthDestination(value), "/", String(value));
    assert.equal(new URL(safeAuthDestination(value), "https://site.test").origin, "https://site.test");
  }
  assert.equal(new URL("https://site.test" + "@external.test/").hostname, "external.test", "reproduz o desvio da concatenação anterior sem fazer requisição");
});
