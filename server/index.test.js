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

test("integration registry exposes GitHub and RAGFlow adapters", () => {
  assert.equal(integrations.length, 2);
  assert.deepEqual(integrations.map(item => item.id), ["github-search", "ragflow-knowledge"]);
  assert.ok(integrations.every(item => typeof item.run === "function"));
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


test("RAGFlow dataset listing uses server-side bearer auth and maps datasets", async () => {
  const { ragflowKnowledge } = await import("./integrations/ragflow-knowledge.js");
  const run = await ragflowKnowledge.run({ action: "datasets" }, {
    env: { RAGFLOW_BASE_URL: "https://rag.example.test/", RAGFLOW_API_KEY: "secret-test-key" },
    fetch: async (url, options) => {
      assert.equal(new URL(url).pathname, "/api/v1/datasets");
      assert.equal(new URL(url).searchParams.get("include_parsing_status"), "true");
      assert.equal(options.headers.Authorization, "Bearer secret-test-key");
      return { ok: true, json: async () => ({ code: 0, data: [{ id: "ds-1", name: "Docs", done_count: 4, running_count: 1 }] }) };
    },
  });
  assert.equal(run.status, "succeeded");
  assert.deepEqual(run.output.datasets[0], { id: "ds-1", name: "Docs", documentCount: null, parsed: 4, parsing: 1, failed: null });
});

test("RAGFlow retrieval validates dataset IDs and maps source chunks", async () => {
  const { ragflowKnowledge } = await import("./integrations/ragflow-knowledge.js");
  await assert.rejects(() => ragflowKnowledge.run({ action: "retrieve", question: "test", datasetIds: [] }, {
    env: { RAGFLOW_BASE_URL: "https://rag.example.test", RAGFLOW_API_KEY: "secret" },
  }), /Select between 1 and 20 dataset IDs/);
  const run = await ragflowKnowledge.run({ action: "retrieve", question: "How does this work?", datasetIds: ["ds-1"] }, {
    env: { RAGFLOW_BASE_URL: "https://rag.example.test", RAGFLOW_API_KEY: "secret" },
    fetch: async (url, options) => {
      assert.equal(new URL(url).pathname, "/api/v1/retrieval");
      const body = JSON.parse(options.body);
      assert.deepEqual(body.dataset_ids, ["ds-1"]);
      assert.equal(body.question, "How does this work?");
      return { ok: true, json: async () => ({ code: 0, data: { chunks: [{ id: "chunk-1", content: "Grounded source passage", document_keyword: "guide.pdf", similarity: 0.91 }] } }) };
    },
  });
  assert.equal(run.output.results[0].content, "Grounded source passage");
  assert.equal(run.output.results[0].documentName, "guide.pdf");
  assert.equal(run.output.results[0].similarity, 0.91);
});

test("RAGFlow adapter fails clearly when server credentials are missing", async () => {
  const { ragflowKnowledge } = await import("./integrations/ragflow-knowledge.js");
  await assert.rejects(() => ragflowKnowledge.run({ action: "datasets" }, { env: {} }), error => error.statusCode === 503 && /RAGFlow is not configured/.test(error.message));
});
