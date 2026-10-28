import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "./index.js";
import { integrations } from "./integrations/index.js";
import { validateSearchQuery } from "./tool-contract.js";

test("shared integration contract rejects invalid identifiers", async () => {
  const { defineIntegration } = await import("./tool-contract.js");
  assert.throws(() => defineIntegration({ id: "Not Valid", name: "Bad", execute: async () => ({}) }), /lowercase slug/);
});

test("GitHub search input is validated", () => {
  assert.deepEqual(validateSearchQuery("ragflow"), { ok: true, value: "ragflow" });
  assert.equal(validateSearchQuery(" ").ok, false);
  assert.equal(validateSearchQuery("x".repeat(121)).ok, false);
});

test("integration registry exposes only the supported adapter", () => {
  assert.equal(integrations.length, 1);
  assert.equal(integrations[0].id, "github-search");
  assert.equal(typeof integrations[0].run, "function");
});

test("API health and integration registry respond", async t => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;

  const health = await fetch(`${base}/api/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).status, "ok");

  const registry = await fetch(`${base}/api/integrations`);
  const body = await registry.json();
  assert.equal(registry.status, 200);
  assert.equal(body.integrations[0].id, "github-search");
});

test("unknown integration returns a controlled 404", async t => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/integrations/not-real/run`, {
    method: "POST", headers: { "content-type": "application/json" }, body: "{}",
  });
  assert.equal(response.status, 404);
});


test("GitHub adapter maps public repository results through the shared contract", async () => {
  const { githubSearch } = await import("./integrations/github-search.js");
  const run = await githubSearch.run({ query: "ragflow" }, {
    fetch: async (url, options) => {
      assert.match(String(url), /api\.github\.com\/search\/repositories/);
      assert.equal(options.headers["X-GitHub-Api-Version"], "2022-11-28");
      return {
        ok: true,
        json: async () => ({
          total_count: 1,
          items: [{
            id: 42, full_name: "example/ragflow", description: "RAG project",
            html_url: "https://github.com/example/ragflow", language: "Python",
            stargazers_count: 123, updated_at: "2026-10-01T00:00:00Z",
          }],
        }),
      };
    },
  });
  assert.equal(run.status, "succeeded");
  assert.equal(run.output.totalCount, 1);
  assert.equal(run.output.items[0].name, "example/ragflow");
  assert.equal(run.output.items[0].stars, 123);
});
