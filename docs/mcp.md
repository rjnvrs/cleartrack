# ClearTrack MCP adapter

The local demo exposes a narrow JSON endpoint at `POST /api/v1/mcp`. It accepts either `{ "tool", "input" }` or a JSON-RPC-shaped `{ "id", "method", "params" }` request. The authenticated demo session is still required; the adapter does not expose a database, shell, or unrestricted HTTP client.

Available tools:

- `list_issues`
- `get_issue`
- `list_issue_evidence`
- `get_issue_audit`
- `analyze_issue`
- `add_issue_comment`
- `add_evidence_reference`
- `request_action_approval`

The same role, issue ownership, version, action allowlist, and separation-of-duties rules apply to MCP calls and browser actions. Analysis creates a recorded deterministic run. Approval requests create a pending human review; the MCP adapter cannot approve or close its own action.
