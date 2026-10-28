import { defineIntegration, validateSearchQuery } from "../tool-contract.js";

export const githubSearch = defineIntegration({
  id: "github-search",
  name: "GitHub Repository Search",
  description: "Search public GitHub repositories using GitHub's official public API.",
  category: "research",
  status: "connected",
  capabilities: ["search-public-repositories", "return-source-links"],
  inputSchema: { query: { type: "string", required: true, minLength: 2, maxLength: 120 } },
  async execute(input, context = {}) {
    const checked = validateSearchQuery(input.query);
    if (!checked.ok) {
      const error = new Error(checked.error);
      error.statusCode = 400;
      throw error;
    }

    const url = new URL("https://api.github.com/search/repositories");
    url.searchParams.set("q", checked.value);
    url.searchParams.set("sort", "updated");
    url.searchParams.set("order", "desc");
    url.searchParams.set("per_page", "8");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await (context.fetch ?? fetch)(url, {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "AllTools-AI/1.0",
        },
        signal: controller.signal,
      });
      if (!response.ok) {
        const error = new Error(response.status === 403 ? "GitHub search rate limit reached. Please retry shortly." : `GitHub API returned ${response.status}.`);
        error.statusCode = response.status === 403 ? 429 : 502;
        throw error;
      }
      const data = await response.json();
      return {
        query: checked.value,
        totalCount: data.total_count ?? 0,
        items: (data.items ?? []).map(repo => ({
          id: repo.id,
          name: repo.full_name,
          description: repo.description ?? "",
          url: repo.html_url,
          language: repo.language ?? "Not specified",
          stars: repo.stargazers_count ?? 0,
          updatedAt: repo.updated_at ?? null,
        })),
      };
    } catch (error) {
      if (error.name === "AbortError") {
        const timeoutError = new Error("GitHub did not respond in time. Please retry.");
        timeoutError.statusCode = 504;
        throw timeoutError;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  },
});
