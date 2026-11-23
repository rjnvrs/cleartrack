# ClearTrack

ClearTrack is a compliance remediation workspace for recording issues, assigning owners, collecting evidence, running a deterministic remediation playbook, and requiring independent human approval before closure.

## Run the demo

Requires Node.js 20 or newer.

```bash
npm run dev
```

Open `http://localhost:4173`. The visual dashboard is available without a login for the design walkthrough; API routes enforce demo sessions and role permissions.

Demo users:

| Account | Role | Use |
| --- | --- | --- |
| `maria@cleartrack.demo` | Issue owner | Assigned issue work, evidence, analysis, review requests |
| `daniel@cleartrack.demo` | Compliance reviewer | Review and approve remediation |
| `admin@cleartrack.demo` | Administrator | Organization-wide issue and user administration |
| `viewer@cleartrack.demo` | Viewer | Read-only dashboard and audit access |

The complete page-by-page workflow is documented in [docs/system-flow.md](docs/system-flow.md). The API is a dependency-free local reference implementation under `/api/v1`. It demonstrates server-side role checks, optimistic issue versions, status transitions, separation of duties, evidence references, audit events, a rules-based missing-evidence playbook, and MCP-compatible JSON-RPC transport at `/mcp`. When running on Node 22.5+ the server persists a SQLite snapshot in `data/cleartrack.sqlite`; it falls back to `data/cleartrack-state.json` on older Node versions. Uploaded evidence is written to `data/evidence` after size and checksum validation, starts quarantined, and is only downloadable after the scan step.

## API examples

```bash
curl -c cookies.txt -H "content-type: application/json" \
  -d '{"email":"maria@cleartrack.demo"}' http://localhost:4173/api/v1/auth/demo-login
curl -b cookies.txt http://localhost:4173/api/v1/issues
curl -b cookies.txt -X POST http://localhost:4173/api/v1/issues/CMP-1042/playbook-runs
```

MCP-compatible handshake and tool discovery:

```bash
curl http://localhost:4173/mcp
curl -b cookies.txt -H "content-type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' http://localhost:4173/mcp
curl -b cookies.txt -H "content-type: application/json" -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' http://localhost:4173/mcp
```

All mutations return structured errors for permission failures, conflicts, invalid transitions, and separation-of-duties violations. The demo API also includes issue audit retrieval, evidence metadata upload/quarantine, playbook run retrieval, and idempotent controlled action execution.
