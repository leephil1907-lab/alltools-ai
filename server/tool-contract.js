export const TOOL_API_VERSION = "1.0";

export function defineIntegration({ id, name, description, category, status = "connected", capabilities = [], inputSchema, execute }) {
  if (!id || !/^[a-z0-9-]+$/.test(id)) throw new TypeError("Integration id must be a lowercase slug");
  if (!name || typeof execute !== "function") throw new TypeError("Integration name and execute function are required");
  return Object.freeze({
    id, name, description, category, status, capabilities,
    inputSchema: inputSchema ?? {},
    async run(input, context = {}) {
      const startedAt = new Date().toISOString();
      const output = await execute(input ?? {}, context);
      return { integrationId: id, status: "succeeded", startedAt, finishedAt: new Date().toISOString(), output };
    },
  });
}

export function validateSearchQuery(value) {
  if (typeof value !== "string") return { ok: false, error: "Enter a search query." };
  const query = value.trim();
  if (query.length < 2) return { ok: false, error: "Enter at least 2 characters." };
  if (query.length > 120) return { ok: false, error: "Search queries must be 120 characters or fewer." };
  if (/[\u0000-\u001f]/.test(query)) return { ok: false, error: "The query contains unsupported control characters." };
  return { ok: true, value: query };
}
