# AllTools AI

A unified workspace shell for AI, knowledge management, creative tools, developer utilities, and defensive security research.

## Current status

This repository starts with a responsive React/Vite dashboard and an extensible tool catalogue. It is an application foundation, not a claim that every upstream tool is already integrated. Each module shows its current status so planned capabilities are not mistaken for working integrations.

## Tool families

- **AI workspace:** assistant shell, persistent-memory concept, agent workbench concept.
- **Knowledge:** notes, research, document workspace.
- **Creative studio:** portrait/avatar, voice, and portfolio modules.
- **Developer lab:** JavaScript testing and developer utilities.
- **Security lab:** authorized OSINT research, defensive password audits, and network-privacy diagnostics.
- **System tools:** service status and diagnostics.
- **RAG studio:** document ingestion and retrieval-grounded AI knowledge workflows.
- **Automation hub:** workflow orchestration, web research, and background jobs.

## Run locally

Requirements: Node.js 20+ recommended.

```bash
npm install
npm run dev:api
```

In a second terminal, start the Vite frontend:

```bash
npm run dev
```

The frontend proxies `/api` requests to the API server on port `8787`.

For a production build:

```bash
npm test
npm run build
npm start
```

`npm start` serves the built frontend and API together on `PORT` (defaults to `8787`).

The dashboard has a Node.js HTTP API, a shared integration contract, input validation, bounded in-memory run history, request-size and rate limits, health/registry endpoints, a live GitHub public-repository search adapter, and a RAGFlow knowledge adapter. Run history is process-memory only and resets on restart; user accounts, durable storage, provider-backed general AI, and isolated execution workers are not implemented yet.

## Planned architecture

- `apps/web`: React dashboard and user experience.
- `server/`: API server, shared tool contract, integration registry, and tests.
- `server/integrations/`: separately reviewed adapters. The GitHub public repository search is the first live adapter.
- `docs/`: architecture decisions, threat model, setup, and integration guides.

## Integration principles

1. Review source code, maintenance, dependencies, model requirements, and licenses before incorporating upstream code.
2. Prefer adapters and isolated services over copying entire projects into the web app.
3. Never expose API keys or privileged execution in browser code.
4. Require authentication and explicit approval for sensitive actions.
5. Run security utilities only for systems and accounts the user is authorized to assess.
6. Add tests and CI checks before enabling production integrations.
7. Use `GET /api/health`, `GET /api/integrations`, `GET /api/tools`, and `GET /api/runs` to inspect the runtime.
8. Execute an adapter with `POST /api/integrations/github-search/run` and JSON body `{"query":"RAGFlow"}`. Results are public repository metadata and link back to GitHub.
9. Configure RAGFlow on the server with `RAGFLOW_BASE_URL` (your instance URL, without a path suffix) and `RAGFLOW_API_KEY`. Never put the key in frontend variables or commit it. See `.env.example` for the variable names.
10. Call `POST /api/integrations/ragflow-knowledge/run` with `{"action":"datasets"}` to list datasets, or `{"action":"retrieve","question":"What does the documentation say?","datasetIds":["YOUR_DATASET_ID"]}` to retrieve relevant passages. The API key is sent only from the backend to RAGFlow. A reachable RAGFlow instance and at least one indexed dataset are required for real results.

## Integration discovery catalog

See [docs/INTEGRATION_CATALOG.md](docs/INTEGRATION_CATALOG.md) for additional OSINT, RAG, and automation repositories, integration approaches, license notes, and a phased plan.

## Upstream projects under evaluation

- [Personal portfolio reference](https://github.com/rajaprerak/rajaprerak.github.io)
- [Trilium](https://github.com/TriliumNext/Trilium)
- [memU](https://github.com/NevaMind-AI/memU)
- [OpenJarvis](https://github.com/open-jarvis/OpenJarvis)
- [PersonaLive](https://github.com/GVCLab/PersonaLive)
- [Mocha](https://github.com/mochajs/mocha)
- [CUPP](https://github.com/Mebus/cupp)
- [GHunt](https://github.com/mxrch/GHunt)
- [IPGhost](https://github.com/s-r-e-e-r-a-j/IPGhost)

No upstream source is copied into this initial dashboard. License and runtime compatibility must be assessed module by module.
