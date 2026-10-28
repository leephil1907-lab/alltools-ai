import http from "node:http";
import { randomUUID } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { integrationMap, integrations, publicIntegration } from "./integrations/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const distDir = path.join(root, "dist");
const PORT = Number(process.env.PORT || 8787);
const MAX_BODY_BYTES = 16 * 1024;
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 60;
const runHistory = [];
const requestWindows = new Map();

function json(res, statusCode, body) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let body = "";
    req.on("data", chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        const error = new Error("Request body is too large.");
        error.statusCode = 413;
        reject(error);
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); }
      catch { const error = new Error("Request body must be valid JSON."); error.statusCode = 400; reject(error); }
    });
    req.on("error", reject);
  });
}

function rateLimit(req) {
  const key = req.socket.remoteAddress ?? "unknown";
  const now = Date.now();
  const window = requestWindows.get(key);
  if (!window || now - window.startedAt >= WINDOW_MS) {
    requestWindows.set(key, { startedAt: now, count: 1 });
    return false;
  }
  window.count += 1;
  return window.count > MAX_REQUESTS_PER_WINDOW;
}

function recordRun(run) {
  runHistory.unshift(run);
  if (runHistory.length > 50) runHistory.length = 50;
}

async function serveStatic(req, res, pathname) {
  let decodedPath;
  try { decodedPath = decodeURIComponent(pathname); } catch { return json(res, 400, { error: "Invalid path encoding." }); }
  let requested = decodedPath === "/" ? "index.html" : decodedPath.replace(/^\/+/, "");
  let target = path.resolve(distDir, requested);
  if (!target.startsWith(distDir + path.sep) && target !== distDir) return json(res, 400, { error: "Invalid path." });
  try {
    const info = await stat(target);
    if (!info.isFile()) throw new Error("not a file");
  } catch {
    target = path.join(distDir, "index.html");
  }
  try {
    const body = await readFile(target);
    const ext = path.extname(target);
    const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".json": "application/json; charset=utf-8", ".txt": "text/plain; charset=utf-8" };
    res.writeHead(200, { "Content-Type": types[ext] ?? "application/octet-stream", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin" });
    res.end(body);
  } catch {
    json(res, 503, { error: "Frontend build not found. Run npm run build first." });
  }
}

export function createServer() {
  return http.createServer(async (req, res) => {
    const base = `http://localhost`;
    let pathname;
    try { pathname = new URL(req.url, base).pathname; }
    catch { return json(res, 400, { error: "Invalid URL." }); }

    if (pathname.startsWith("/api/") && rateLimit(req)) {
      return json(res, 429, { error: "Too many requests. Please wait a moment and retry." });
    }

    if (req.method === "GET" && pathname === "/api/health") {
      return json(res, 200, { status: "ok", service: "alltools-api", apiVersion: "1.0", integrations: integrations.length, uptimeSeconds: Math.floor(process.uptime()) });
    }
    if (req.method === "GET" && pathname === "/api/integrations") {
      return json(res, 200, { apiVersion: "1.0", integrations: integrations.map(publicIntegration) });
    }
    if (req.method === "GET" && pathname === "/api/tools") {
      return json(res, 200, { apiVersion: "1.0", tools: integrations.map(item => ({ id: item.id, name: item.name, status: item.status, category: item.category, capabilities: item.capabilities })) });
    }
    if (req.method === "GET" && pathname === "/api/runs") {
      return json(res, 200, { runs: runHistory });
    }

    if (req.method === "GET" && pathname === "/api/ai/status") {
      const configured = Boolean(process.env.AI_API_KEY);
      return json(res, 200, {
        configured,
        provider: configured ? (process.env.AI_PROVIDER || "openai-compatible") : null,
        model: configured ? (process.env.AI_MODEL || "gpt-4o-mini") : null,
        message: configured ? "AI provider credentials are configured." : "Add AI_API_KEY in the Render environment to enable live AI responses."
      });
    }

    if (req.method === "POST" && pathname === "/api/ai/chat") {
      try {
        const input = await readJson(req);
        const message = typeof input.message === "string" ? input.message.trim() : "";
        if (!message) return json(res, 400, { error: "Enter a message to continue." });
        if (message.length > 6000) return json(res, 413, { error: "Message is too long. Keep it under 6,000 characters." });
        const apiKey = process.env.AI_API_KEY;
        if (!apiKey) return json(res, 503, { error: "AI provider is not configured yet. Add AI_API_KEY in the Render environment, then restart the service." });
        const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
        const model = process.env.AI_MODEL || "gpt-4o-mini";
        const providerResponse = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: "You are AllTools AI, a helpful, precise assistant inside a multi-tool workspace. Be honest about limitations, do not claim to run tools unless a tool result is provided, and give actionable answers." },
              ...(Array.isArray(input.history) ? input.history.slice(-10).filter(item => item && ["user", "assistant"].includes(item.role) && typeof item.content === "string").map(item => ({ role: item.role, content: item.content.slice(0, 6000) })) : []),
              { role: "user", content: message }
            ],
            temperature: 0.4
          }),
          signal: AbortSignal.timeout(45000)
        });
        const data = await providerResponse.json().catch(() => ({}));
        if (!providerResponse.ok) {
          const status = providerResponse.status === 401 || providerResponse.status === 403 ? 502 : providerResponse.status === 429 ? 429 : 502;
          return json(res, status, { error: data.error?.message || "The AI provider request failed. Check the provider settings and try again." });
        }
        const answer = data.choices?.[0]?.message?.content;
        if (typeof answer !== "string" || !answer.trim()) return json(res, 502, { error: "The AI provider returned an empty response." });
        const run = { id: randomUUID(), integrationId: "ai-assistant", status: "succeeded", startedAt: new Date().toISOString(), output: { model, answer: answer.trim() } };
        recordRun(run);
        return json(res, 200, { answer: answer.trim(), model, runId: run.id });
      } catch (error) {
        return json(res, error.name === "TimeoutError" ? 504 : (error.statusCode ?? 502), { error: error.name === "TimeoutError" ? "The AI provider took too long to respond. Please retry." : (error.message || "AI request failed.") });
      }
    }

    const match = pathname.match(/^\/api\/integrations\/([a-z0-9-]+)\/run$/);
    if (req.method === "POST" && match) {
      const integration = integrationMap.get(match[1]);
      if (!integration) return json(res, 404, { error: "Integration not found." });
      try {
        const input = await readJson(req);
        const result = await integration.run(input);
        const run = { id: randomUUID(), ...result };
        recordRun(run);
        return json(res, 200, run);
      } catch (error) {
        return json(res, error.statusCode ?? 502, { error: error.message || "Integration failed." });
      }
    }

    if (pathname.startsWith("/api/")) return json(res, 404, { error: "API endpoint not found." });
    if (req.method !== "GET" && req.method !== "HEAD") return json(res, 405, { error: "Method not allowed." });
    return serveStatic(req, res, pathname);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createServer().listen(PORT, "0.0.0.0", () => {
    console.log(`AllTools API listening on port ${PORT}`);
  });
}
