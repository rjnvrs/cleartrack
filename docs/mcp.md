# ClearTrack MCP adapter

The local demo exposes an authenticated MCP-compatible JSON-RPC endpoint at `/mcp`. `GET /mcp` reports the server metadata, while `POST /mcp` accepts `initialize`, `tools/list`, and `tools/call` requests. The legacy `POST /api/v1/mcp` shape remains supported for simple `{ "tool", "input" }` calls. The authenticated demo session is still required; the adapter does not expose a database, shell, or unrestricted HTTP client.

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

Example tool call:

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "get_issue",
    "arguments": { "issueKey": "CMP-1042" }
  }
}
```
