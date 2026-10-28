import { githubSearch } from "./github-search.js";
import { ragflowKnowledge } from "./ragflow-knowledge.js";

export const integrations = [githubSearch, ragflowKnowledge];
export const integrationMap = new Map(integrations.map(integration => [integration.id, integration]));

export function publicIntegration(integration) {
  return {
    id: integration.id,
    name: integration.name,
    description: integration.description,
    category: integration.category,
    status: integration.status,
    capabilities: integration.capabilities,
    inputSchema: integration.inputSchema,
  };
}
