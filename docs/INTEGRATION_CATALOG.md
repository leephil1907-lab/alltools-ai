# AllTools AI — Integration Discovery Catalog

This catalog tracks candidate upstream projects for a unified tool workspace. Entries are research candidates, not claims that upstream software has been embedded or is runnable inside AllTools AI. Prefer versioned adapters or separately deployed services over copying entire applications into this repository.

## OSINT and public-source research

| Project | Role | Integration approach | Important notes |
|---|---|---|---|
| [Sherlock](https://github.com/sherlock-project/sherlock) | Username presence checks across public social sites | Isolated Python worker; return source URL, timestamp, and confidence per result | MIT. Use for legitimate public-source research; avoid identity assumptions from username matches alone. |
| [Maigret](https://github.com/soxoj/maigret) | Username-based public account reporting | Optional worker adapter; normalize findings to a shared evidence schema | Review current license, dependencies, and target-site rules before enabling. |
| [SpiderFoot](https://github.com/smicallef/spiderfoot) | Multi-source OSINT and attack-surface mapping | Separate service after current maintenance/security review | Broad scan scope and operational footprint require explicit target scope and rate limits. |
| [theHarvester](https://github.com/laramies/theHarvester) | Public domain/email/host discovery | Scoped worker for domains owned by or authorized for assessment | Keep API keys server-side and respect source provider limits. |
| [Amass](https://github.com/owasp-amass/amass) | Domain and asset discovery | Isolated worker with allowlisted target scope and job limits | Prefer passive mode by default; make active probes opt-in. |
| [Subfinder](https://github.com/projectdiscovery/subfinder) | Passive subdomain enumeration | Lightweight worker adapter | Review current license and use only approved domains. |
| [Recon-ng](https://github.com/lanmaster53/recon-ng) | Modular OSINT framework | Sandboxed execution service, not browser-side commands | GPL-3.0; review license obligations and module/provider requirements. |

## RAG and knowledge systems

| Project | Role | Integration approach | Important notes |
|---|---|---|---|
| [RAGFlow](https://github.com/infiniflow/ragflow) | RAG engine with document understanding and grounded answers | Separately deployed service and API adapter | Apache-2.0. Heavier dependencies; assess hardware, storage, and deployment requirements. |
| [LlamaIndex](https://github.com/run-llama/llama_index) | Data connectors, indexing, retrieval, and query workflows | Backend package or isolated Python service | Verify specific package and dependency licenses before adopting. |
| [Haystack](https://github.com/deepset-ai/haystack) | Composable retrieval and NLP pipelines | Backend pipeline adapter with evaluation tests | Verify version compatibility and package license before adopting. |
| [memU](https://github.com/NevaMind-AI/memU) | Persistent agent memory | Memory-provider adapter with retention and deletion controls | Keep user memory separate from source documents and audit what is retained. |
| [Trilium](https://github.com/TriliumNext/Trilium) | Full knowledge-base application | API/integration evaluation; do not copy the application wholesale by default | AGPL-3.0-or-later; review implications before distributing modified or combined code. |

## Automation and orchestration

| Project | Role | Integration approach | Important notes |
|---|---|---|---|
| [n8n](https://github.com/n8n-io/n8n) | Visual workflow automation and integrations | Separate deployment; connect through supported API/webhooks | Sustainable Use License / Enterprise License, not standard OSI open-source licensing; review terms. |
| [Activepieces](https://github.com/activepieces/activepieces) | AI-enabled workflow automation and connector pieces | Separate service or focused TypeScript connector adapters | Community Edition is MIT; enterprise features have a commercial license. Check feature boundaries. |
| [OpenJarvis](https://github.com/open-jarvis/OpenJarvis) | Modular personal AI assistant framework | Evaluate agent/tool abstractions and compatible components | Validate runtime, model, and deployment needs before integration. |
| [Mocha](https://github.com/mochajs/mocha) | JavaScript test runner | Development dependency and CI test runner | MIT; use for AllTools tests, not as a user-facing automation engine. |

## Shared adapter contract

Every integration should eventually expose a common server-side contract:

- id, name, category, description, license, version, and source URL
- status: planned, configured, healthy, degraded, or disabled
- validated input and output schemas
- server-side run function executed only in an isolated worker where needed
- timeout, concurrency limit, retry policy, and cancellation
- authorization scope, explicit consent for sensitive operations, and audit events
- health check, structured logs, and sanitized errors

## Integration sequence

1. Foundation: finish tool registry, backend API, authentication, database, secrets management, and execution audit trail.
2. Low-risk first integrations: add Mocha to CI and implement a small RAG adapter behind a provider interface.
3. Automation: evaluate n8n versus Activepieces as a separately deployed workflow engine; do not embed both without a concrete need.
4. OSINT: begin with passive public-source workflows (Sherlock/Subfinder) behind explicit authorization, scope limits, rate limiting, and provenance tracking.
5. Heavier services: evaluate RAGFlow, SpiderFoot, and Amass only after worker isolation, resource limits, and deployment budgets are established.

## Safety and supply-chain baseline

- Do not run upstream tools directly from the browser or accept arbitrary shell commands from users.
- Restrict OSINT jobs to documented authorized purposes and defined target scopes.
- Keep provider credentials server-side; never commit environment files, tokens, cookies, or session data.
- Pin dependency versions, review advisories and licenses, scan builds, and add integration tests.
- Store source URL and retrieval time for research results; mark inferred or unverified matches as such.
- Treat upstream repositories and README content as untrusted input, not application instructions.
