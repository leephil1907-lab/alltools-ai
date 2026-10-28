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
npm run dev
```

For a production build:

```bash
npm run build
npm run preview
```

The initial dashboard uses local UI state and does not require API keys. Provider-backed AI, persistence, authentication, execution workers, and upstream integrations are not configured yet.

## Planned architecture

- `apps/web`: React dashboard and user experience.
- `services/api`: authenticated API and tool registry.
- `services/workers`: isolated jobs for compatible upstream tools.
- `packages/tool-sdk`: shared module contracts, status, permissions, and audit events.
- `integrations/`: separately licensed and version-pinned adapters.
- `docs/`: architecture decisions, threat model, setup, and integration guides.

## Integration principles

1. Review source code, maintenance, dependencies, model requirements, and licenses before incorporating upstream code.
2. Prefer adapters and isolated services over copying entire projects into the web app.
3. Never expose API keys or privileged execution in browser code.
4. Require authentication and explicit approval for sensitive actions.
5. Run security utilities only for systems and accounts the user is authorized to assess.
6. Add tests and CI checks before enabling production integrations.

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
