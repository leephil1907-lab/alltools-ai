import { defineIntegration } from "../tool-contract.js";

function getConfig(context = {}) {
  const baseUrl = (context.env?.RAGFLOW_BASE_URL ?? process.env.RAGFLOW_BASE_URL ?? "").trim().replace(/\/+$/, "");
  const apiKey = (context.env?.RAGFLOW_API_KEY ?? process.env.RAGFLOW_API_KEY ?? "").trim();
  return { baseUrl, apiKey };
}
const configured = Boolean(getConfig().baseUrl && getConfig().apiKey);

function configError() {
  const error = new Error("RAGFlow is not configured. Set RAGFLOW_BASE_URL and RAGFLOW_API_KEY on the server, then restart it.");
  error.statusCode = 503;
  return error;
}

function validateBaseUrl(context = {}) {
  const { baseUrl, apiKey } = getConfig(context);
  if (!baseUrl || !apiKey) throw configError();
  let url;
  try { url = new URL(baseUrl); } catch {
    const error = new Error("RAGFLOW_BASE_URL must be a valid HTTP(S) URL.");
    error.statusCode = 503;
    throw error;
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    const error = new Error("RAGFLOW_BASE_URL must use HTTP or HTTPS.");
    error.statusCode = 503;
    throw error;
  }
  return { origin: url.origin, apiKey };
}

async function requestRagFlow(path, options = {}, context = {}) {
  const { origin, apiKey } = validateBaseUrl(context);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await (context.fetch ?? fetch)(new URL(path, origin), {
      ...options,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      signal: controller.signal,
    });
    let body;
    try { body = await response.json(); } catch { body = null; }
    if (!response.ok) {
      const error = new Error(response.status === 401 || response.status === 403
        ? "RAGFlow rejected the API key or denied access."
        : response.status === 404
          ? "RAGFlow endpoint was not found. Check the configured instance URL and API version."
          : `RAGFlow returned HTTP ${response.status}.`);
      error.statusCode = response.status === 429 ? 429 : 502;
      throw error;
    }
    if (body && typeof body.code === "number" && body.code !== 0) {
      const error = new Error(typeof body.message === "string" ? body.message : "RAGFlow reported an API error.");
      error.statusCode = 502;
      throw error;
    }
    return body;
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error("RAGFlow did not respond within 12 seconds.");
      timeoutError.statusCode = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function requiredText(value, label, max = 2000) {
  if (typeof value !== "string" || !value.trim()) {
    const error = new Error(`${label} is required.`);
    error.statusCode = 400;
    throw error;
  }
  const result = value.trim();
  if (result.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(result)) {
    const error = new Error(`${label} is too long or contains unsupported control characters.`);
    error.statusCode = 400;
    throw error;
  }
  return result;
}

export const ragflowKnowledge = defineIntegration({
  id: "ragflow-knowledge",
  name: "RAGFlow Knowledge Search",
  description: "List RAGFlow datasets and retrieve relevant chunks from selected knowledge bases through a server-side API connection.",
  category: "knowledge",
  status: configured ? "configured" : "needs-configuration",
  capabilities: ["list-datasets", "retrieve-knowledge-chunks", "server-side-api-key"],
  inputSchema: {
    action: { type: "string", required: true, enum: ["datasets", "retrieve"] },
    question: { type: "string", required: false, maxLength: 2000 },
    datasetIds: { type: "array", required: false, itemType: "string", maxItems: 20 },
  },
  async execute(input, context = {}) {
    const action = input?.action;
    if (action === "datasets") {
      const params = new URLSearchParams({ page: "1", page_size: "50", include_parsing_status: "true" });
      const body = await requestRagFlow(`/api/v1/datasets?${params}`, {}, context);
      const data = Array.isArray(body?.data) ? body.data : Array.isArray(body?.data?.datasets) ? body.data.datasets : [];
      return {
        action,
        datasets: data.map(item => ({
          id: item.id ?? item.dataset_id ?? "",
          name: item.name ?? "Untitled dataset",
          documentCount: item.document_count ?? item.doc_num ?? null,
          parsed: item.done_count ?? null,
          parsing: item.running_count ?? null,
          failed: item.fail_count ?? null,
        })),
      };
    }
    if (action === "retrieve") {
      const question = requiredText(input.question, "Question", 2000);
      if (!Array.isArray(input.datasetIds) || input.datasetIds.length < 1 || input.datasetIds.length > 20) {
        const error = new Error("Select between 1 and 20 dataset IDs before searching.");
        error.statusCode = 400;
        throw error;
      }
      const datasetIds = [...new Set(input.datasetIds.map(id => requiredText(id, "Dataset ID", 128)))];
      const body = await requestRagFlow("/api/v1/retrieval", {
        method: "POST",
        body: JSON.stringify({
          question,
          dataset_ids: datasetIds,
          page: 1,
          page_size: 8,
          similarity_threshold: 0.2,
          keyword: true,
          highlight: true,
        }),
      }, context);
      const data = Array.isArray(body?.data) ? body.data : [];
      return {
        action,
        question,
        results: data.map((item, index) => ({
          id: item.id ?? item.chunk_id ?? `chunk-${index + 1}`,
          content: item.content ?? item.chunk_content ?? "",
          documentName: item.document_name ?? item.doc_name ?? "Source document",
          documentId: item.document_id ?? null,
          datasetId: item.dataset_id ?? null,
          similarity: typeof item.similarity === "number" ? item.similarity : typeof item.similarity_score === "number" ? item.similarity_score : null,
          positions: Array.isArray(item.positions) ? item.positions : [],
        })),
      };
    }
    const error = new Error("Choose a supported RAGFlow action: datasets or retrieve.");
    error.statusCode = 400;
    throw error;
  },
});
